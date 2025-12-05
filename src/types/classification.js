/**
 * Tier classification based on NFT count
 * @typedef {'Godfather' | 'Underboss' | 'Consigliere' | 'Caporegime' | 'Soldier'} Tier
 */

/**
 * Family names within the Al Cabone world
 * @typedef {'Contract Killers' | 'Rambones' | 'Corlebones' | 'Gambones' | 'Napolebones' | 'Colombones' | 'Boneannos'} Family
 */

/**
 * Badge types for collectors
 * @typedef {'MOST_WANTED' | 'HIGH_PRIORITY' | 'UNDER_SURVEILLANCE' | 'ACTIVE_INVESTIGATION'} BadgeType
 */

/**
 * Get tier based on NFT count
 * @param {number} nftCount - Number of NFTs owned
 * @returns {Tier} The tier classification
 */
export function getTierForNFTCount(nftCount) {
  if (nftCount >= 25) return 'Godfather';
  if (nftCount >= 20) return 'Underboss';
  if (nftCount >= 15) return 'Consigliere';
  if (nftCount >= 10) return 'Caporegime';
  return 'Soldier';
}

/**
 * Get badge type based on collector ranking
 * @param {number} rank - Position in top collectors (1-indexed)
 * @returns {BadgeType | null} The badge type or null
 */
export function getBadgeForRank(rank) {
  if (rank <= 3) return 'MOST_WANTED';
  if (rank <= 10) return 'HIGH_PRIORITY';
  if (rank <= 50) return 'UNDER_SURVEILLANCE';
  return null;
}

/**
 * Get classification level text for display
 * @param {Tier} tier - The tier
 * @returns {string} Classification level text
 */
export function getClassificationLevel(tier) {
  const levels = {
    'Godfather': 'LEVEL 5 - TOP SECRET',
    'Underboss': 'LEVEL 4 - CONFIDENTIAL',
    'Consigliere': 'LEVEL 3 - RESTRICTED',
    'Caporegime': 'LEVEL 2 - FOR OFFICIAL USE',
    'Soldier': 'LEVEL 1 - UNCLASSIFIED'
  };
  return levels[tier] || 'LEVEL 1 - UNCLASSIFIED';
}

export {};
