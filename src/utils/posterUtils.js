/**
 * Utility functions for generating Most Wanted Posters
 * Based on OpenSea API v2 NFT data structure
 */

/**
 * OpenSea NFT structure (what we get from the API):
 * {
 *   identifier: "1234",
 *   collection: "thealcabones",
 *   contract: "0x...",
 *   token_standard: "erc721",
 *   name: "Al Cabone #1234",
 *   description: "...",
 *   image_url: "https://...",
 *   display_image_url: "https://...",
 *   metadata_url: "ipfs://...",
 *   metadata: {
 *     attributes: [
 *       { trait_type: "Family", value: "Contract Killers" },
 *       { trait_type: "Hat", value: "Fedora" },
 *       { trait_type: "Background", value: "Bone Harbor Docks" },
 *       { trait_type: "Weapon", value: "Tommy Gun" },
 *       // ... more traits
 *     ]
 *   },
 *   is_disabled: false,
 *   is_nsfw: false,
 *   // OpenSea listing data (if on sale)
 *   // This may not always be present
 * }
 */

// Crime pools by family
const FAMILY_CRIMES = {
  'Contract Killers': [
    'Murder for hire (47 counts)',
    'Interstate criminal conspiracy',
    'Weapons trafficking across state lines',
    'Assassination of federal witnesses',
    'Operating illegal armory',
    'Conspiracy to commit murder'
  ],
  'Rambones': [
    'Armed robbery of First Bone Bank',
    'Assault with deadly bone',
    'Extortion racket operations',
    'Armed home invasions (23 counts)',
    'Violent intimidation schemes',
    'Assault on law enforcement'
  ],
  'Corlebones': [
    'Political corruption and bribery',
    'Labor union infiltration',
    'Wire fraud and embezzlement',
    'Illegal gambling operations',
    'Election tampering',
    'Corruption of public officials'
  ],
  'Gambones': [
    'Illegal casino operations',
    'Loan sharking network',
    'Numbers racket across 5 boroughs',
    'Bookmaking enterprises',
    'Dice game manipulation',
    'Unlicensed gambling establishments'
  ],
  'Napolebones': [
    'Narcotics trafficking',
    'Heroin distribution network',
    'Opium den operations',
    'Drug smuggling via shipping lanes',
    'Cocaine importation',
    'Illegal pharmacy operations'
  ],
  'Colombones': [
    'Bootlegging operations',
    'Illegal alcohol distribution',
    'Speakeasy ownership (12 locations)',
    'Rum-running from Canada',
    'Moonshine production facility',
    'Violation of Volstead Act'
  ],
  'Boneannos': [
    'Protection racket operations',
    'Construction site extortion',
    'Restaurant and nightclub shakedowns',
    'Pier worker intimidation',
    'Neighborhood extortion ring',
    'Business protection schemes'
  ]
};

// Default crimes if family not found or for general use
const DEFAULT_CRIMES = [
  'Illegal bone smuggling',
  'Racketeering in Bone Harbor',
  'Operating speakeasy without permit',
  'Tax evasion (1925-1933)',
  'Conspiracy to overthrow Mayor Skellington',
  'Armed robbery of the First Bone Bank',
  'Murder of rival family member',
  'Interstate criminal conspiracy',
  'Violation of Prohibition laws',
  'Money laundering operations'
];

// Bounty amounts by collector tier (based on total NFT count)
const TIER_BOUNTIES = {
  'Godfather': 1000000,      // 25+ NFTs
  'Underboss': 500000,       // 20-24 NFTs
  'Consigliere': 250000,     // 15-19 NFTs
  'Caporegime': 100000,      // 10-14 NFTs
  'Soldier': 50000,          // 5-9 NFTs
  'Associate': 25000         // 1-4 NFTs
};

/**
 * Fetch NFT metadata from OpenSea API
 * @param {string} tokenId - NFT token ID
 * @returns {Promise<Object>} Metadata object with attributes
 */
