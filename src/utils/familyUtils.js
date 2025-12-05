/**
 * Get family from NFT attributes
 * @param {Array<{trait_type: string, value: string}>} attributes - NFT attributes
 * @returns {string|null} Family name or null
 */
export function getFamilyFromAttributes(attributes) {
  if (!attributes || !Array.isArray(attributes)) return null;

  const familyAttribute = attributes.find(
    attr => attr.trait_type?.toLowerCase() === 'family' ||
            attr.trait_type?.toLowerCase() === 'syndicate'
  );

  return familyAttribute ? familyAttribute.value : null;
}

/**
 * Get random item from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random item
 */
export function getRandomItem(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random NFT from a category
 * @param {Array} nfts - Array of NFTs
 * @param {string} category - Category to filter by (tier or family)
 * @returns {Object|null} Random NFT or null
 */
export function getRandomNFTFromCategory(nfts, category) {
  if (!nfts || nfts.length === 0) return null;

  const filtered = nfts.filter(nft => {
    // Check if it matches tier or family
    return nft.tier === category || nft.family === category;
  });

  return getRandomItem(filtered);
}

/**
 * Truncate wallet address for display
 * @param {string} address - Full wallet address
 * @param {number} startChars - Number of chars to show at start (default 6)
 * @param {number} endChars - Number of chars to show at end (default 4)
 * @returns {string} Truncated address
 */
export function truncateAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Group NFT owners by tier
 * @param {Array<{walletAddress: string, nftCount: number}>} owners - Array of owners
 * @returns {Object} Object with tiers as keys and arrays of owners as values
 */
export function groupByTier(owners) {
  const tiers = {
    'Godfather': [],
    'Underboss': [],
    'Consigliere': [],
    'Caporegime': [],
    'Soldier': []
  };

  owners.forEach(owner => {
    // Only include wallets with 5+ NFTs
    if (owner.nftCount < 5) return;

    let tier = 'Soldier';
    if (owner.nftCount >= 25) tier = 'Godfather';
    else if (owner.nftCount >= 20) tier = 'Underboss';
    else if (owner.nftCount >= 15) tier = 'Consigliere';
    else if (owner.nftCount >= 10) tier = 'Caporegime';
    // Soldier is 5-9 NFTs (default)

    tiers[tier].push(owner);
  });

  return tiers;
}

/**
 * Get top collectors
 * @param {Array<{walletAddress: string, nftCount: number}>} owners - Array of owners (sorted)
 * @param {number} limit - Number of top collectors to return (default 10)
 * @returns {Array} Top collectors with badge info
 */
export function getTopCollectors(owners, limit = 10) {
  return owners.slice(0, limit).map((owner, index) => {
    const rank = index + 1;
    let badge = null;

    if (rank <= 3) badge = 'MOST_WANTED';
    else if (rank <= 10) badge = 'HIGH_PRIORITY';
    else if (rank <= 50) badge = 'UNDER_SURVEILLANCE';

    return {
      ...owner,
      rank,
      badge
    };
  });
}
