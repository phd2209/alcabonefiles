/**
 * @typedef {Object} NFTOwnership
 * @property {string} walletAddress - The wallet address that owns the NFTs
 * @property {number} nftCount - The number of NFTs owned by this wallet
 */

/**
 * @typedef {Object} NFTMetadata
 * @property {string} image - URL to the NFT image
 * @property {string} name - Name of the NFT
 * @property {Array<{trait_type: string, value: string}>} attributes - NFT attributes/traits
 * @property {string} tokenId - The token ID
 * @property {string} [owner] - Optional owner address
 */

/**
 * @typedef {Object} Collector
 * @property {string} wallet - Wallet address
 * @property {number} count - Number of NFTs owned
 * @property {string} [badge] - Badge type (MOST_WANTED, HIGH_PRIORITY, UNDER_SURVEILLANCE)
 */

export {};
