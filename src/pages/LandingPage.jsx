import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FolderCard from '../components/feature/FolderCard';
import TopSuspectCard from '../components/feature/TopSuspectCard';
import { fetchNFTOwnershipData } from '../config/alchemy';
import { groupByTier, getTopCollectors, getRandomItem } from '../utils/familyUtils';
import { getClassificationLevel } from '../types/classification';
import { getAllCollectionNFTs, getOpenSeaNFTsForOwner, extractOpenSeaImage } from '../utils/openseaApi';

export default function LandingPage({ onSelectCase, onSelectSuspect, cachedData }) {
  const [loading, setLoading] = useState(!cachedData);
  const [tierData, setTierData] = useState(cachedData?.tierData || {});
  const [topSuspects, setTopSuspects] = useState(cachedData?.topSuspects || []);
  const [tierImages, setTierImages] = useState(cachedData?.tierImages || {});
  const [suspectImages, setSuspectImages] = useState(cachedData?.suspectImages || {});
  const [collectionNFTs, setCollectionNFTs] = useState(cachedData?.collectionNFTs || []);
  const [error, setError] = useState(null);
  const [isLoadingRef, setIsLoadingRef] = useState(false);

  useEffect(() => {
    // Only load data if we don't have cached data AND not already loading
    if (!cachedData && !isLoadingRef) {
      loadData();
    }
  }, [cachedData]);

  const loadData = async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef) {
      console.log('Already loading, skipping duplicate call');
      return;
    }

    try {
      setIsLoadingRef(true);
      setLoading(true);

      // STEP 1: Fetch wallet ownership data from Alchemy (1 API call)
      console.log('Fetching wallet ownership from Alchemy...');
      const owners = await fetchNFTOwnershipData();

      // Group by tiers
      const grouped = groupByTier(owners);
      setTierData(grouped);

      // Get top collectors
      const top = getTopCollectors(owners, 10);
      const topThree = top.slice(0, 3);
      setTopSuspects(topThree);

      // STEP 2: Fetch collection NFTs from OpenSea (1 API call for general use)
      console.log('Fetching collection NFTs from OpenSea...');
      const nfts = await getAllCollectionNFTs();
      setCollectionNFTs(nfts);

      // STEP 3: Fetch actual NFTs for top 3 suspects (3 API calls - one per suspect)
      console.log('Fetching actual NFTs for top 3 suspects...');
      const suspectImgs = {};
      for (const suspect of topThree) {
        try {
          const suspectNFTs = await getOpenSeaNFTsForOwner(suspect.walletAddress);
          if (suspectNFTs && suspectNFTs.length > 0) {
            const randomNFT = getRandomItem(suspectNFTs);
            const imageUrl = extractOpenSeaImage(randomNFT);
            if (imageUrl) {
              suspectImgs[suspect.walletAddress] = imageUrl;
            }
          }
        } catch (error) {
          console.error(`Error fetching NFTs for suspect ${suspect.walletAddress}:`, error);
          // Fallback to collection NFT if suspect fetch fails
          if (nfts && nfts.length > 0) {
            const randomNFT = getRandomItem(nfts);
            const imageUrl = extractOpenSeaImage(randomNFT);
            if (imageUrl) {
              suspectImgs[suspect.walletAddress] = imageUrl;
            }
          }
        }
      }
      setSuspectImages(suspectImgs);

      // STEP 4: Assign random images from collection to tier folders
      if (nfts && nfts.length > 0) {
        const tierImgs = {};
        for (const tier of Object.keys(grouped)) {
          const randomNFT = getRandomItem(nfts);
          const imageUrl = extractOpenSeaImage(randomNFT);
          if (imageUrl) {
            tierImgs[tier] = imageUrl;
          }
        }
        setTierImages(tierImgs);
      }

      console.log('All data loaded successfully!');
      setLoading(false);
      setIsLoadingRef(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      setLoading(false);
      setIsLoadingRef(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="font-heading text-5xl md:text-6xl text-evidence-yellow mb-8">
              NFI CLASSIFIED
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
                  {'>'} ACCESSING FEDERAL DATABASE...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {'>'} RETRIEVING SYNDICATE RECORDS...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  {'>'} ANALYZING EVIDENCE PHOTOS...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="text-rust-red font-bold"
                >
                  {'>'} COMPILING MOST WANTED LIST...
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              className="font-typewriter text-off-white text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 1.7, duration: 1.5, repeat: Infinity }}
            >
              CLASSIFICATION LEVEL: TOP SECRET
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="paper-texture rounded-lg p-8 max-w-md">
          <h2 className="font-heading text-2xl text-rust-red mb-4">
            ACCESS DENIED
          </h2>
          <p className="font-typewriter text-sm text-noir-black">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen vignette sepia-tone">
      {/* Header */}
      <motion.header
        className="bg-burnt-shadow py-8 px-4 border-b-4 border-rust-red"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto max-w-7xl">
          <h1 className="font-heading text-5xl md:text-6xl text-evidence-yellow text-center mb-2">
            NFT BUREAU OF INVESTIGATION
          </h1>
          <p className="font-typewriter text-off-white text-center text-sm md:text-base">
            CLASSIFIED EVIDENCE BOARD - FOR AUTHORIZED PERSONNEL ONLY
          </p>
        </div>
      </motion.header>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Top Suspects Section - EMPHASIZED */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-10 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <h2 className="font-heading text-5xl md:text-7xl text-rust-red mb-4">
                MOST WANTED
              </h2>
              <div className="w-32 h-2 bg-rust-red mx-auto mb-3" />
              <p className="font-typewriter text-evidence-yellow text-lg md:text-xl">
                ⚠ TOP PRIORITY TARGETS ⚠
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {topSuspects.map((suspect, index) => (
              <motion.div
                key={suspect.walletAddress}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <TopSuspectCard
                  rank={suspect.rank}
                  wallet={suspect.walletAddress}
                  nftCount={suspect.nftCount}
                  badge={suspect.badge}
                  image={suspectImages[suspect.walletAddress]}
                  onClick={() => onSelectSuspect && onSelectSuspect(suspect.walletAddress)}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Case Files Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-6 text-center">
            <h2 className="font-heading text-4xl text-evidence-yellow mb-2">
              CASE FILES BY CLASSIFICATION
            </h2>
            <div className="w-24 h-1 bg-evidence-yellow mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(tierData).map(([tier, wallets], index) => {
              if (wallets.length === 0) return null;

              return (
                <motion.div
                  key={tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <FolderCard
                    title={tier}
                    classification={getClassificationLevel(tier)}
                    image={tierImages[tier]}
                    walletCount={wallets.length}
                    badge={tier === 'Godfather' ? 'CLASSIFIED' : null}
                    onClick={() => onSelectCase && onSelectCase('tier', tier, {
                      tierData,
                      topSuspects,
                      tierImages,
                      suspectImages,
                      collectionNFTs
                    })}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          className="mt-12 text-center py-8 border-t border-burnt-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="font-typewriter text-off-white text-sm">
            Inspired by the notorious{' '}
            <a
              href="https://opensea.io/collection/thealcabones"
              target="_blank"
              rel="noopener noreferrer"
              className="text-evidence-yellow hover:text-rust-red transition-colors underline"
            >
              Al Cabone Collection
            </a>
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
