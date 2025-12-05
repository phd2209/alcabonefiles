import { useState } from 'react';
import { motion } from 'framer-motion';
import Polaroid from '../atomic/Polaroid';
import Stamp from '../atomic/Stamp';

/**
 * FolderCard component - Manila folder case file card
 * @param {Object} props
 * @param {string} props.title - Case file title
 * @param {string} props.classification - Classification level
 * @param {string} props.image - NFT image for polaroid
 * @param {number} props.walletCount - Number of wallets in this category
 * @param {string} props.badge - Badge type if applicable
 * @param {Function} props.onClick - Click handler
 */
export default function FolderCard({
  title,
  classification,
  image,
  walletCount,
  badge,
  onClick
}) {
  // Stable random values using useState initialization
  const [fileNumber] = useState(() => `NFI-${Math.floor(Math.random() * 9000 + 1000)}-${title.substring(0, 3).toUpperCase()}`);
  const [rotation] = useState(() => Math.random() * 2 - 1);
  const [subjectNumber] = useState(() => Math.floor(Math.random() * 9999));

  return (
    <motion.div
      className="manila-folder rounded-lg p-6 cursor-pointer relative overflow-hidden evidence-shadow"
      whileHover={{
        y: -5,
        rotate: -1,
        scale: 1.02
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
      {/* Folder tab effect with classification - realistic manila tab */}
      <div
        className="folder-tab absolute -top-8 left-4 h-8 flex items-end justify-center pb-1"
        style={{
          width: '140px',
        }}
      >
        <span className="font-typewriter text-[10px] text-noir-black font-bold tracking-wider drop-shadow-sm relative z-10">
          {title.toUpperCase()}
        </span>
      </div>

      {/* File number in top right */}
      <div className="absolute top-2 right-2 font-typewriter text-xs text-burnt-shadow opacity-70">
        {fileNumber}
      </div>

      {/* Thumbtack for pinned effect - centered at top */}
      <div className="thumbtack" style={{ top: '10px', left: '50%', transform: 'translateX(-50%)' }} />

      {/* Badge stamp if applicable */}
      {badge && (
        <div className="absolute top-12 right-4 z-10 rotate-12">
          <Stamp type={badge} animate={false} />
        </div>
      )}

      {/* "CONFIDENTIAL" stamp at angle - moved to right side */}
      <div className="absolute bottom-4 right-4 font-heading text-rust-red text-lg opacity-30 rotate-12 border-2 border-rust-red px-2 py-1">
        CONFIDENTIAL
      </div>

      <div className="relative z-0 mt-4">
        {/* Header */}
        <div className="mb-4">
          <h3 className="font-heading text-2xl text-noir-black mb-1">
            CASE FILE: <span className="text-rust-red">{title.toUpperCase()}</span>
          </h3>
          <p className="font-typewriter text-xs text-burnt-shadow uppercase tracking-wide">
            Classification: <span className="inline-block bg-evidence-yellow bg-opacity-20 px-2 py-0.5 border border-evidence-yellow text-noir-black font-bold">{classification}</span>
          </p>
          <p className="font-typewriter text-xs text-burnt-shadow mt-1">
            Filed: NOV 30, 1947
          </p>
        </div>

        {/* Polaroid */}
        <div className="flex justify-center mb-4">
          <div className="w-48">
            <Polaroid
              image={image}
              caption={`Subject ${subjectNumber.toString().padStart(4, '0')}`}
              animate={false}
            />
          </div>
        </div>

        {/* Contents info */}
        <div className="border-t-2 border-burnt-shadow pt-3">
          <p className="font-typewriter text-sm text-noir-black">
            <span className="font-bold">CONTENTS:</span> <span className="font-bold text-base text-rust-red text-noir-black">{walletCount}</span> {walletCount === 1 ? 'Syndicate' : 'Syndicates'}
          </p>
        </div>
      </div>

      {/* Hover effect overlay */}
      <motion.div
        className="absolute inset-0 bg-aged-brown pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.05 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
}
