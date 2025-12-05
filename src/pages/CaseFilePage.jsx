import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { extractOpenSeaImage } from '../utils/openseaApi';
import { getClassificationLevel } from '../types/classification';
import { generateMobsterName } from '../utils/nameGenerator';

export default function CaseFilePage({ caseType, caseValue, cachedData, onBack, onSelectSuspect }) {
  const [wallets, setWallets] = useState([]);
  const [walletImages, setWalletImages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaseData();
  }, [caseType, caseValue]);

  const loadCaseData = () => {
    if (caseType === 'tier') {
      // Get wallets for this tier
      const tierWallets = cachedData?.tierData?.[caseValue] || [];
      setWallets(tierWallets);

      // Determine display style based on wallet count
      // Gallery view only for tiers with <= 50 members (Godfather, Underboss, Consigliere)
      const useGalleryView = tierWallets.length <= 50;

      if (useGalleryView && tierWallets.length > 0) {
        // Gallery view - assign unique NFTs (with token ID + image) from cached collection NFTs (NO API CALLS)
        const nfts = cachedData?.collectionNFTs || [];
        const topSuspects = cachedData?.topSuspects || [];
        const suspectImages = cachedData?.suspectImages || {};

        if (nfts.length > 0) {
          const images = {};
          // Create a shuffled copy to ensure unique images per wallet
          const shuffledNFTs = [...nfts].sort(() => Math.random() - 0.5);

          tierWallets.forEach((wallet, index) => {
            // Check if this wallet is in the top 3 Most Wanted
            const isTopSuspect = topSuspects.some(s => s.walletAddress === wallet.walletAddress);

            if (isTopSuspect && suspectImages[wallet.walletAddress]) {
              // Use the actual NFT image from Most Wanted
              const nft = shuffledNFTs[index % shuffledNFTs.length];
              const tokenId = nft?.identifier || nft?.token_id;

              images[wallet.walletAddress] = {
                image: suspectImages[wallet.walletAddress],
                tokenId: tokenId || 'ACTUAL'
              };
            } else {
              // Assign unique NFT from the pool of 50
              const nft = shuffledNFTs[index % shuffledNFTs.length];
              const imageUrl = extractOpenSeaImage(nft);
              const tokenId = nft?.identifier || nft?.token_id;

              if (imageUrl && tokenId) {
                images[wallet.walletAddress] = {
                  image: imageUrl,
                  tokenId: tokenId
                };
              }
            }
          });
          setWalletImages(images);
        }
      }
      setLoading(false);
    } else if (caseType === 'collector') {
      // Find the specific collector
      const collector = cachedData?.topSuspects?.find(s => s.walletAddress === caseValue);
      if (collector) {
        setWallets([collector]);
        // Use cached image if available
        const cachedImage = cachedData?.suspectImages?.[caseValue];
        if (cachedImage) {
          setWalletImages({ [caseValue]: cachedImage });
        }
      }
      setLoading(false);
    }
  };

  const truncateAddress = (address, startChars = 6, endChars = 4) => {
    if (!address) return '';
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  };

  // Tier descriptions for summary box
  const tierDescriptions = {
    Godfather: "Subjects classified as GODFATHER represent the apex of organized criminal leadership within the Al Cabone syndicate. These individuals command vast criminal enterprises, control multiple family operations, and maintain extensive networks of subordinates. Federal intelligence indicates these suspects possess extraordinary influence over underworld activities and are considered extremely dangerous.",
    Underboss: "UNDERBOSS classification denotes high-ranking syndicate members who serve as second-in-command to Godfather-tier suspects. These individuals demonstrate advanced criminal sophistication, oversee major operations, and maintain direct command over mid-tier operatives. They are considered high-value targets for federal prosecution.",
    Consigliere: "CONSIGLIERE tier subjects function as strategic advisors and counselors within the syndicate hierarchy. These suspects demonstrate exceptional cunning, manage complex criminal networks, and often serve as intermediaries between leadership tiers. Their knowledge of syndicate operations makes them priority intelligence targets.",
    Caporegime: "CAPOREGIME classification identifies mid-level syndicate commanders who oversee crews of soldiers and manage regional criminal operations. These suspects demonstrate proven leadership capabilities and maintain active involvement in illicit activities. Continued surveillance is warranted to map organizational structure.",
    Soldier: "SOLDIER tier represents entry-level made members of the Al Cabone syndicate. These individuals carry out direct criminal operations under the supervision of higher-tier suspects. While considered lower threat individually, their collective activity represents the operational foundation of syndicate criminal enterprises."
  };

  // Threat levels by tier
  const threatLevels = {
    Godfather: "MAXIMUM",
    Underboss: "HIGH",
    Consigliere: "ELEVATED",
    Caporegime: "MODERATE",
    Soldier: "LOW TO MODERATE"
  };

  // Calculate total Cabones held by this tier
  const totalCabones = wallets.reduce((sum, wallet) => sum + wallet.nftCount, 0);

  // Determine which layout to use based on wallet count
  // Gallery view: Tiers with <= 50 members (Godfather, Underboss, Consigliere)
  // List view: Tiers with > 50 members (Caporegime, Soldier)
  const isGalleryView = wallets.length <= 50 && wallets.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen vignette sepia-tone flex items-center justify-center">
        <div className="text-center">
          <div className="font-heading text-4xl text-evidence-yellow mb-4">
            OPENING CASE FILE...
          </div>
          <div className="font-typewriter text-off-white">
            Classification: {caseValue}
          </div>
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
            ← BACK TO EVIDENCE BOARD
          </button>
          <h1 className="font-heading text-4xl md:text-5xl text-evidence-yellow mb-2">
            CASE FILE: {caseValue.toUpperCase()}
          </h1>
          <p className="font-typewriter text-off-white text-sm">
            Classification Level: {getClassificationLevel(caseValue)} |
            Total Suspects: {wallets.length}
          </p>
        </div>
      </motion.header>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Tier Summary Report Box - Only for tier cases */}
        {caseType === 'tier' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="paper-texture bg-manila-paper border-2 border-burnt-shadow shadow-md p-6 mb-10 relative"
          >
            {/* Classified Stamp */}
            <div
              className="absolute top-4 right-4 text-2xl font-heading font-bold tracking-widest text-rust-red transform -rotate-12"
              style={{
                opacity: 0.8,
                mixBlendMode: 'multiply'
              }}
            >
              CLASSIFIED
            </div>

            {/* Header */}
            <h2 className="font-typewriter text-xl text-noir-black mb-4 border-b-2 border-burnt-shadow pb-2">
              NFT BUREAU OF INVESTIGATION
            </h2>

            <div className="font-typewriter text-noir-black text-sm leading-relaxed space-y-3">
              {/* Tier Classification */}
              <p>
                <strong>CLASSIFIED REPORT:</strong> TIER — {caseValue.toUpperCase()}
              </p>

              {/* Description */}
              <p className="text-justify">
                {tierDescriptions[caseValue] || "Classification details pending further investigation."}
              </p>

              {/* Intelligence Summary */}
              <p className="mt-4"><strong>INTELLIGENCE SUMMARY:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Identified Syndicate Members: <strong>{totalCabones}</strong></li>
                <li>Known Associates Under Surveillance: <strong>{wallets.length}</strong></li>
                <li>Threat Assessment: <strong className="text-rust-red">{threatLevels[caseValue] || "UNDER ASSESSMENT"}</strong></li>
                <li>Security Classification: <strong>{getClassificationLevel(caseValue)}</strong></li>
              </ul>

              {/* Footer note */}
              <p className="text-xs mt-4 pt-3 border-t border-burnt-shadow opacity-70">
                Document Classification: TOP SECRET // Eyes Only // Federal Bones Investigation Division
              </p>
            </div>
          </motion.div>
        )}

        {isGalleryView ? (
          // HIGH TIER: Gallery-style cards (like Most Wanted but smaller)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wallets.map((wallet, index) => {
              // Tier-based styling
              const isGodfather = caseValue === 'Godfather';
              const isUnderboss = caseValue === 'Underboss';
              const isConsigliere = caseValue === 'Consigliere';

              const borderClass = isGodfather
                ? 'border-4 border-evidence-yellow'
                : isUnderboss
                  ? 'border-4 border-rust-red'
                  : 'border-4 border-noir-black';

              // Calculate rotation once based on wallet address (deterministic)
              const rotation = (parseInt(wallet.walletAddress.slice(-4), 16) % 40) / 10 - 2;

              return (
              <motion.div
                key={wallet.walletAddress}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`paper-texture rounded-lg p-6 ${borderClass} relative evidence-shadow cursor-pointer`}
                onClick={() => onSelectSuspect && onSelectSuspect(wallet.walletAddress)}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                {/* Godfather: Extra border accent */}
                {isGodfather && (
                  <div className="absolute inset-0 border-2 border-rust-red rounded-lg pointer-events-none" style={{ margin: '6px' }} />
                )}

                {/* Rank badge */}
                <div className="absolute -top-3 left-4 bg-rust-red px-4 py-1 font-heading text-off-white text-sm border-2 border-noir-black">
                  SUSPECT #{(index + 1).toString().padStart(3, '0')}
                </div>

                {/* Threat Level Stamp - Bottom Right */}
                {(isGodfather || isUnderboss) && (
                  <div
                    className="absolute bottom-2 right-2 font-heading text-rust-red text-xs px-3 py-1 bg-off-white border-2 border-rust-red transform rotate-6 shadow-lg z-10"
                    style={{
                      opacity: 0.95,
                      mixBlendMode: 'multiply'
                    }}
                  >
                    {isGodfather ? 'EXTREMELY DANGEROUS' : 'HIGH VALUE TARGET'}
                  </div>
                )}

                {/* Evidence tape for Godfather */}
                {isGodfather && (
                  <>
                    <div
                      className="absolute top-0 left-1/2 w-16 h-6 bg-evidence-yellow opacity-30 transform -translate-x-1/2 -translate-y-1/2 rotate-45"
                      style={{
                        border: '1px dashed rgba(0,0,0,0.2)'
                      }}
                    />
                    <div
                      className="absolute bottom-0 right-4 w-12 h-6 bg-evidence-yellow opacity-30 transform translate-y-1/2 -rotate-12"
                      style={{
                        border: '1px dashed rgba(0,0,0,0.2)'
                      }}
                    />
                  </>
                )}

                {/* Mobster Name */}
                <div className="mb-3 text-center">
                  <div className="font-heading text-lg text-rust-red">
                    {generateMobsterName(wallet.walletAddress)?.fullName || 'UNKNOWN'}
                  </div>
                </div>

                {/* Polaroid image */}
                <div className="polaroid-frame mx-auto mb-4" style={{ width: '200px' }}>
                  <div className="bg-off-white p-3 shadow-lg" style={{ transform: `rotate(${rotation}deg)` }}>
                    <div className="bg-noir-black aspect-square flex items-center justify-center overflow-hidden">
                      {walletImages[wallet.walletAddress]?.image ? (
                        <img
                          src={walletImages[wallet.walletAddress].image}
                          alt="Suspect"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="font-typewriter text-off-white text-xs">NO PHOTO</div>
                      )}
                    </div>
                    <div className="font-typewriter text-noir-black text-xs text-center mt-2">
                      Evidence #{walletImages[wallet.walletAddress]?.tokenId || (index + 1)}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="font-typewriter text-sm space-y-2">
                  <div>
                    <span className="font-bold text-noir-black">CASE ID:</span>
                    <div className="text-burnt-shadow break-all text-xs">
                      {truncateAddress(wallet.walletAddress, 10, 8)}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-noir-black">KNOWN ASSOCIATES:</span>
                    <span className="text-rust-red ml-2">{wallet.nftCount}</span>
                  </div>
                  <div>
                    <span className="font-bold text-noir-black">THREAT LEVEL:</span>
                    <span className="text-rust-red ml-2">{caseValue}</span>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        ) : (
          // LOW TIER: Compact list view
          <div className="paper-texture rounded-lg border-4 border-noir-black evidence-shadow">
            <div className="bg-burnt-shadow border-b-4 border-noir-black p-4">
              <h2 className="font-heading text-2xl text-evidence-yellow">
                PERSONNEL ROSTER
              </h2>
              <p className="font-typewriter text-off-white text-sm">
                All known associates in this classification
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {wallets.map((wallet, index) => (
                  <motion.a
                    key={wallet.walletAddress}
                    href={`https://opensea.io/${wallet.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-3 bg-off-white border-2 border-burnt-shadow hover:border-rust-red transition-colors cursor-pointer"
                  >
                    {/* Icon placeholder (no images for list view) */}
                    <div className="flex-shrink-0 w-16 h-16 bg-burnt-shadow border-2 border-noir-black flex items-center justify-center">
                      <div className="font-heading text-evidence-yellow text-2xl">
                        #{(index + 1)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-grow font-typewriter text-xs">
                      <div className="font-bold text-noir-black mb-1">
                        SUSPECT #{(index + 1).toString().padStart(4, '0')}
                      </div>
                      <div className="text-burnt-shadow">
                        {truncateAddress(wallet.walletAddress, 12, 8)}
                      </div>
                    </div>

                    {/* NFT count badge */}
                    <div className="flex-shrink-0 bg-rust-red text-off-white px-3 py-1 font-heading text-sm border-2 border-noir-black">
                      {wallet.nftCount} MEMBERS
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
