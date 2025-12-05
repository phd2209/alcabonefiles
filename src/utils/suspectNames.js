/**
 * Generate mobster skeleton names for suspects
 * Based on classic mob naming conventions with skeleton/death themes
 */

const MOBSTER_NAMES = [
  // Top 3 - Most notorious
  'Vincent "Bone Breaker" Malone',
  'Anthony "The Reaper" Costello',
  'Salvatore "Skull Crusher" Moretti',

  // Additional names for future use
  'Giovanni "Dead Eyes" Romano',
  'Marco "The Corpse" Vitale',
  'Dominic "Grave Digger" Falcone',
  'Carlo "Bone Collector" DeAngelo',
  'Lorenzo "The Crypt Keeper" Ricci',
  'Angelo "Tombstone" Battaglia',
  'Roberto "Cold Bones" Ferrara',
];

/**
 * Get a consistent mobster name for a suspect based on their rank
 * @param {number} rank - Suspect ranking (1-based)
 * @returns {string} Mobster name
 */
export function getMobsterName(rank) {
  // Use rank - 1 because rank is 1-based but array is 0-based
  const index = (rank - 1) % MOBSTER_NAMES.length;
  return MOBSTER_NAMES[index];
}

/**
 * Get nickname only (the quoted part)
 * @param {number} rank - Suspect ranking
 * @returns {string} Just the nickname
 */
export function getNickname(rank) {
  const fullName = getMobsterName(rank);
  const match = fullName.match(/"([^"]+)"/);
  return match ? match[1] : 'The Boss';
}
