import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/':           'Dashboard',
  '/experiment': 'Experiment',
  '/results':    'Results',
  '/models':     'Models',
  '/deploy':     'Model Playground',
};

export default function Navbar() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'MLOps Platform';

  return (
    <header className="navbar" id="navbar">
      <h2 className="navbar-title">{title}</h2>
      <div className="navbar-actions">
        <button className="btn-icon" aria-label="Search" id="navbar-search">
          <Search size={18} />
        </button>
        <button className="btn-icon" aria-label="Notifications" id="navbar-notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
