const BigNumber = web3.utils.BN;
require("chai")
  .use(require("chai-shallow-deep-equal"))
  .use(require("chai-bignumber")(BigNumber))
  .use(require("chai-as-promised"))
  .should();

//ARTIFACTS
const DutchSwapAuction = artifacts.require("DutchSwapAuction");
const KittieFightToken = artifacts.require("KittieFightToken");

const { assert } = require("chai");

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

//Contract instances
let dutchSwapAuction, kittieFightToken;

contract("DutchSwapAuction", (accounts) => {
  it("instantiate contracts", async () => {
    // DutchSwapAuction
    dutchSwapAuction = await DutchSwapAuction.deployed();
    // TOKENS
    kittieFightToken = await KittieFightToken.deployed();
  });

  it("shows the auction details", async () => {
    let startDate = await dutchSwapAuction.startDate.call();
    let endDate = await dutchSwapAuction.endDate.call();
    let price = await dutchSwapAuction.priceFunction();
    let hasAuctionEnded = await dutchSwapAuction.auctionEnded();
    let tokenSupply = await dutchSwapAuction.tokenSupply.call();
    let tokenSold = await dutchSwapAuction.tokenSold.call();
    let amountRaised = await dutchSwapAuction.amountRaised.call();

    console.log("Auction start date:", startDate.toString());
    console.log("Auction end date:", endDate.toString());
    console.log("Current auction price:", weiToEther(price), "ether");
    console.log("Total token supply:", weiToEther(tokenSupply));
    console.log("Tokens Sold:", weiToEther(tokenSold));
    console.log("Amount Raised:", weiToEther(amountRaised));
    console.log("Has Auction ended?", hasAuctionEnded);
  });

  it("a user can commit ether to buy auction token", async () => {
    let random,
      ETHER_PAYMENT,
      price,
      averagePrice,
      priceGradient,
      hasAuctionEnded,
      tokenSupply,
      tokenSold,
      amountRaised,
      tokensClaimable;

    for (let i = 1; i < 11; i++) {
      random = randomValue(20);

      ETEHR_PAYMENT = new BigNumber(
        web3.utils.toWei(random.toString(), "ether") // 10 ether
      );

      await dutchSwapAuction.commitEth(accounts[i], {
        from: accounts[i],
        value: ETEHR_PAYMENT,
      });

      price = await dutchSwapAuction.priceFunction();
      averagePrice = await dutchSwapAuction.tokenPrice();
      priceGradient = await dutchSwapAuction.priceGradient();
      hasAuctionEnded = await dutchSwapAuction.auctionEnded();
      tokenSupply = await dutchSwapAuction.tokenSupply.call();
      tokenSold = await dutchSwapAuction.tokenSold.call();
      amountRaised = await dutchSwapAuction.amountRaised.call();
      tokensClaimable = await dutchSwapAuction.tokensClaimable(accounts[i]);

      console.log("\n==== NEW BID ===");
      console.log("New Bid from:", accounts[i]);
      console.log("Current auction price:", weiToEther(price), "ether");
      console.log("Average auction price:", weiToEther(averagePrice), "ether");
      console.log("Price Gradient:", weiToEther(priceGradient), "ether");
      console.log("Total token supply:", weiToEther(tokenSupply));
      console.log("Tokens Sold:", weiToEther(tokenSold), "KTY");
      console.log("Amount Raised:", weiToEther(amountRaised), "ether");
      console.log("Has Auction ended?", hasAuctionEnded);
      console.log(
        "Claimable tokens for this bidder right now:",
        weiToEther(tokensClaimable)
      );
      console.log("========================\n");
    }
  });

  it("users commit ether again", async () => {
    let random,
      ETHER_PAYMENT,
      price,
      averagePrice,
      priceGradient,
      hasAuctionEnded,
      tokenSupply,
      tokenSold,
      amountRaised,
      tokensClaimable;

    for (let i = 11; i < 21; i++) {
      random = randomValue(30);

      ETEHR_PAYMENT = new BigNumber(
        web3.utils.toWei(random.toString(), "ether") // 10 ether
      );

      await dutchSwapAuction.commitEth(accounts[i], {
        from: accounts[i],
        value: ETEHR_PAYMENT,
      });

      price = await dutchSwapAuction.priceFunction();
      averagePrice = await dutchSwapAuction.tokenPrice();
      priceGradient = await dutchSwapAuction.priceGradient();
      hasAuctionEnded = await dutchSwapAuction.auctionEnded();
      tokenSupply = await dutchSwapAuction.tokenSupply.call();
      tokenSold = await dutchSwapAuction.tokenSold.call();
      amountRaised = await dutchSwapAuction.amountRaised.call();
      tokensClaimable = await dutchSwapAuction.tokensClaimable(accounts[i]);

      console.log("\n==== NEW BID ===");
      console.log("New Bid from:", accounts[i]);
      console.log("Current auction price:", weiToEther(price), "ether");
      console.log("Average auction price:", weiToEther(averagePrice), "ether");
      console.log("Price Gradient:", weiToEther(priceGradient), "ether");
      console.log("Total token supply:", weiToEther(tokenSupply));
      console.log("Tokens Sold:", weiToEther(tokenSold), "KTY");
      console.log("Amount Raised:", weiToEther(amountRaised), "ether");
      console.log("Has Auction ended?", hasAuctionEnded);
      console.log(
        "Claimable tokens for this bidder right now:",
        weiToEther(tokensClaimable)
      );
      console.log("========================\n");
    }
  });

  it("cannot bid more than total supply of tokens in this auction", async () => {
    let random,
      ETHER_PAYMENT,
      price,
      averagePrice,
      priceGradient,
      hasAuctionEnded,
      tokenSupply,
      tokenSold,
      amountRaised,
      tokensClaimable;

    for (let i = 21; i < 48; i++) {
      random = randomValue(88);

      ETEHR_PAYMENT = new BigNumber(
        web3.utils.toWei(random.toString(), "ether") // 10 ether
      );

      await dutchSwapAuction.commitEth(accounts[i], {
        from: accounts[i],
        value: ETEHR_PAYMENT,
      });

      price = await dutchSwapAuction.priceFunction();
      averagePrice = await dutchSwapAuction.tokenPrice();
      priceGradient = await dutchSwapAuction.priceGradient();
      hasAuctionEnded = await dutchSwapAuction.auctionEnded();
      tokenSupply = await dutchSwapAuction.tokenSupply.call();
      tokenSold = await dutchSwapAuction.tokenSold.call();
      amountRaised = await dutchSwapAuction.amountRaised.call();
      tokensClaimable = await dutchSwapAuction.tokensClaimable(accounts[i]);

      console.log("\n==== NEW BID ===");
      console.log("New Bid from:", accounts[i]);
      console.log("Current auction price:", weiToEther(price), "ether");
      console.log("Average auction price:", weiToEther(averagePrice), "ether");
      console.log("Price Gradient:", weiToEther(priceGradient), "ether");
      console.log("Total token supply:", weiToEther(tokenSupply));
      console.log("Tokens Sold:", weiToEther(tokenSold), "KTY");
      console.log("Amount Raised:", weiToEther(amountRaised), "ether");
      console.log("Has Auction ended?", hasAuctionEnded);
      console.log(
        "Claimable tokens for this bidder right now:",
        weiToEther(tokensClaimable)
      );
      console.log("========================\n");
      assert.isAtMost(
        Number(weiToEther(tokenSold)),
        Number(weiToEther(tokenSupply))
      );
    }
  });

  it("bidders cannot withdraw auction tokens before auction is finalized", async() => {
    for (let i = 0; i < 21; i++) {
      await dutchSwapAuction.withdrawTokens({ from: accounts[i] }).should.be.rejected;
    }
  })

  it("auction cannot be finalized before auction is ended", async() => {
    await dutchSwapAuction.finaliseAuction().should.be.rejected;
  })

  it("finalizes auction", async () => {
    console.log("Time is flying...");
    let advancement = 86400 * 31; // 31 Days
    await advanceTimeAndBlock(advancement);
    let hasAuctionEnded = await dutchSwapAuction.auctionEnded();
    console.log("Has Auction ended?", hasAuctionEnded);
    let auction_bal_before = await web3.eth.getBalance(
      dutchSwapAuction.address
    );
    let walet_bal_before = await web3.eth.getBalance(accounts[0]);
    await dutchSwapAuction.finaliseAuction().should.be.fulfilled;
    let auction_bal_after = await web3.eth.getBalance(dutchSwapAuction.address);
    let walet_bal_after = await web3.eth.getBalance(accounts[0]);
    console.log(
      "auction contract ether balance before finalize:",
      weiToEther(auction_bal_before)
    );
    console.log(
      "auction contract ether balance after finalize:",
      weiToEther(auction_bal_after)
    );
    console.log(
      "wallet ether balance before finalize:",
      weiToEther(walet_bal_before)
    );
    console.log(
      "wallet ether balance after finalize:",
      weiToEther(walet_bal_after)
    );
  });

  it("checks withdraw delay", async () => {
    let withdrawDelay = await dutchSwapAuction.checkWithdraw()
    console.log("Can withdraw?", withdrawDelay[0])
    console.log("Time (in seconds) before withdraw:", withdrawDelay[1].toString())
    assert.isFalse(withdrawDelay[0])
    assert.isAbove(Number(withdrawDelay[1].toString()), 0)
  })

  it ("bidders cannot withdraw auction tokens before withdraw delay duration is over", async () => {
    for (let i = 0; i < 21; i++) {
      await dutchSwapAuction.withdrawTokens({ from: accounts[i] }).should.be.rejected;
    }
  })

  it ("the owner can remove withdraw delay", async () => {
    await dutchSwapAuction.removeWithdrawDelay()
    let withdrawDelay = await dutchSwapAuction.checkWithdraw()
    console.log("Can withdraw?", withdrawDelay[0])
    console.log("Time (in seconds) before withdraw:", withdrawDelay[1].toString())
    assert.isTrue(withdrawDelay[0])
    assert.equal(Number(withdrawDelay[1].toString()), 0)
  })

  it ("the owner can add withdraw delay", async () => {
    let _delay = 2 * 24 * 60 * 60 // 2 days
    await dutchSwapAuction.addWithdrawDelay(_delay)
    let withdrawDelay = await dutchSwapAuction.checkWithdraw()
    // console.log(withdrawDelay)
    console.log("Can withdraw?", withdrawDelay[0])
    console.log("Time (in seconds) before withdraw:", withdrawDelay[1].toString())
    assert.isFalse(withdrawDelay[0])
    assert.isAbove(Number(withdrawDelay[1].toString()), 0)
  })

  it("bidders withdraw auction tokens after auction is finalized and after withdraw delay is over", async () => {
    console.log("Time is flying...");
    let advancement = 86400 * 2; // 2 Days
    await advanceTimeAndBlock(advancement);

    let withdrawDelay = await dutchSwapAuction.checkWithdraw()
    console.log("Can withdraw?", withdrawDelay[0])
    console.log("Time (in seconds) before withdraw:", withdrawDelay[1].toString())

    let bal_before,
      bal_after,
      price,
      averagePrice,
      priceGradient,
      hasAuctionEnded,
      tokensClaimable;
    for (let i = 1; i < 21; i++) {
      console.log("Bidder:", accounts[i]);
      console.log("\n==== Before Withdrawn ===");
      tokensClaimable = await dutchSwapAuction.tokensClaimable(accounts[i]);
      bal_before = await kittieFightToken.balanceOf(accounts[i]);
      console.log(
        "Claimable tokens for this bidder right now:",
        weiToEther(tokensClaimable)
      );
      console.log("Bidder's KTY balance:", weiToEther(bal_before));

      await dutchSwapAuction.withdrawTokens({ from: accounts[i] }).should.be
        .fulfilled;

      console.log("\n==== After Withdrawn ===");
      tokensClaimable = await dutchSwapAuction.tokensClaimable(accounts[i]);
      bal_after = await kittieFightToken.balanceOf(accounts[i]);
      console.log(
        "Claimable tokens for this bidder right now:",
        weiToEther(tokensClaimable)
      );
      console.log("Bidder's KTY balance:", weiToEther(bal_after));
      console.log("========================\n");
    }

    price = await dutchSwapAuction.priceFunction();
    averagePrice = await dutchSwapAuction.tokenPrice();
    priceGradient = await dutchSwapAuction.priceGradient();
    tokenSupply = await dutchSwapAuction.tokenSupply.call();
    tokenSold = await dutchSwapAuction.tokenSold.call();
    amountRaised = await dutchSwapAuction.amountRaised.call();
    hasAuctionEnded = await dutchSwapAuction.auctionEnded();

    console.log("\n==== General Info ===");
    console.log("Current auction price:", weiToEther(price), "ether");
    console.log("Average auction price:", weiToEther(averagePrice), "ether");
    console.log("Price Gradient:", weiToEther(priceGradient), "ether");
    console.log("Total token supply:", weiToEther(tokenSupply));
    console.log("Tokens Sold:", weiToEther(tokenSold), "KTY");
    console.log("Amount Raised:", weiToEther(amountRaised), "ether");
    console.log("Has Auction ended?", hasAuctionEnded);
  });

  it("no one can commit ether after auction is ended", async () => {
    let ETEHR_PAYMENT = new BigNumber(
      web3.utils.toWei("10", "ether") // 10 ether
    );

    await dutchSwapAuction.commitEth(accounts[49], {
      from: accounts[49],
      value: ETEHR_PAYMENT,
    }).should.be.rejected;
  })

});
