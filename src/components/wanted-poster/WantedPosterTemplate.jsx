import { useRef } from 'react';

/**
 * SVG-based Most Wanted Poster Template
 * Generates a printable/downloadable FBI-style wanted poster
 */
export default function WantedPosterTemplate({
  nftImage,
  tokenId,
  alias,
  family,
  bounty,
  crimes,
  lastSeen,
  statusText,
  warningStamp,
  scale = 1
}) {
  const svgRef = useRef(null);

  // Fixed SVG dimensions - DO NOT scale the viewBox
  const width = 800;
  const height = 1200;

  return (
    <svg
      ref={svgRef}
      width={width * scale}
      height={height * scale}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Special Elite, monospace' }}
    >
      {/* Definitions for textures and filters */}
      <defs>
        {/* Paper texture effect */}
        <filter id="paper-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="#D7C49E" surfaceScale="1.5">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
        </filter>

        {/* Enhanced stamp effect with rough edges */}
        <filter id="stamp-effect">
          <feTurbulence type="fractalNoise" baseFrequency="2" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="0.5" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.3 0 0 0  0 0 0.3 0 0  0 0 0 0.8 0" />
        </filter>

        {/* Photo border shadow */}
        <filter id="photo-shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="4" result="offsetblur" />
          <feFlood floodColor="#000000" floodOpacity="0.4" />
          <feComposite in2="offsetblur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Coffee stain gradient */}
        <radialGradient id="coffee-stain" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#4A3520" stopOpacity="0.12" />
          <stop offset="40%" stopColor="#4A3520" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#4A3520" stopOpacity="0" />
        </radialGradient>

        {/* Paper curl shadow - top */}
        <radialGradient id="curl-shadow-top" cx="50%" cy="0%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Paper curl shadow - bottom */}
        <radialGradient id="curl-shadow-bottom" cx="50%" cy="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background - Aged manila paper */}
      <rect width={width} height={height} fill="#D7C49E" />
      <rect width={width} height={height} filter="url(#paper-texture)" opacity="0.1" />

      {/* Paper curl shadows for depth */}
      <ellipse cx={width / 2} cy="0" rx={width * 0.6} ry="30" fill="url(#curl-shadow-top)" />
      <ellipse cx={width / 2} cy={height} rx={width * 0.6} ry="30" fill="url(#curl-shadow-bottom)" />

      {/* Border */}
      <rect
        x="20"
        y="20"
        width={width - 40}
        height={height - 40}
        fill="none"
        stroke="#6E5A3E"
        strokeWidth="4"
      />

      {/* Header Section */}
      <text
        x={width / 2}
        y="70"
        textAnchor="middle"
        fontSize="24"
        fontWeight="bold"
        fill="#1B1B1B"
        fontFamily="Bebas Neue, Arial Black, sans-serif"
        letterSpacing="3"
      >
        NFT BUREAU OF INVESTIGATION
      </text>

      <text
        x={width / 2}
        y="110"
        textAnchor="middle"
        fontSize="42"
        fontWeight="bold"
        fill="#9B2F2F"
        fontFamily="Bebas Neue, Arial Black, sans-serif"
        letterSpacing="4"
      >
        MOST WANTED
      </text>

      {/* Decorative line */}
      <line x1="60" y1="130" x2={width - 60} y2="130" stroke="#9B2F2F" strokeWidth="3" />

      {/* Photo Section */}
      <g filter="url(#photo-shadow)">
        {/* Photo border (polaroid style) */}
        <rect
          x="150"
          y="160"
          width="500"
          height="500"
          fill="#F4EEDB"
          stroke="#6E5A3E"
          strokeWidth="2"
        />

        {/* Photo inner frame */}
        <rect
          x="160"
          y="170"
          width="480"
          height="480"
          fill="#1B1B1B"
        />

        {/* NFT Image */}
        <image
          href={nftImage}
          x="160"
          y="170"
          width="480"
          height="480"
          preserveAspectRatio="xMidYMid slice"
        />
      </g>

      {/* Tape strips holding the photo - adds physical realism */}
      {/* Top left tape */}
      <rect
        x="135"
        y="148"
        width="50"
        height="18"
        fill="#E7D9B8"
        opacity="0.7"
        transform="rotate(-12 160 157)"
      />

      {/* Top right tape */}
      <rect
        x="615"
        y="148"
        width="50"
        height="18"
        fill="#E7D9B8"
        opacity="0.7"
        transform="rotate(12 640 157)"
      />

      {/* Bottom left tape */}
      <rect
        x="135"
        y="644"
        width="50"
        height="18"
        fill="#E7D9B8"
        opacity="0.7"
        transform="rotate(12 160 653)"
      />

      {/* Bottom right tape */}
      <rect
        x="615"
        y="644"
        width="50"
        height="18"
        fill="#E7D9B8"
        opacity="0.7"
        transform="rotate(-12 640 653)"
      />

      {/* Information Section - Aligned with photo */}
      <g>
        {/* Name */}
        <text
          x="150"
          y="710"
          fontSize="26"
          fontWeight="bold"
          fill="#1B1B1B"
          fontFamily="Special Elite, monospace"
        >
          NAME: AL CABONE #{tokenId}
        </text>

        {/* Alias */}
        <text
          x="150"
          y="750"
          fontSize="22"
          fill="#1B1B1B"
          fontFamily="Special Elite, monospace"
        >
          ALIAS: {alias}
        </text>

        {/* Family */}
        <text
          x="150"
          y="785"
          fontSize="22"
          fill="#1B1B1B"
          fontFamily="Special Elite, monospace"
        >
          FAMILY: {family}
        </text>

        {/* Reward */}
        <text
          x="150"
          y="830"
          fontSize="32"
          fontWeight="bold"
          fill="#9B2F2F"
          fontFamily="Bebas Neue, Arial Black, sans-serif"
          letterSpacing="2"
        >
          REWARD: {bounty} $SIN
        </text>

        {/* Charges section */}
        <text
          x="150"
          y="875"
          fontSize="20"
          fontWeight="bold"
          fill="#1B1B1B"
          fontFamily="Special Elite, monospace"
        >
          CHARGES:
        </text>

        {crimes.slice(0, 3).map((crime, index) => (
          <text
            key={index}
            x="165"
            y={905 + index * 30}
            fontSize="16"
            fill="#1B1B1B"
            fontFamily="Special Elite, monospace"
          >
            • {crime.length > 60 ? crime.substring(0, 57) + '...' : crime}
          </text>
        ))}

        {/* Last Seen */}
        <text
          x="150"
          y="1030"
          fontSize="18"
          fill="#6E5A3E"
          fontFamily="Special Elite, monospace"
        >
          LAST SEEN: {lastSeen}
        </text>

        {/* Status */}
        <text
          x="150"
          y="1065"
          fontSize="18"
          fontWeight="bold"
          fill="#9B2F2F"
          fontFamily="Special Elite, monospace"
        >
          STATUS: {statusText}
        </text>
      </g>

      {/* Warning Stamp (if applicable) - rotated for authenticity */}
      {warningStamp && (
        <g transform={`translate(${width - 200}, 180) rotate(-8)`} filter="url(#stamp-effect)">
          {/* Stamp background */}
          <ellipse cx="90" cy="45" rx="85" ry="40" fill="#9B2F2F" opacity="0.7" />

          {/* Stamp border */}
          <ellipse
            cx="90"
            cy="45"
            rx="80"
            ry="35"
            fill="none"
            stroke="#9B2F2F"
            strokeWidth="3"
            strokeDasharray="5,3"
          />

          {/* Stamp text */}
          <text
            x="90"
            y="40"
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#FFFFFF"
            fontFamily="Bebas Neue, Arial Black, sans-serif"
            letterSpacing="1"
          >
            {warningStamp.split(' ').map((word, i) => (
              <tspan key={i} x="90" dy={i === 0 ? 0 : 14}>
                {word}
              </tspan>
            ))}
          </text>
        </g>
      )}

      {/* Coffee stain in bottom right corner - adds character and story */}
      <ellipse
        cx={width - 100}
        cy={height - 100}
        rx="80"
        ry="60"
        fill="url(#coffee-stain)"
      />

      {/* Footer text */}
      <text
        x={width / 2}
        y={height - 40}
        textAnchor="middle"
        fontSize="12"
        fill="#6E5A3E"
        fontFamily="Special Elite, monospace"
      >
        APPROACH WITH CAUTION - ARMED AND DANGEROUS
      </text>
    </svg>
  );
}
