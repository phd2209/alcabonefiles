import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WantedPosterTemplate from './WantedPosterTemplate';
import {
  fetchNFTMetadata,
  extractFamily,
  generateCrimes,
  generateAlias,
  getBountyAmount,
  getWarningStamp,
  shortenWallet,
  getStatusText
} from '../../utils/posterUtils';
import { downloadSvgAsPng } from '../../utils/svgToPng';
import { extractOpenSeaImage } from '../../utils/openseaApi';

export default function WantedPosterModal({ nft, walletAddress, totalNFTs, onClose }) {
  const [posterData, setPosterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef(null);

  useEffect(() => {
    loadPosterData();
  }, [nft]);

  const loadPosterData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch metadata to get traits using token ID
      const metadata = await fetchNFTMetadata(nft.identifier);
      const traits = metadata?.traits || [];

      // Extract data
      const family = extractFamily(traits);
      const alias = generateAlias(traits);
      const crimes = generateCrimes(nft.identifier, family);
      const bounty = getBountyAmount(totalNFTs);
      const warningStamp = getWarningStamp(totalNFTs, family);
      const statusText = getStatusText(nft);
      const lastSeen = shortenWallet(walletAddress);
      const nftImageUrl = extractOpenSeaImage(nft);

      // Convert image to base64 to avoid CORS issues
      let nftImage = nftImageUrl;
      try {
        const response = await fetch(nftImageUrl);
        const blob = await response.blob();
        nftImage = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error('Error loading NFT image:', err);
        // Fallback to original URL if conversion fails
      }

      setPosterData({
        nftImage,
        tokenId: nft.identifier,
        alias,
        family,
        bounty,
        crimes,
        lastSeen,
        statusText,
        warningStamp
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading poster data:', err);
      setError('Failed to load poster data. Please try again.');
      setLoading(false);
    }
  };

  const handleDownload = async (scale = 2) => {
    try {
      setDownloading(true);

      // Find the SVG element in the poster template
      const svgElement = posterRef.current?.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      const filename = `alcabone-wanted-poster-${nft.identifier}.png`;
      await downloadSvgAsPng(svgElement, filename, scale);

      setDownloading(false);
    } catch (err) {
      console.error('Error downloading poster:', err);
      alert('Failed to download poster. Please try again.');
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-noir-black bg-opacity-90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-off-white rounded-lg shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-rust-red text-off-white rounded-full hover:bg-burnt-shadow transition-colors font-heading text-xl"
          >
            ×
          </button>

          {/* Content */}
          <div className="p-8">
            {loading && (
              <div className="text-center py-12">
                <div className="font-heading text-2xl text-noir-black mb-4">
                  GENERATING WANTED POSTER...
                </div>
                <div className="font-typewriter text-burnt-shadow">
                  {'>'} Analyzing criminal record...
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="font-heading text-2xl text-rust-red mb-4">
                  ERROR
                </div>
                <div className="font-typewriter text-noir-black mb-6">
                  {error}
                </div>
                <button
                  onClick={onClose}
                  className="font-typewriter text-evidence-yellow hover:text-rust-red transition-colors"
                >
                  CLOSE
                </button>
              </div>
            )}

            {posterData && !loading && !error && (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="font-heading text-3xl text-rust-red mb-2">
                    WANTED POSTER PREVIEW
                  </h2>
                  <p className="font-typewriter text-sm text-burnt-shadow">
                    Al Cabone #{nft.identifier} - {posterData.family}
                  </p>
                </div>

                {/* Poster Preview */}
                <div
                  ref={posterRef}
                  className="bg-burnt-shadow p-4 rounded-lg mb-6 flex justify-center"
                >
                  <div className="max-w-2xl w-full">
                    <WantedPosterTemplate {...posterData} scale={0.8} />
                  </div>
                </div>

                {/* Download Options */}
                <div className="border-t-2 border-burnt-shadow pt-6">
                  <div className="font-heading text-xl text-noir-black mb-4">
                    DOWNLOAD OPTIONS
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Social Media Size */}
                    <button
                      onClick={() => handleDownload(2)}
                      disabled={downloading}
                      className="paper-texture rounded-lg p-4 border-2 border-evidence-yellow hover:border-rust-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-heading text-lg text-noir-black mb-1">
                        SOCIAL MEDIA
                      </div>
                      <div className="font-typewriter text-sm text-burnt-shadow">
                        1600x2000px - Optimized for Twitter/Discord
                      </div>
                    </button>

                    {/* Print Quality */}
                    <button
                      onClick={() => handleDownload(3)}
                      disabled={downloading}
                      className="paper-texture rounded-lg p-4 border-2 border-evidence-yellow hover:border-rust-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-heading text-lg text-noir-black mb-1">
                        PRINT QUALITY
                      </div>
                      <div className="font-typewriter text-sm text-burnt-shadow">
                        2400x3000px - High resolution for printing
                      </div>
                    </button>
                  </div>

                  {downloading && (
                    <div className="mt-4 text-center font-typewriter text-sm text-rust-red">
                      {'>'} Generating PNG file...
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={onClose}
                    className="font-typewriter text-evidence-yellow hover:text-rust-red transition-colors"
                  >
                    ← CLOSE POSTER
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
