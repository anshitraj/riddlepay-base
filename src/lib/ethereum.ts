import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0x0000000000000000000000000000000000000000';

export const CONTRACT_ABI = [
  "function createGift(address _receiver, string memory _answer, uint256 _amount) external",
  "function claimGift(uint256 _id, string memory _guess) external",
  "function getGift(uint256 _id) external view returns (tuple(address sender, address receiver, bytes32 answerHash, uint256 amount, bool claimed))",
  "function giftCount() external view returns (uint256)",
  "event GiftCreated(uint256 indexed id, address indexed sender, address indexed receiver)",
  "event GiftClaimed(uint256 indexed id, address receiver, uint256 amount)"
];

export const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export const getProvider = () => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return null;
};

export const connectWallet = async () => {
  try {
    const provider = getProvider();
    if (!provider) {
      throw new Error('No wallet detected');
    }
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { signer, address };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

export const getContract = async () => {
  const provider = getProvider();
  if (!provider) throw new Error('No provider');
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

export const getUSDCContract = async () => {
  const provider = getProvider();
  if (!provider) throw new Error('No provider');
  const signer = await provider.getSigner();
  return new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
};
