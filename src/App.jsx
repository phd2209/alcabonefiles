import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import CaseFilePage from './pages/CaseFilePage';
import SuspectDetailPage from './pages/SuspectDetailPage';
import WarRoomPage from './pages/WarRoomPage';

// The one linkable address: the Bureau's weekly Most Wanted List. vercel.json
// already sends every path to index.html, so the path only picks the first view.
const MOST_WANTED_PATH = '/most-wanted';
const setPath = (path) => {
  if (window.location.pathname !== path) window.history.pushState(null, '', path);
};

function App() {
  const [currentView, setCurrentView] = useState(
    () => (window.location.pathname === MOST_WANTED_PATH ? 'warroom' : 'landing'));
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  const [cachedData, setCachedData] = useState(null);
  // Cache for individual wallet NFTs: { walletAddress: nftsArray }
  const [walletNFTCache, setWalletNFTCache] = useState({});

  // Browser back/forward between / and /most-wanted.
  useEffect(() => {
    const onPop = () => setCurrentView(
      window.location.pathname === MOST_WANTED_PATH ? 'warroom' : 'landing');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleSelectCase = (type, value, data) => {
    setSelectedCase({ type, value });
    setCachedData(data); // Cache the landing page data
    setCurrentView('case');
  };

  const handleSelectSuspect = (walletAddress) => {
    setPath('/');
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
    setPath('/');
    setCurrentView('landing');
    setSelectedCase(null);
    setSelectedSuspect(null);
  };

  // THE MOST WANTED LIST (Syndicate War §7). There is no router in this app —
  // views are switched by state — so the board is a view with one linkable
  // path, /most-wanted, rather than a route.
  const handleOpenWarRoom = () => {
    setPath(MOST_WANTED_PATH);
    setCurrentView('warroom');
    setSelectedCase(null);
    setSelectedSuspect(null);
  };

  return (
    <div className="min-h-screen">
      {currentView === 'landing' ? (
        <LandingPage
          onSelectCase={handleSelectCase}
          onSelectSuspect={handleSelectSuspect}
          onOpenWarRoom={handleOpenWarRoom}
          cachedData={cachedData}
        />
      ) : currentView === 'warroom' ? (
        <WarRoomPage
          onBack={handleBackToLanding}
          onSelectSuspect={handleSelectSuspect}
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