export async function fetchNFTMetadata(tokenId) {
  try {
    const url = `https://api.opensea.io/api/v2/metadata/ethereum/0x8ca5209d8cce34b0de91c2c4b4b14f20aff8ba23/${tokenId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'X-API-KEY': import.meta.env.VITE_OPENSEA_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

/**
 * Extract family name from NFT traits
 * Family is stored in the "Background" trait
 * @param {Array} traits - Array of trait objects
 * @returns {string} Family name or 'Unknown'
 */
export function extractFamily(traits) {
  if (!traits || !Array.isArray(traits)) return 'Unknown';

  // Family is stored in the Background trait
  const backgroundTrait = traits.find(
    trait => trait.trait_type === 'Background' || trait.trait_type === 'background'
  );

  return backgroundTrait?.value || 'Unknown';
}

/**
 * Generate deterministic crimes based on token ID and family
 * @param {string} tokenId - NFT token ID
 * @param {string} family - Family name
 * @returns {string[]} Array of 3 crimes
 */
export function generateCrimes(tokenId, family) {
  const crimePool = FAMILY_CRIMES[family] || DEFAULT_CRIMES;

  // Use token ID as seed for deterministic selection
  const seed = parseInt(tokenId) || 0;
  const crimes = [];

  // Select 3 different crimes deterministically
  for (let i = 0; i < 3; i++) {
    const index = (seed + i * 7) % crimePool.length;
    crimes.push(crimePool[index]);
  }

  return crimes;
}

/**
 * Generate alias/nickname based on NFT traits
 * @param {Array} traits - Array of trait objects
 * @returns {string} Generated alias
 */
export function generateAlias(traits) {
  if (!traits || !Array.isArray(traits)) return 'The Ghost of Bone Harbor';

  // Extract key traits
  const head = traits.find(t => t.trait_type === 'Head' || t.trait_type === 'head')?.value;
  const weapon = traits.find(t => t.trait_type === 'Weapon' || t.trait_type === 'weapon')?.value;
  const skull = traits.find(t => t.trait_type === 'Skull' || t.trait_type === 'skull')?.value;
  const facialHair = traits.find(t => t.trait_type === 'Facial Hair' || t.trait_type === 'facial hair')?.value;

  // Weapon-based aliases
  if (weapon && weapon !== 'No Attribute') {
    if (weapon.toLowerCase().includes('tommy') || weapon.toLowerCase().includes('gun')) {
      return 'Machine Gun Cabone';
    }
    if (weapon.toLowerCase().includes('knife') || weapon.toLowerCase().includes('blade')) {
      return 'The Blade';
    }
    if (weapon.toLowerCase().includes('bat')) {
      return 'The Bone Crusher';
    }
    // Generic weapon holder
    return `${weapon} Wielder`;
  }

  // Head trait-based aliases
  if (head && head !== 'No Attribute') {
    if (head.toLowerCase().includes('knifed') || head.toLowerCase().includes('knife')) {
      return 'Scarface';
    }
    if (head.toLowerCase().includes('bullet') || head.toLowerCase().includes('shot')) {
      return 'The Bullet Dodger';
    }
    if (head.toLowerCase().includes('fedora')) {
      return 'Fedora Frank';
    }
  }

  // Skull trait-based aliases
  if (skull && skull !== 'No Attribute') {
    if (skull.toLowerCase().includes('cocaine') || skull.toLowerCase().includes('coke')) {
      return 'Snowman';
    }
    if (skull.toLowerCase().includes('gold')) {
      return 'Golden Bones';
    }
    if (skull.toLowerCase().includes('diamond')) {
      return 'Diamond Head';
    }
  }

  // Facial hair-based
  if (facialHair && facialHair !== 'No Attribute') {
    if (facialHair.toLowerCase().includes('mustache')) {
      return 'The Mustache';
    }
    if (facialHair.toLowerCase().includes('beard')) {
      return 'Bearded Bones';
    }
  }

  // Default mysterious alias
  return 'The Ghost of Bone Harbor';
}

/**
 * Get bounty amount based on total NFT count
 * @param {number} nftCount - Total NFTs owned
 * @returns {string} Formatted bounty amount
 */
export function getBountyAmount(nftCount) {
  let amount;

  if (nftCount >= 25) amount = TIER_BOUNTIES.Godfather;
  else if (nftCount >= 20) amount = TIER_BOUNTIES.Underboss;
  else if (nftCount >= 15) amount = TIER_BOUNTIES.Consigliere;
  else if (nftCount >= 10) amount = TIER_BOUNTIES.Caporegime;
  else if (nftCount >= 5) amount = TIER_BOUNTIES.Soldier;
  else amount = TIER_BOUNTIES.Associate;

  return `$${amount.toLocaleString()}`;
}

/**
 * Get warning stamp text based on NFT count and family
 * @param {number} nftCount - Total NFTs owned
 * @param {string} family - Family name
 * @returns {string|null} Stamp text or null
 */
export function getWarningStamp(nftCount, family) {
  if (nftCount >= 100) return 'CRIMINAL MASTERMIND';
  if (nftCount >= 50) return 'EXTREMELY DANGEROUS';
  if (family === 'Contract Killers') return 'ARMED & DANGEROUS';
  if (nftCount >= 25) return 'HIGH PRIORITY TARGET';
  return null;
}

/**
 * Shorten wallet address for display
 * @param {string} wallet - Full wallet address
 * @returns {string} Shortened address
 */
export function shortenWallet(wallet) {
  if (!wallet) return 'UNKNOWN';
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

/**
 * Check if NFT is listed for sale (placeholder - OpenSea may not always provide this)
 * @param {Object} nft - OpenSea NFT object
 * @returns {boolean}
 */
export function isListedForSale(nft) {
  // OpenSea API v2 may include listing data
  // This is a placeholder - actual implementation depends on API response
  return nft?.is_listed || false;
}

/**
 * Get status text based on listing status
 * @param {Object} nft - OpenSea NFT object
 * @returns {string}
 */
export function getStatusText(nft) {
  if (isListedForSale(nft)) {
    return 'ATTEMPTING TO FLEE - ON SALE';
  }
  return 'STILL AT LARGE';
}
