const Market = artifacts.require("../contracts/NFTMarket.sol")
const NFT = artifacts.require("../contracts/NFT.sol")

module.exports = async function (deployer) {
    await deployer.deploy(Market);
    const marketContract = await Market.deployed();
    const marketAddress = marketContract.address;

    await deployer.deploy(NFT, marketAddress);
}