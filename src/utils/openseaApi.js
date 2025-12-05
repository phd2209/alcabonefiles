/**
 * OpenSea API utilities for fetching NFT data
 * OpenSea API v2: https://docs.opensea.io/reference/api-overview
 */

const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const OPENSEA_API_KEY = import.meta.env.VITE_OPENSEA_API_KEY;
const CHAIN = 'ethereum'; // mainnet

// Utility function to introduce a delay to avoid rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get NFT metadata from OpenSea
 * @param {string} tokenId - Token ID
 * @returns {Promise<Object>} NFT metadata with image
 */
export async function getOpenSeaNFT(tokenId) {
  try {
    const url = `${OPENSEA_API_BASE}/chain/${CHAIN}/contract/${CONTRACT_ADDRESS}/nfts/${tokenId}`;

    await sleep(200); // 200ms delay to avoid throttling

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': OPENSEA_API_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    return data.nft;
  } catch (error) {
    console.error(`Error fetching NFT ${tokenId} from OpenSea:`, error);
    throw error;
  }
}

/**
 * Get NFTs owned by a wallet from OpenSea (SINGLE PAGE ONLY - for preview images)
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<Array>} Array of NFTs (first page only, limit 50)
 */
export async function getOpenSeaNFTsForOwner(walletAddress) {
  try {
    const url = `${OPENSEA_API_BASE}/chain/${CHAIN}/account/${walletAddress}/nfts?collection=thealcabones&limit=50`;

    await sleep(200); // 200ms delay to avoid throttling

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': OPENSEA_API_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    return data.nfts || [];
  } catch (error) {
    console.error(`Error fetching NFTs for ${walletAddress} from OpenSea:`, error);
    throw error;
  }
}

/**
 * Get all NFTs from the collection (not wallet-specific)
 * Use this to fetch collection images once, then assign randomly
 * @returns {Promise<Array>} Array of NFTs
 */
export async function getAllCollectionNFTs() {
  try {
    const url = `${OPENSEA_API_BASE}/collection/thealcabones/nfts?limit=50`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': OPENSEA_API_KEY,
      }
    });

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    return data.nfts || [];
  } catch (error) {
    console.error('Error fetching collection NFTs from OpenSea:', error);
    throw error;
  }
}

/**
 * Extract image URL from OpenSea NFT data
 * @param {Object} nft - OpenSea NFT object
 * @returns {string|null} Image URL
 */
export function extractOpenSeaImage(nft) {
  return nft?.image_url ||
         nft?.display_image_url ||
         nft?.metadata?.image ||
         null;
}
