require("dotenv").config();
const { ethers } = require("ethers");

// Replace this with your NEW wallet's private key to verify
const NEW_PRIVATE_KEY = process.env.PRIVATE_KEY; // Change this if needed

async function main() {
  console.log("=== Checking New Wallet ===\n");
  
  if (!NEW_PRIVATE_KEY) {
    console.error("❌ Please set NEW_PRIVATE_KEY in the script or .env file");
    return;
  }

  // Derive address from private key
  const wallet = new ethers.Wallet(NEW_PRIVATE_KEY);
  const address = wallet.address;
  
  console.log("Wallet Address:", address);
  console.log("\nChecking balance on Base Mainnet...");
  
  // Check balance on Base Mainnet
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const balance = await provider.getBalance(address);
  const balanceInETH = ethers.formatEther(balance);
  
  console.log("\n=== Balance Check ===");
  console.log("Balance:", balanceInETH, "ETH");
  
  if (balance > 0n) {
    console.log("\n✅ This wallet HAS ETH! Ready to deploy.");
    console.log("\n📝 Update your .env file with this private key:");
    console.log(`PRIVATE_KEY=${NEW_PRIVATE_KEY}`);
  } else {
    console.log("\n⚠️  This wallet has 0 ETH on Base Mainnet.");
  }
  
  console.log("\n🔍 View on Basescan:");
  console.log(`https://basescan.org/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

