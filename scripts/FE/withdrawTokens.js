const BigNumber = web3.utils.BN;

const DutchSwapAuction = artifacts.require("DutchSwapAuction");

function randomValue(num) {
  return Math.floor(Math.random() * num) + 1; // (1-num) value
}

function weiToEther(w) {
  // let eth = web3.utils.fromWei(w.toString(), "ether");
  // return Math.round(parseFloat(eth));
  return web3.utils.fromWei(w.toString(), "ether");
}

advanceTime = (time) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [time],
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });
};

advanceBlock = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        const newBlockHash = web3.eth.getBlock("latest").hash;

        return resolve(newBlockHash);
      }
    );
  });
};

advanceTimeAndBlock = async (time) => {
  await advanceTime(time);
  await advanceBlock();
  return Promise.resolve(web3.eth.getBlock("latest"));
};

//truffle exec scripts/FE/commitEther.js noOfBidders(uint) (Till 48)

module.exports = async (callback) => {
  try {
    let dutchSwapAuction = await DutchSwapAuction.deployed();

    accounts = await web3.eth.getAccounts();

    //Changed
    let amount = process.argv[4];

    // Time is flying away, and auction ends
    console.log("Time is flying...");
    let advancement = 86400 * 2; // 2 Days
    await advanceTimeAndBlock(advancement);
    let hasAuctionEnded = await dutchSwapAuction.auctionEnded();
    console.log("Has Auction ended?", hasAuctionEnded);

    // The owner finalizes the auction
    await dutchSwapAuction.finaliseAuction();

    // Bidders withdraw auction tokens after auction is finalized
    for (let i = 1; i <= amount; i++) {
      let tokensClaimable = await dutchSwapAuction.tokensClaimable(accounts[i]);
      console.log("Bidder: Account", i);
      console.log("Amount of tokens withdrawn:", weiToEther(tokensClaimable));

      await dutchSwapAuction.withdrawTokens({ from: accounts[i] });
    }

    let price = await dutchSwapAuction.priceFunction();
    let averagePrice = await dutchSwapAuction.tokenPrice();
    let priceGradient = await dutchSwapAuction.priceGradient();
    let tokenSupply = await dutchSwapAuction.tokenSupply.call();
    let amountRaised = await dutchSwapAuction.amountRaised.call();
    let tokenSoldAccounting = await dutchSwapAuction.tokenSold.call();
    let tokensSoldRealValue =
      weiToEther(amountRaised) / weiToEther(averagePrice);

    console.log("\n==== General Info ===");
    console.log("Current auction price:", weiToEther(price), "ether");
    console.log("Average auction price:", weiToEther(averagePrice), "ether");
    console.log("Price Gradient:", weiToEther(priceGradient), "ether");
    console.log("Total token supply:", weiToEther(tokenSupply));
    console.log("Amount Raised:", weiToEther(amountRaised), "ether");
    console.log("Tokens Sold Accounting:", weiToEther(tokenSoldAccounting));
    console.log("Tokens Sold Real Value:", tokensSoldRealValue, "KTY");


    // the owner transfers any unbidden tokens and any surplus tokens out of the contract
    // This can be done by the owner at any time after finalizing auction
    let tokenSurplus = 0
    let leftOver;

    if (weiToEther(tokenSupply) < tokensSoldRealValue) {
      let insufficiency = tokensSoldRealValue - Number(weiToEther(tokenSupply));
      console.log("Auction Tokens Sold Real Value Above Total Token Supply", insufficiency, "KTY");
      if (insufficiency < 0.000001) {  // most often in this case
        tokenSurplus = 99
      }
      if (insufficiency < 100) {
        tokenSurplus = 100 - insufficiency
      }
  
      if (tokenSurplus > 0) { 
        console.log("Total surplus:", tokenSurplus)
        dutchSwapAuction.transferLeftOver(tokenSurplus, accounts[0]);  // this can be done at any time after finalizing the auction
      }
    }

    if (weiToEther(tokenSupply) == tokensSoldRealValue) {
      leftOver = new BigNumber(
        web3.utils.toWei("100", "ether")  // 100 KTY which is unused
      );
      console.log("Unused surplus: 100 KTY")
      dutchSwapAuction.transferLeftOver(leftOver, accounts[0]);
    }

    // transfer any unbidded auction tokens to a new address, so those unbidded tokens
    // won't be locked in this contract
    if (weiToEther(tokenSupply) > tokensSoldRealValue) {
      leftOver = Number(weiToEther(tokenSupply)) - tokensSoldRealValue + 100;
      console.log("Unbidded Auction Tokens and Unused Surplus:", leftOver, "KTY");
      let unbiddedTokens = new BigNumber(
        web3.utils.toWei(leftOver.toString(), "ether")
      );
      dutchSwapAuction.transferLeftOver(unbiddedTokens, accounts[0]);
    }

    callback();
  } catch (e) {
    callback(e);
  }
};
