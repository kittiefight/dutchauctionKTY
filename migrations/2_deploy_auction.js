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

      // VestingVault12
      dutchSwapAuction = await DutchSwapAuction.deployed();
      console.log("DutchSwapAuction:", dutchSwapAuction.address);

      // TOKENS
      kittieFightToken = await KittieFightToken.deployed();
      console.log(kittieFightToken.address);
    });
};
