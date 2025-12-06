import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOpenSeaNFTsForOwner, extractOpenSeaImage } from '../utils/openseaApi';
import { generateMobsterName } from '../utils/nameGenerator';
import WantedPosterModal from '../components/wanted-poster/WantedPosterModal';

export default function SuspectDetailPage({ walletAddress, onBack, cachedNFTs, onCacheNFTs }) {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPosterModal, setShowPosterModal] = useState(false);

  useEffect(() => {
    loadSuspectNFTs();
  }, [walletAddress]);

  const loadSuspectNFTs = async () => {
    // Check if we have cached NFTs for this wallet
    if (cachedNFTs && cachedNFTs.length > 0) {
      console.log(`Using cached NFTs for wallet: ${walletAddress} (${cachedNFTs.length} NFTs)`);
      setNfts(cachedNFTs);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching all NFTs for suspect: ${walletAddress}`);

      // Fetch all NFTs for this wallet (with pagination if needed)
      const allNFTs = await fetchAllNFTsWithPagination(walletAddress);
      setNfts(allNFTs);

      // Cache the fetched NFTs
      if (onCacheNFTs) {
        onCacheNFTs(walletAddress, allNFTs);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading suspect NFTs:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch all NFTs with full pagination support
  const fetchAllNFTsWithPagination = async (walletAddress) => {
    let allNFTs = [];
    let cursor = null;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < 10) { // Safety limit of 10 pages (500 NFTs max)
      const response = await fetch(
        cursor
          ? `https://api.opensea.io/api/v2/chain/ethereum/account/${walletAddress}/nfts?collection=thealcabones&limit=50&next=${cursor}`
          : `https://api.opensea.io/api/v2/chain/ethereum/account/${walletAddress}/nfts?collection=thealcabones&limit=50`,
        {
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': import.meta.env.VITE_OPENSEA_API_KEY,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data = await response.json();
      const nfts = data.nfts || [];

      allNFTs = allNFTs.concat(nfts);
      cursor = data.next;
      hasMore = nfts.length >= 50 && cursor;
      pageCount++;

      // Small delay between pagination requests
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return allNFTs;
  };

  const truncateAddress = (address, startChars = 6, endChars = 4) => {
    if (!address) return '';
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };

  // Organize NFTs into hierarchical structure
  const organizeHierarchy = (nfts) => {
    const total = nfts.length;

    if (total === 0) return { boss: null, lieutenants: [], soldierRows: [] };
    if (total === 1) return { boss: nfts[0], lieutenants: [], soldierRows: [] };

    // Boss is the first NFT
    const boss = nfts[0];

    // Distribute remaining NFTs
    const remaining = nfts.slice(1);

    // Always use exactly 3 lieutenants (if we have enough NFTs)
    const lieutenantCount = Math.min(3, remaining.length);
    const lieutenants = remaining.slice(0, lieutenantCount);
    const soldiers = remaining.slice(lieutenantCount);

    // Group ALL soldiers into rows of 3 blocks with 3 columns each (9 soldiers per row)
    const soldierRows = [];
    for (let i = 0; i < soldiers.length; i += 9) {
      const row = [];
      for (let j = 0; j < 3; j++) {
        const blockStart = i + (j * 3);
        const blockEnd = blockStart + 3;
        const block = soldiers.slice(blockStart, blockEnd);
        if (block.length > 0) {
          row.push(block);
        }
      }
      if (row.length > 0) {
        soldierRows.push(row);
      }
    }

    return { boss, lieutenants, soldierRows };
  };

  const hierarchy = organizeHierarchy(nfts);
  const mobsterName = generateMobsterName(walletAddress);

  if (loading) {
    return (
      <div className="min-h-screen vignette sepia-tone flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="font-heading text-5xl md:text-6xl text-evidence-yellow mb-8">
              ANALYZING SYNDICATE
            </div>

            <motion.div
              className="paper-texture rounded-lg p-8 mb-6 border-2 border-rust-red"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="font-typewriter text-noir-black space-y-3">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {'>'} PULLING COMPLETE CRIMINAL RECORD...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {'>'} ANALYZING FAMILY STRUCTURE...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="text-rust-red font-bold"
                >
                  {'>'} MAPPING CRIME ORGANIZATION...
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen vignette sepia-tone flex items-center justify-center p-4">
        <div className="paper-texture rounded-lg p-8 max-w-md">
          <h2 className="font-heading text-2xl text-rust-red mb-4">
            INVESTIGATION FAILED
          </h2>
          <p className="font-typewriter text-sm text-noir-black">
            {error}
          </p>
          <button
            onClick={onBack}
            className="mt-4 font-typewriter text-evidence-yellow hover:text-rust-red transition-colors"
          >
            ← RETURN TO CASE FILES
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen vignette sepia-tone">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-burnt-shadow py-6 px-4 border-b-4 border-rust-red"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto max-w-7xl">
          <button
            onClick={onBack}
            className="mb-4 font-typewriter text-evidence-yellow hover:text-rust-red transition-colors text-sm cursor-pointer"
          >
            ← BACK TO CASE FILES
          </button>
          <h1 className="font-heading text-4xl md:text-5xl text-evidence-yellow mb-2">
            CRIME ORGANIZATION CHART
          </h1>
          <div className="font-heading text-2xl text-rust-red mb-2">
            {mobsterName?.fullName || 'UNKNOWN SUSPECT'}
          </div>
          <p className="font-typewriter text-off-white text-sm">
            Case ID: {truncateAddress(walletAddress, 12, 10)} |
            Syndicate Size: {nfts.length}
          </p>
        </div>
      </motion.header>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* THE BOSS */}
        {hierarchy.boss && (
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center mb-6">
              <h2 className="font-heading text-3xl text-rust-red mb-2">THE BOSS</h2>
              <div className="w-24 h-1 bg-rust-red mx-auto" />
            </div>

            <div className="flex justify-center">
              <motion.div
                className="paper-texture rounded-lg p-6 border-4 border-rust-red relative evidence-shadow max-w-xs"
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute -top-3 -right-3 bg-rust-red px-4 py-2 font-body text-off-white text-base font-bold border-3 border-noir-black shadow-lg tracking-wider">
                  KINGPIN
                </div>

                <div className="bg-off-white p-3 shadow-lg">
                  <div className="bg-noir-black aspect-square flex items-center justify-center overflow-hidden">
                    <img
                      src={extractOpenSeaImage(hierarchy.boss)}
                      alt="Boss"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-typewriter text-noir-black text-xs text-center mt-2">
                    Evidence #{hierarchy.boss.identifier}
                  </div>
                </div>

                {/* Generate Wanted Poster Button */}
                <button
                  onClick={() => setShowPosterModal(true)}
                  className="mt-4 w-full paper-texture rounded-lg py-3 px-4 border-2 border-evidence-yellow hover:border-rust-red hover:bg-rust-red transition-all font-heading text-sm"
                  style={{
                    color: '#1B1B1B !important',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty('color', '#FF0000', 'important');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty('color', '#1B1B1B', 'important');
                  }}
                >
                  <span style={{ color: 'inherit' }}>📋 GENERATE WANTED POSTER</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* LIEUTENANTS WITH CONNECTING LINES */}
        {hierarchy.lieutenants.length > 0 && (
          <motion.div
            className="mb-12 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Vertical line from boss */}
            <div className="absolute left-1/2 -top-6 w-0.5 h-6 bg-rust-red" style={{ transform: 'translateX(-50%)' }} />

            <div className="text-center mb-6">
              <h2 className="font-heading text-2xl text-evidence-yellow mb-2">
                LIEUTENANTS ({hierarchy.lieutenants.length})
              </h2>
              <div className="w-20 h-1 bg-evidence-yellow mx-auto" />
            </div>

            {/* Horizontal line connecting lieutenants */}
            <div className="relative">
              {/* Calculate positions based on number of lieutenants */}
              {hierarchy.lieutenants.length > 1 && (
                <div
                  className="absolute h-0.5 bg-rust-red"
                  style={{
                    top: '-20px',
                    left: `${(1 / (hierarchy.lieutenants.length + 1)) * 100}%`,
                    right: `${(1 / (hierarchy.lieutenants.length + 1)) * 100}%`
                  }}
                />
              )}

              {/* Vertical lines down to each lieutenant */}
              {hierarchy.lieutenants.map((_, index) => {
                const totalLieutenants = hierarchy.lieutenants.length;
                const leftPosition = `${((index + 1) / (totalLieutenants + 1)) * 100}%`;
                return (
                  <div
                    key={`line-${index}`}
                    className="absolute w-0.5 h-5 bg-rust-red"
                    style={{ left: leftPosition, top: '-20px', transform: 'translateX(-50%)' }}
                  />
                );
              })}

              <div className="flex justify-around max-w-4xl mx-auto gap-8">
                {hierarchy.lieutenants.map((nft, index) => (
                  <div key={nft.identifier} className="relative flex-1 max-w-xs">
                    <motion.div
                      className="paper-texture rounded-lg p-3 border-2 border-evidence-yellow evidence-shadow"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="bg-off-white p-2 shadow-lg">
                        <div className="bg-noir-black aspect-square flex items-center justify-center overflow-hidden">
                          <img
                            src={extractOpenSeaImage(nft)}
                            alt={`Lieutenant ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-typewriter text-noir-black text-xs text-center mt-1">
                          #{nft.identifier}
                        </div>
                      </div>
                    </motion.div>

                    {/* Vertical line down from lieutenant (only on first row) */}
                    {index < 3 && hierarchy.soldierRows.length > 0 && (
                      <>
                        <div className="absolute left-1/2 bottom-0 w-0.5 h-6 bg-rust-red" style={{ transform: 'translateX(-50%)', top: '100%' }} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SOLDIERS ORGANIZED IN ROWS OF 3 BLOCKS */}
        {hierarchy.soldierRows && hierarchy.soldierRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-8"
          >
            <div className="text-center mb-6">
              <h2 className="font-heading text-xl text-off-white mb-2">
                SOLDIERS & ASSOCIATES
              </h2>
              <div className="w-16 h-1 bg-off-white mx-auto" />
            </div>

            {hierarchy.soldierRows.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="relative">
                {/* Horizontal line connecting blocks in this row */}
                {rowIndex === 0 && row.length > 1 && (
                  <div
                    className="absolute h-0.5 bg-rust-red"
                    style={{
                      top: '-10px',
                      left: `${(1 / (row.length + 1)) * 100}%`,
                      right: `${(1 / (row.length + 1)) * 100}%`
                    }}
                  />
                )}

                <div className="flex justify-around max-w-4xl mx-auto gap-4 md:gap-8">
                  {row.map((soldierBlock, blockIndex) => (
                    <div key={`block-${rowIndex}-${blockIndex}`} className="flex-1 max-w-xs relative min-w-0">
                      {soldierBlock.length > 0 && (
                        <>
                          {/* Vertical line down from lieutenant (only first row) */}
                          {rowIndex === 0 && (
                            <div className="absolute left-1/2 w-0.5 h-3 bg-rust-red" style={{ top: '-10px', transform: 'translateX(-50%)' }} />
                          )}

                          <div className="grid grid-cols-3 gap-1.5 md:gap-3">
                            {soldierBlock.map((nft, solIndex) => (
                              <motion.div
                                key={nft.identifier}
                                className="paper-texture rounded-lg p-1 md:p-2 border border-burnt-shadow evidence-shadow min-w-0"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7 + (rowIndex * 0.3 + blockIndex * 0.2 + solIndex * 0.05)}}
                                whileHover={{ scale: 1.1, zIndex: 10 }}
                              >
                                <div className="bg-off-white p-0.5 md:p-1 shadow">
                                  <div className="bg-noir-black aspect-square flex items-center justify-center overflow-hidden">
                                    <img
                                      src={extractOpenSeaImage(nft)}
                                      alt={`Soldier ${solIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                  <div className="font-typewriter text-noir-black text-center mt-0.5 md:mt-1 text-[0.5rem] md:text-[0.65rem] leading-tight break-all">
                                    #{nft.identifier}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Wanted Poster Modal */}
      {showPosterModal && hierarchy.boss && (
        <WantedPosterModal
          nft={hierarchy.boss}
          walletAddress={walletAddress}
          totalNFTs={nfts.length}
          onClose={() => setShowPosterModal(false)}
        />
      )}
    </div>
  );
}
