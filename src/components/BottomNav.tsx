import { NavLink } from 'react-router-dom';
import { Clapperboard, Brain, Scissors, Rocket, Download } from 'lucide-react';

const TABS = [
  { to: '/', icon: Clapperboard, label: 'Studio' },
  { to: '/modules', icon: Brain, label: 'Modules' },
  { to: '/shorts', icon: Scissors, label: 'Shorts' },
  { to: '/launchpad', icon: Rocket, label: 'Launch' },
  { to: '/export', icon: Download, label: 'Export' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-subtle">
      <div className="flex">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-150
              ${isActive ? 'text-accent' : 'text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-accent' : 'text-muted'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
