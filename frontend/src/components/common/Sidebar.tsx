import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Sparkles,
  Luggage,
  Compass,
  Bot,
  Heart,
  BarChart3,
  Settings,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenAgents?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  onOpenAgents,
}) => {
  const location = useLocation();

  const isRouteActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  const navItems = [
    { label: 'Home', icon: Home, path: '/dashboard', active: isRouteActive('/') },
    { label: 'Plan Trip', icon: Sparkles, path: '/wizard', active: isRouteActive('/wizard') },
    { label: 'My Trips', icon: Luggage, path: '/dashboard', active: false },
    { label: 'Explore', icon: Compass, path: '/dashboard#explore', active: false },
    { label: 'AI Agents', icon: Bot, path: '#', active: false, onClick: onOpenAgents },
    { label: 'Saved', icon: Heart, path: '/dashboard#saved', active: false },
    { label: 'Budget', icon: BarChart3, path: '/dashboard#budget', active: false },
    { label: 'Settings', icon: Settings, path: '/dashboard#settings', active: false },
  ];

  return (
    <aside
      className={`bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20 px-3 py-5' : 'w-64 px-4 py-5'
      }`}
    >
      <div className="space-y-6">
        {/* Brand & Collapse Header */}
        <div className="flex items-center justify-between gap-2 px-2">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden group">
            {/* Reactive Logo Button matching image copy 5.png */}
            <div className="w-9 h-9 aspect-square rounded-xl overflow-hidden shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all duration-200 shrink-0">
              <img
                src="/app-logo.png"
                alt="TripPilot AI Logo"
                width="36"
                height="36"
                className="w-full h-full object-cover shrink-0"
              />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-lg text-neutral-900 tracking-tight whitespace-nowrap">
                TripPilot <span className="text-[#1E60FF]">AI</span>
              </span>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              {isCollapsed ? (
                <ChevronsRight className="w-4 h-4" />
              ) : (
                <ChevronsLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const content = (
              <div
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  item.active
                    ? 'bg-[#EBF2FF] text-[#1E60FF] font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={item.label}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    item.active ? 'text-[#1E60FF]' : 'text-neutral-500'
                  }`}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            );

            if (item.onClick) {
              return (
                <div key={item.label} onClick={item.onClick}>
                  {content}
                </div>
              );
            }

            return (
              <Link key={item.label} to={item.path}>
                {content}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
