import { Alchemy, Network } from 'alchemy-sdk';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CACHE_KEY = 'fbi_cabone_nft_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

if (!import.meta.env.VITE_ALCHEMY_API_KEY) {
  throw new Error('VITE_ALCHEMY_API_KEY is not set in the environment variables.');
}

const settings = {
  apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
  network: import.meta.env.VITE_ALCHEMY_NETWORK || Network.ETH_MAINNET,
  maxRetries: 5,
};

const createAlchemyInstance = () => new Alchemy(settings);

/**
 * Get cached data from localStorage
 * @returns {Object|null} Cached data or null if expired/not found
 */
const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - parsedCache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsedCache;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

/**
 * Set cached data in localStorage
 * @param {Array} data - Data to cache
 */
const setCachedData = (data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

/**
 * Asynchronously fetches NFT ownership data for the Al Cabones contract using Alchemy's getOwnersForContract.
 * Maps the data to include both wallet addresses and the count of NFTs owned by each address.
 *
 * @returns {Promise<Array<{walletAddress: string, nftCount: number}>>} Array of NFTOwnership objects
 */
export const fetchNFTOwnershipData = async () => {
  try {
    // Check cache first
    const cached = getCachedData();
    if (cached) {
      console.log('Using cached NFT ownership data');
      return cached.data;
    }

    console.log('Cache miss, fetching fresh NFT ownership data');

    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address is not set in the environment variables.');
    }

    const alchemy = createAlchemyInstance();
    console.log(`Fetching owners for contract: ${CONTRACT_ADDRESS}`);

    const options = {
      withTokenBalances: true
    };

    const ownersData = await alchemy.nft.getOwnersForContract(CONTRACT_ADDRESS, options);
    console.log('Raw owners data:', ownersData);

    // Create a map to store NFT counts per wallet
    const ownershipMap = new Map();

    // Process owners with their token balances
    if ('owners' in ownersData && Array.isArray(ownersData.owners)) {
      ownersData.owners.forEach((ownerData) => {
        if (typeof ownerData === 'object' && 'ownerAddress' in ownerData && 'tokenBalances' in ownerData) {
          // If we have token balances data
          const nftCount = ownerData.tokenBalances.length;
          ownershipMap.set(ownerData.ownerAddress, nftCount);
        } else if (typeof ownerData === 'string') {
          // Fallback for simple owner address
          ownershipMap.set(ownerData, 1);
        }
      });
    }

    // Convert the map to our NFTOwnership array format
    const ownershipData = Array.from(ownershipMap).map(
      ([walletAddress, nftCount]) => ({
        walletAddress,
        nftCount,
      })
    );

    // Sort by nftCount descending (top collectors first)
    ownershipData.sort((a, b) => b.nftCount - a.nftCount);

    // Cache the results
    setCachedData(ownershipData);

    console.log('Processed and cached NFT Ownership Data:', ownershipData);
    return ownershipData;
  } catch (error) {
    console.error('Error fetching NFT ownership data:', error);

    // If API call fails, try to use cached data even if expired
    const cached = getCachedData();
    if (cached) {
      console.log('API call failed, using cached data as fallback');
      return cached.data;
    }

    throw new Error(`Failed to fetch NFT ownership data: ${error}`);
  }
};

/**
 * Get NFT metadata for specific token IDs
 * @param {Array<string>} tokenIds - Array of token IDs to fetch
 * @returns {Promise<Array>} Array of NFT metadata
 */
export const getNFTMetadata = async (tokenIds) => {
  try {
    const alchemy = createAlchemyInstance();
    const metadataPromises = tokenIds.map(tokenId =>
      alchemy.nft.getNftMetadata(CONTRACT_ADDRESS, tokenId)
    );
    return await Promise.all(metadataPromises);
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    throw error;
  }
};

/**
 * Get NFTs owned by a specific wallet
 * @param {string} walletAddress - Wallet address to query
 * @returns {Promise<Array>} Array of NFTs owned by the wallet
 */
export const getNFTsForOwner = async (walletAddress) => {
  try {
    const alchemy = createAlchemyInstance();
    const nfts = await alchemy.nft.getNftsForOwner(walletAddress, {
      contractAddresses: [CONTRACT_ADDRESS]
    });
    return nfts.ownedNfts;
  } catch (error) {
    console.error('Error fetching NFTs for owner:', error);
    throw error;
  }
};
