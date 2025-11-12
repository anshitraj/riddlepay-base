const hre = require("hardhat");

async function main() {
  console.log("Deploying SecretGift contract...");
  const network = hre.network.name;
  
  // USDC addresses for different networks
  const USDC_ADDRESSES = {
    baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC mock
    baseMainnet: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet USDC
  };
  
  // Get USDC address based on network
  const USDC_ADDRESS = process.env.USDC_ADDRESS || USDC_ADDRESSES[network] || USDC_ADDRESSES.baseSepolia;
  
  if (!USDC_ADDRESS) {
    throw new Error(`USDC address not configured for network: ${network}`);
  }
  
  console.log(`Network: ${network}`);
  console.log(`USDC Address: ${USDC_ADDRESS}`);

  const SecretGift = await hre.ethers.getContractFactory("SecretGift");
  const secretGift = await SecretGift.deploy(USDC_ADDRESS);

  await secretGift.waitForDeployment();

  const contractAddress = await secretGift.getAddress();
  console.log("SecretGift deployed to:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("USDC Address:", USDC_ADDRESS);

  // Wait for a few block confirmations before verifying
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await secretGift.deploymentTransaction().wait(5);

    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [USDC_ADDRESS],
      });
      console.log("Contract verified!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contractAddress);
  console.log("USDC Address:", USDC_ADDRESS);
  console.log("\nAdd this to your .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

