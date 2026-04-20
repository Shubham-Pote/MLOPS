import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Code2,
  BarChart3,
  Rocket,
  FlaskConical,
  Cpu,
} from 'lucide-react';

const links = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/experiment',  label: 'Experiment',  icon: FlaskConical },
  { to: '/results',     label: 'Results',     icon: BarChart3 },
  { to: '/models',      label: 'Models',      icon: Cpu },
  { to: '/deploy',      label: 'Deploy',      icon: Rocket },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Code2 size={22} />
        </div>
        <div>
          <h1>MLOps</h1>
          <span>Platform v1.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" id="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={`sidebar-link ${location.pathname === to ? 'active' : ''}`}
            id={`nav-${label.toLowerCase()}`}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}
