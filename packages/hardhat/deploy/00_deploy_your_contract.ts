import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployNFTMarketplace: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Set the constructor parameters for NFTMarketplace
  const feePercent = 2; // Example fee percentage (2%)

  // Deploy the contract
  await deploy("NFTMarketplace", {
    from: deployer,
    args: [feePercent], // Constructor arguments
    log: true,
  });

  // Get the deployed contract
  await ethers.getContract("NFTMarketplace", deployer);
};

// Export both deployment functions
export default deployNFTMarketplace;

// // Tags are useful if you have multiple deploy files and only want to run one of them.
// // e.g. yarn deploy --tags YourContract
deployNFTMarketplace.tags = ["NFTMarketplace"];
