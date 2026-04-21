import { NavLink } from 'react-router-dom';
import { Clapperboard, Brain, Scissors, Rocket, Download, Zap } from 'lucide-react';

const NAV = [
  { to: '/', icon: Clapperboard, label: 'Studio' },
  { to: '/modules', icon: Brain, label: 'Modules IA' },
  { to: '/shorts', icon: Scissors, label: 'ShortFactory' },
  { to: '/launchpad', icon: Rocket, label: 'LaunchPad' },
  { to: '/export', icon: Download, label: 'Export' },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-surface border-r border-subtle h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-subtle">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-display font-700 text-lg text-white tracking-tight">VlogAI</span>
        <span className="ml-auto badge bg-accent-d text-accent text-[10px]">BETA</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-accent-d text-accent'
                : 'text-muted hover:text-gray-200 hover:bg-subtle'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-accent' : 'text-muted group-hover:text-gray-300'} />
                {label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-subtle">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center text-xs font-bold text-white">
            V
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-300">Vlogger Pro</p>
            <p className="text-[10px] text-muted font-mono">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
