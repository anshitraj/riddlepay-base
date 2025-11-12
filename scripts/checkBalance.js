const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  // Reload environment variables
  require("dotenv").config();
  
  const network = hre.network.name;
  console.log(`Checking balance on ${network}...`);
  
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not set in .env");
    return;
  }

  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL || (network === "baseMainnet" ? "https://mainnet.base.org" : "https://sepolia.base.org")
  );
  
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const address = wallet.address;
  console.log("\n=== Checking Wallet ===");
  console.log("Address:", address);
  console.log("Private Key (first 10 chars):", process.env.PRIVATE_KEY.substring(0, 12) + "...");
  
  const balance = await provider.getBalance(address);
  const balanceInETH = ethers.formatEther(balance);
  
  console.log("\n=== Wallet Balance ===");
  console.log("Address:", address);
  console.log("Balance:", balanceInETH, "ETH");
  console.log("Network:", network);
  
  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Your wallet has 0 ETH!");
    console.log("You need ETH to pay for gas fees.");
    if (network === "baseMainnet") {
      console.log("\nTo get Base Mainnet ETH:");
      console.log("1. Bridge from Ethereum: https://bridge.base.org/");
      console.log("2. Or use a DEX to swap tokens for ETH");
    } else {
      console.log("\nTo get Base Sepolia ETH:");
      console.log("1. Use the faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    }
  } else {
    console.log("\n✅ You have ETH! You can deploy.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

