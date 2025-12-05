// Test script to verify Alchemy API is working
import { getNFTsForOwner } from '../config/alchemy.js';

// Test with a known wallet that should have Al Cabone NFTs
const testWallet = '0x8ba68cfe71550efc8988d81d040473709b7f9218'; // Example wallet

export async function testNFTFetch() {
  try {
    console.log('Testing NFT fetch for wallet:', testWallet);
    const nfts = await getNFTsForOwner(testWallet);

    console.log('NFTs returned:', nfts?.length);
    console.log('First NFT:', nfts?.[0]);
    console.log('First NFT image object:', nfts?.[0]?.image);
    console.log('First NFT media object:', nfts?.[0]?.media);
    console.log('First NFT raw metadata:', nfts?.[0]?.raw);

    return nfts;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}
