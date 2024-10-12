import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("YourContract", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const yourContract = await hre.ethers.getContract<Contract>("YourContract", deployer);
  console.log("👋 Initial greeting:", await yourContract.greeting());
};

const deployNFTMarketplace: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Set the constructor parameters for NFTMarketplace
  const feePercent = 2; // Example fee percentage (2%)
  const nftContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with the deployed ERC721 contract address

  // Deploy the contract
  await deploy("NFTMarketplace", {
    from: deployer,
    args: [feePercent, nftContractAddress], // Constructor arguments
    log: true,
  });

  // Get the deployed contract
  // const nftMarketplace = await ethers.getContract("NFTMarketplace", deployer);
  await ethers.getContract("NFTMarketplace", deployer);

  // console.log("NFTMarketplace deployed to:", nftMarketplace.address);
};

// Export both deployment functions
export default deployNFTMarketplace;
export { deployYourContract };

// // Tags are useful if you have multiple deploy files and only want to run one of them.
// // e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["YourContract"];
deployNFTMarketplace.tags = ["NFTMarketplace"];
