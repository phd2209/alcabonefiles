import { motion } from 'framer-motion';

/**
 * Stamp component - FBI-style red stamp overlay
 * @param {Object} props
 * @param {string} props.type - Stamp type (MOST_WANTED, HIGH_PRIORITY, etc.)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animate - Whether to animate (default true)
 */
export default function Stamp({ type, className = '', animate = true }) {
  const getStampText = () => {
    switch (type) {
      case 'MOST_WANTED':
        return 'MOST WANTED';
      case 'HIGH_PRIORITY':
        return 'HIGH PRIORITY';
      case 'UNDER_SURVEILLANCE':
        return 'UNDER SURVEILLANCE';
      case 'ACTIVE_INVESTIGATION':
        return 'ACTIVE INVESTIGATION';
      case 'CLASSIFIED':
        return 'CLASSIFIED';
      case 'CONFIDENTIAL':
        return 'CONFIDENTIAL';
      default:
        return type;
    }
  };

  const Component = animate ? motion.div : 'div';
  const animateProps = animate ? {
    initial: { scale: 0.8, rotate: 0, opacity: 0 },
    animate: {
      scale: 1,
      rotate: Math.random() * 20 - 10,
      opacity: 1
    },
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.2
    }
  } : {};

  return (
    <Component
      className={`stamp-effect ${className}`}
      {...animateProps}
    >
      <div
        className="relative border-4 border-rust-red rounded-lg px-4 py-2 bg-rust-red/20"
        style={{
          transform: `rotate(${Math.random() * 20 - 10}deg)`,
        }}
      >
        <div className="font-heading text-rust-red text-lg md:text-xl font-bold uppercase tracking-widest text-center leading-tight">
          {getStampText()}
        </div>
        <div className="absolute inset-0 border-2 border-rust-red rounded-lg" style={{ margin: '2px' }} />
      </div>
    </Component>
  );
}
