import WarRoomPage from './pages/WarRoomPage';
import FamilyChartPage from './pages/FamilyChartPage';

// The site is the Bureau's weekly Most Wanted List (Toni, 5 Oct): / and /most-wanted show it,
// and each wallet has one page, its family chart at /most-wanted/<wallet>. vercel.json sends
// every path to index.html, so the path alone picks the view.
const MOST_WANTED_PATH = '/most-wanted';
const CHART_WALLET = window.location.pathname.match(/^\/most-wanted\/(0x[0-9a-fA-F]{40})\/?$/)?.[1];

function App() {
  if (CHART_WALLET) return <FamilyChartPage wallet={CHART_WALLET} />;
  // One address for the list, the one the posts link to.
  if (window.location.pathname !== MOST_WANTED_PATH) window.history.replaceState(null, '', MOST_WANTED_PATH);
  return <WarRoomPage />;
}

export default App;
