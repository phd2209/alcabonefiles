import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Polaroid component - Displays NFT image in a polaroid frame
 * @param {Object} props
 * @param {string} props.image - Image URL
 * @param {string} props.caption - Caption text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animate - Whether to animate (default true)
 */
export default function Polaroid({ image, caption, className = '', animate = true }) {
  // Stable random rotation using useState initialization
  const [rotation] = useState(() => Math.random() * 4 - 2);

  const Component = animate ? motion.div : 'div';
  const animateProps = animate ? {
    whileHover: { scale: 1.02, rotate: 0 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={`bg-off-white p-3 pb-8 shadow-lg paper-texture ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
      {...animateProps}
    >
      <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={caption || 'NFT'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-aged-brown text-off-white font-typewriter text-sm">
            NO IMAGE
          </div>
        )}
      </div>
      {caption && (
        <div className="mt-2 text-center font-typewriter text-noir-black text-sm">
          {caption}
        </div>
      )}
    </Component>
  );
}
