import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import CaseFilePage from './pages/CaseFilePage';
import SuspectDetailPage from './pages/SuspectDetailPage';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [cachedData, setCachedData] = useState(null);
  // Cache for individual wallet NFTs: { walletAddress: nftsArray }
  const [walletNFTCache, setWalletNFTCache] = useState({});

  const handleSelectCase = (type, value, data) => {
    setSelectedCase({ type, value });
    setCachedData(data); // Cache the landing page data
    setCurrentView('case');
  };

  const handleSelectSuspect = (walletAddress) => {
    setSelectedSuspect(walletAddress);
    setCurrentView('suspect');
  };

  const cacheWalletNFTs = (walletAddress, nfts) => {
    setWalletNFTCache(prev => ({
      ...prev,
      [walletAddress]: nfts
    }));
  };

  const handleBackToCase = () => {
    // If there's a selected case, go back to it; otherwise go to landing
    if (selectedCase) {
      setCurrentView('case');
      setSelectedSuspect(null);
    } else {
      setCurrentView('landing');
      setSelectedSuspect(null);
    }
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedCase(null);
    setSelectedSuspect(null);
  };

  return (
    <div className="min-h-screen">
      {currentView === 'landing' ? (
        <LandingPage
          onSelectCase={handleSelectCase}
          onSelectSuspect={handleSelectSuspect}
          cachedData={cachedData}
        />
      ) : currentView === 'case' ? (
        <CaseFilePage
          caseType={selectedCase?.type}
          caseValue={selectedCase?.value}
          cachedData={cachedData}
          onBack={handleBackToLanding}
          onSelectSuspect={handleSelectSuspect}
        />
      ) : (
        <SuspectDetailPage
          walletAddress={selectedSuspect}
          onBack={handleBackToCase}
          cachedNFTs={walletNFTCache[selectedSuspect]}
          onCacheNFTs={cacheWalletNFTs}
        />
      )}
    </div>
  );
}

export default App;
