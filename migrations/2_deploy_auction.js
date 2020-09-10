const BigNumber = web3.utils.BN;

//ARTIFACTS
const DutchSwapAuction = artifacts.require("DutchSwapAuction");
const KittieFightToken = artifacts.require("KittieFightToken");

//Rinkeby address of KittieFightToken
//const KTY_ADDRESS = '0x8d05f69bd9e804eb467c7e1f2902ecd5e41a72da';

const ERC20_TOKEN_SUPPLY = new BigNumber(
  web3.utils.toWei("100000000", "ether") //100 Million
);

module.exports = (deployer, network, accounts) => {
  deployer
    .deploy(KittieFightToken, ERC20_TOKEN_SUPPLY)
    .then(() => deployer.deploy(DutchSwapAuction))
    .then(async () => {
      console.log("\nGetting contract instances...");

      // DutchSwapAuction
      dutchSwapAuction = await DutchSwapAuction.deployed();
      console.log("DutchSwapAuction:", dutchSwapAuction.address);

      // TOKENS
      kittieFightToken = await KittieFightToken.deployed();
      console.log(kittieFightToken.address);

      // initializing contract ...
      let token = kittieFightToken.address
      let tokenSupply = new BigNumber(
        web3.utils.toWei("100100", "ether") //100,100 KTY
      );
      //let startDate = Math.floor(new Date().getTime() / 1000)   // now 
      //let endDate = startDate + 30 * 24 * 60 * 60  // end in 30 days
      let auctionDuration = 30 * 24 * 60 * 60  // end in 30 days
      let startPrice = new BigNumber(
        web3.utils.toWei("0.01", "ether") // 0.01 x 300 = $3
      );
      let minimumPrice = new BigNumber(
        web3.utils.toWei("0.001", "ether") // 0.001 x 300 = $0.3
      );
      let withdrawDelay = 3 * 24 * 60 * 60 // delay 3 days in withdraw
      let wallet = accounts[0]

      await kittieFightToken.approve(dutchSwapAuction.address, tokenSupply)

      await dutchSwapAuction.initDutchAuction(
        token, tokenSupply, auctionDuration, startPrice, minimumPrice, withdrawDelay, wallet
      )
    });
};
