/**
 * Mobster name generator for Al Cabone suspects
 */

const FIRST_NAMES = [
  'Vincent', 'Salvatore', 'Angelo', 'Dominic', 'Carmine',
  'Giuseppe', 'Antonio', 'Marco', 'Luca', 'Giovanni',
  'Rocco', 'Vito', 'Enzo', 'Carlo', 'Bruno',
  'Dante', 'Lorenzo', 'Matteo', 'Paolo', 'Sergio',
  'Franco', 'Gino', 'Mario', 'Rico', 'Tony',
  'Joey', 'Frankie', 'Nicky', 'Johnny', 'Tommy',
  'Paulie', 'Sonny', 'Michael', 'Fredo', 'Clemenza',
  'Tessio', 'Hyman', 'Moe', 'Jack', 'Eddie',
  'Charlie', 'Lucky', 'Bugsy', 'Meyer', 'Arnold',
  'Albert', 'Louie', 'Sammy', 'Jimmy', 'Bobby'
];

const NICKNAMES = [
  'Bone Breaker', 'The Knife', 'Two Fingers', 'Big Nose', 'The Bull',
  'Scarface', 'The Shadow', 'Ice Pick', 'The Hammer', 'Lucky',
  'The Butcher', 'Knuckles', 'The Snake', 'Mad Dog', 'The Fox',
  'Iceman', 'The Executioner', 'The Ghost', 'Brass Knuckles', 'The Undertaker',
  'Smokey', 'The Enforcer', 'Three Fingers', 'The Shark', 'Silent Death',
  'The Accountant', 'Numbers', 'The Professor', 'The Gentleman', 'Velvet',
  'Machine Gun', 'The Cigar', 'The Chemist', 'The Barber', 'Knifeman',
  'The Tailor', 'Whispers', 'The Fixer', 'Goldfinger', 'The Rat',
  'Boom Boom', 'The Weasel', 'Big Ears', 'The Chin', 'Crazy Eyes',
  'The Boss', 'The Plumber', 'The Cook', 'The Cleaner', 'The Artist'
];

const LAST_NAMES = [
  'Malone', 'Rossi', 'Romano', 'Colombo', 'Ricci',
  'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti',
  'De Luca', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana',
  'Ferrara', 'Mariani', 'Villa', 'Benedetti', 'Santoro',
  'Caruso', 'Ferraro', 'Valentino', 'Battaglia', 'Marchetti',
  'D\'Angelo', 'Palmieri', 'De Santis', 'Cattaneo', 'Messina',
  'Costello', 'Luciano', 'Genovese', 'Gambino', 'Bonanno',
  'Profaci', 'Magaddino', 'Zerilli', 'Accardo', 'Giancana',
  'Marcello', 'Trafficante', 'Civella', 'Balistrieri', 'Licavoli',
  'Dragna', 'Fratianno', 'Scarfo', 'Testa', 'Stanfa'
];

/**
 * Generate a deterministic mobster name based on wallet address
 * @param {string} walletAddress - Ethereum wallet address
 * @returns {Object} { firstName, nickname, lastName, fullName }
 */
export function generateMobsterName(walletAddress) {
  if (!walletAddress) return null;

  // Use wallet address as seed for deterministic randomness
  const seed = parseInt(walletAddress.slice(2, 10), 16);

  const firstNameIndex = seed % FIRST_NAMES.length;
  const nicknameIndex = Math.floor(seed / FIRST_NAMES.length) % NICKNAMES.length;
  const lastNameIndex = Math.floor(seed / (FIRST_NAMES.length * NICKNAMES.length)) % LAST_NAMES.length;

  const firstName = FIRST_NAMES[firstNameIndex];
  const nickname = NICKNAMES[nicknameIndex];
  const lastName = LAST_NAMES[lastNameIndex];

  return {
    firstName,
    nickname,
    lastName,
    fullName: `${firstName} "${nickname}" ${lastName}`
  };
}

/**
 * Generate a short name (first name + last name only)
 * @param {string} walletAddress - Ethereum wallet address
 * @returns {string} First and last name
 */
export function generateShortName(walletAddress) {
  const name = generateMobsterName(walletAddress);
  return name ? `${name.firstName} ${name.lastName}` : '';
}

/**
 * Generate just the nickname
 * @param {string} walletAddress - Ethereum wallet address
 * @returns {string} Nickname only
 */
export function generateNickname(walletAddress) {
  const name = generateMobsterName(walletAddress);
  return name ? name.nickname : '';
}
