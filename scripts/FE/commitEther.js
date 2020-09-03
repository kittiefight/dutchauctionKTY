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

    let random,
      ether_payment,
      price,
      averagePrice,
      priceGradient,
      hasAuctionEnded,
      tokenSupply,
      tokenSold,
      amountRaised,
      tokensClaimable;

    // Bidders commit ether
    for (let i = 1; i <= amount; i++) {
      random = randomValue(10);

      ether_payment = new BigNumber(
        web3.utils.toWei(random.toString(), "ether")
      );

      await dutchSwapAuction.commitEth(accounts[i], {
        from: accounts[i],
        value: ether_payment,
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
      console.log("New Bid from: Account", i);
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

    // Time is flying away, and auction ends
    console.log("Time is flying...");
    let advancement = 86400 * 29; // 29 Days
    await advanceTimeAndBlock(advancement);

    // Bidders commit ether again
    for (let i = 1; i <= amount; i++) {
      random = randomValue(80);

      ether_payment = new BigNumber(
        web3.utils.toWei(random.toString(), "ether")
      );

      await dutchSwapAuction.commitEth(accounts[i], {
        from: accounts[i],
        value: ether_payment,
      });

      price = await dutchSwapAuction.priceFunction();
      averagePrice = await dutchSwapAuction.tokenPrice();
      priceGradient = await dutchSwapAuction.priceGradient();
      hasAuctionEnded = await dutchSwapAuction.auctionEnded();
      tokenSupply = await dutchSwapAuction.tokenSupply.call();
      tokenSold = await dutchSwapAuction.tokenSold.call();
      amountRaised = await dutchSwapAuction.amountRaised.call();
      tokensClaimable = await dutchSwapAuction.tokensClaimable(accounts[i]);

      console.log("\n==== NEW BID AGAIN===");
      console.log("New Bid from: Account", i);
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


    callback();
  } catch (e) {
    callback(e);
  }
};
