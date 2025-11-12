require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  console.log("=== Wallet Verification ===\n");
  
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not set in .env");
    return;
  }

  // Derive address from private key
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const address = wallet.address;
  
  console.log("Private Key (first 12 chars):", process.env.PRIVATE_KEY.substring(0, 14) + "...");
  console.log("Derived Address:", address);
  console.log("\nChecking balance on Base Mainnet...");
  
  // Check balance on Base Mainnet
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const balance = await provider.getBalance(address);
  const balanceInETH = ethers.formatEther(balance);
  
  console.log("\n=== Balance Check ===");
  console.log("Address:", address);
  console.log("Balance:", balanceInETH, "ETH");
  
  if (balance > 0n) {
    console.log("\n✅ This wallet has ETH! Ready to deploy.");
  } else {
    console.log("\n⚠️  This wallet has 0 ETH on Base Mainnet.");
    console.log("Please make sure you're using the correct wallet with ETH.");
  }
  
  // Also check on Basescan
  console.log("\n🔍 View on Basescan:");
  console.log(`https://basescan.org/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

