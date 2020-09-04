pragma solidity ^0.6.9;
// SPDX-License-Identifier: GPL-3.0-or-later

import "./authority/Owned.sol";
import "./libs/SafeMath.sol";
import "./interfaces/IERC20.sol";


// ----------------------------------------------------------------------------------
// DutchSwap Auction Contract
//
//
// This contract is modified from the contract by (c) Adrian Guerrera. Deepyr Pty Ltd.  
// (https://github.com/apguerrera/DutchSwap)
//                        
// Sep 02 2020                                  
// -----------------------------------------------------------------------------------


contract DutchSwapAuction is Owned {

    using SafeMath for uint256;
    uint256 private constant TENPOW18 = 10 ** 18;
    /// @dev The placeholder ETH address.
    address private constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    uint256 public amountRaised;
    uint256 public startDate;
    uint256 public endDate;
    uint256 public startPrice;
    uint256 public minimumPrice;
    uint256 public tokenSupply;
    uint256 public tokenSold;
    bool public finalised;
    uint256 public withdrawDelay;   // delay in seconds preventing withdraws
    IERC20 public auctionToken; 
    //IERC20 public paymentCurrency; 
    address payable public wallet;
    mapping(address => uint256) public commitments;

    uint256 private unlocked = 1;

    event AddedCommitment(address addr, uint256 commitment, uint256 price);

    modifier lock() {
        require(unlocked == 1, 'Locked');
        unlocked = 0;
        _;
        unlocked = 1;
    }       

    /// @dev Init function 
    function initDutchAuction(
        address _token, 
        uint256 _tokenSupply, 
        //uint256 _startDate, 
        uint256 _auctionDuration,
        //address _paymentCurrency, 
        uint256 _startPrice, 
        uint256 _minimumPrice,
        uint256 _withdrawDelay,
        address payable _wallet
    ) 
        external onlyOwner
    {
        require(_auctionDuration > 0);
        require(_startPrice > _minimumPrice);
        require(_minimumPrice > 0);

        auctionToken = IERC20(_token);
        //paymentCurrency = IERC20(_paymentCurrency);

        require(IERC20(auctionToken).transferFrom(msg.sender, address(this), _tokenSupply));

        tokenSupply =_tokenSupply.sub(100000000000000000000);
        startDate = block.timestamp;
        endDate = block.timestamp.add(_auctionDuration);
        startPrice = _startPrice;
        minimumPrice = _minimumPrice; 
        withdrawDelay = _withdrawDelay;
        wallet = _wallet;
        finalised = false;
    }


    // Dutch Auction Price Function
    // ============================
    //  
    // Start Price ----- 
    //                   \ 
    //                    \
    //                     \
    //                      \ ------------ Clearing Price
    //                     / \            = AmountRaised/TokenSupply
    //      Token Price  --   \
    //                  /      \ 
    //                --        ----------- Minimum Price
    // Amount raised /          End Time
    //

    /// @notice The average price of each token from all commitments. 
    function tokenPrice() public view returns (uint256) {
        return amountRaised.mul(TENPOW18).div(tokenSold);
    }

    /// @notice Token price decreases at this rate during auction.
    function priceGradient() public view returns (uint256) {
        uint256 numerator = startPrice.sub(minimumPrice);
        uint256 denominator = endDate.sub(startDate);
        return numerator.div(denominator);
    }

      /// @notice Returns price during the auction 
    function priceFunction() public view returns (uint256) {
        /// @dev Return Auction Price
        if (now <= startDate) {
            return startPrice;
        }
        if (now >= endDate) {
            return minimumPrice;
        }
        uint256 priceDiff = now.sub(startDate).mul(priceGradient());
        uint256 price = startPrice.sub(priceDiff);
        return price;
    }

    /// @notice How many tokens the user is able to claim
    function tokensClaimable(address _user) public view returns (uint256) {
        if(!auctionEnded())
            return 0;
        return commitments[_user].mul(TENPOW18).div(tokenPrice());
    }

    /// @notice Returns bool if successful or time has ended
    function auctionEnded() public view returns (bool){
        return now > endDate;
    }

    /// @notice Returns true and 0 if delay time is 0, otherwise false and delay time (in seconds) 
    function checkWithdraw() public view returns (bool, uint256) {
        uint256 _elapsed = block.timestamp.sub(endDate);
        if (_elapsed >= withdrawDelay) {
            return (true, 0);
        } 
        
        return (false, withdrawDelay.sub(_elapsed));
    }

    //--------------------------------------------------------
    // Commit to buying tokens 
    //--------------------------------------------------------

    /// @notice Buy Tokens by committing ETH to this contract address 
    receive () external payable {
        commitEth(msg.sender);
    }

    /// @notice Commit ETH to buy tokens on sale
    function commitEth (address payable _from) public payable lock {
        //require(address(paymentCurrency) == ETH_ADDRESS);
        require(block.timestamp >= startDate && block.timestamp <= endDate);

        uint256 tokensToPurchase = msg.value.mul(TENPOW18).div(priceFunction());
        // Get ETH able to be committed
        uint256 tokensPurchased = calculatePurchasable(tokensToPurchase);

        tokenSold = tokenSold.add(tokensPurchased);

        // Accept ETH Payments
        uint256 ethToTransfer = tokensPurchased < tokensToPurchase ? msg.value.mul(tokensPurchased).div(tokensToPurchase) : msg.value;

        uint256 ethToRefund = msg.value.sub(ethToTransfer);
        if (ethToTransfer > 0) {
            addCommitment(_from, ethToTransfer);
        }
        // Return any ETH to be refunded
        if (ethToRefund > 0) {
            _from.transfer(ethToRefund);
        }
    }

    /// @notice Commits to an amount during an auction
    function addCommitment(address _addr,  uint256 _commitment) internal {
        require(now >= startDate && now <= endDate);
        commitments[_addr] = commitments[_addr].add(_commitment);
        amountRaised = amountRaised.add(_commitment);
        emit AddedCommitment(_addr, _commitment, tokenPrice());
    }

    /// @notice Returns the amount able to be committed during an auction
    function calculatePurchasable(uint256 _tokensToPurchase) 
        public view returns (uint256)
    {
        uint256 maxPurchasable = tokenSupply.sub(tokenSold);
        if (_tokensToPurchase > maxPurchasable) {
            return maxPurchasable;
        }
        return _tokensToPurchase;
    }

    //--------------------------------------------------------
    // Modify WithdrawDelay In Auction 
    //--------------------------------------------------------

    /// @notice Removes withdraw delay
    /// @dev This function can only be carreid out by the owner of this contract.
    function removeWithdrawDelay() external onlyOwner {
        withdrawDelay = 0;
    }
    
    /// @notice Add withdraw delay
    /// @dev This function can only be carreid out by the owner of this contract.
    function addWithdrawDelay(uint256 _delay) external onlyOwner {
        withdrawDelay = withdrawDelay.add(_delay);
    }


    //--------------------------------------------------------
    // Finalise Auction
    //--------------------------------------------------------

    /// @notice Auction finishes successfully above the reserve
    /// @dev Transfer contract funds to initialised wallet. 
    function finaliseAuction () public {
        require(!finalised && auctionEnded());
        finalised = true;

        //_tokenPayment(paymentCurrency, wallet, amountRaised);
        wallet.transfer(amountRaised);
    }

    /// @notice Withdraw your tokens once the Auction has ended.
    function withdrawTokens() public lock {
        require(auctionEnded(), "DutchSwapAuction: Auction still live");
        (bool canWithdraw,) = checkWithdraw();
        require(canWithdraw == true, "DutchSwapAuction: Withdraw Delay");
        uint256 fundsCommitted = commitments[ msg.sender];
        uint256 tokensToClaim = tokensClaimable(msg.sender);
        commitments[ msg.sender] = 0;

        /// @notice Successful auction! Transfer tokens bought.
        if (tokensToClaim > 0 ) {
            _tokenPayment(auctionToken, msg.sender, tokensToClaim);
        }
    }

    /// @notice Transfer unbidded auction token to a new address after auction ends
    /// @dev This function can only be carreid out by the owner of this contract.
    function transferLeftOver(uint256 _amount, address payable _addr) external onlyOwner returns (bool) {
        require(_amount > 0, "Cannot transfer 0 tokens");
        _tokenPayment(auctionToken, _addr, _amount);
        return true;
    }

    /// @dev Helper function to handle both ETH and ERC20 payments
    function _tokenPayment(IERC20 _token, address payable _to, uint256 _amount) internal {
        if (address(_token) == ETH_ADDRESS) {
            _to.transfer(_amount); 
        } else {
            require(_token.transfer(_to, _amount));
        }
    }

}