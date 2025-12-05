import { useState } from 'react';
import { motion } from 'framer-motion';
import Polaroid from '../atomic/Polaroid';
import Stamp from '../atomic/Stamp';
import { truncateAddress } from '../../utils/familyUtils';
import { getMobsterName } from '../../utils/suspectNames';

/**
 * TopSuspectCard component - FBI index card for top collectors
 * @param {Object} props
 * @param {number} props.rank - Suspect ranking
 * @param {string} props.wallet - Wallet address
 * @param {number} props.nftCount - Number of NFTs owned
 * @param {string} props.badge - Badge type
 * @param {string} props.image - NFT image for mugshot
 * @param {Function} props.onClick - Click handler
 */
export default function TopSuspectCard({
  rank,
  wallet,
  nftCount,
  badge,
  image,
  onClick
}) {
  // Stable random values using useState initialization
  const [rotation] = useState(() => Math.random() * 1.5 - 0.75);
  const [hasLeftPin] = useState(() => Math.random() > 0.3);
  const [hasRightPin] = useState(() => Math.random() > 0.3);
  const [coffeeStainSize] = useState(() => 40 + Math.random() * 30);
  const [coffeeStainX] = useState(() => 10 + Math.random() * 60);
  const [coffeeStainY] = useState(() => 5 + Math.random() * 80);

  return (
    <motion.div
      className="paper-texture rounded-sm p-6 md:p-8 cursor-pointer relative border-4 border-rust-red evidence-shadow"
      whileHover={{
        y: -5,
        scale: 1.05
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
      onClick={onClick}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Thumbtacks at top corners */}
      {hasLeftPin && (
        <div className="thumbtack" style={{ top: '-6px', left: '20px' }} />
      )}
      {hasRightPin && (
        <div className="thumbtack" style={{ top: '-6px', right: '20px' }} />
      )}

      {/* Coffee stain */}
      <div
        className="coffee-stain"
        style={{
          width: `${coffeeStainSize}px`,
          height: `${coffeeStainSize}px`,
          top: `${coffeeStainY}%`,
          right: `${coffeeStainX}%`,
        }}
      />

      {/* Fingerprint smudge */}
      <div
        className="fingerprint"
        style={{
          width: '40px',
          height: '50px',
          bottom: '15%',
          left: '10%',
          transform: `rotate(${-25 + Math.random() * 50}deg)`,
        }}
      />

      {/* WANTED Banner - replaces badge stamp for cleaner look */}
      <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
        <div className="bg-rust-red px-6 py-1 font-heading text-off-white text-lg md:text-xl tracking-wider border-2 border-noir-black shadow-lg">
          WANTED
        </div>
      </div>

      <div className="relative mt-4">
        {/* Header */}
        <div className="border-b-4 border-noir-black pb-3 mb-4">
          <div className="font-typewriter text-sm md:text-base text-rust-red mb-2">
            NFI CASE FILE #{rank.toString().padStart(3, '0')}
          </div>
          <h4 className="font-heading text-2xl md:text-3xl text-noir-black leading-tight">
            {getMobsterName(rank)}
          </h4>
        </div>

        {/* Mugshot polaroid - MUCH LARGER */}
        <div className="flex justify-center mb-4">
          <div className="w-48 md:w-56">
            <Polaroid
              image={image}
              caption="EVIDENCE PHOTO"
              animate={false}
            />
          </div>
        </div>

        {/* Suspect details */}
        <div className="space-y-3">
          <div className="font-typewriter text-sm md:text-base">
            <span className="font-bold text-noir-black">CASE ID:</span>
            <div className="text-burnt-shadow break-all text-xs">
              {truncateAddress(wallet, 8, 6)}
            </div>
          </div>

          <div className="font-typewriter text-sm md:text-base">
            <span className="font-bold text-noir-black">KNOWN ASSOCIATES:</span>
            <div className="text-rust-red font-bold text-2xl md:text-3xl">
              {nftCount} Members
            </div>
          </div>

          <div className="font-typewriter text-sm md:text-base text-burnt-shadow italic mt-3 pt-3 border-t-2 border-burnt-shadow">
            {badge === 'MOST_WANTED' && '⚠ APPROACH WITH EXTREME CAUTION'}
            {badge === 'HIGH_PRIORITY' && '⚠ PRIORITY TARGET'}
            {badge === 'UNDER_SURVEILLANCE' && '⚠ ACTIVE MONITORING'}
            {!badge && 'UNDER INVESTIGATION'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
