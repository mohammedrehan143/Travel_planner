import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Plane,
  Home,
  Sparkles,
  Luggage,
  Compass,
  Bot,
  Heart,
  BarChart3,
  Settings,
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenAgents?: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAgents, onOpenSearch }) => {
  const { user, profile, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname === path;
  };

  const navLinks = [
    { label: 'Home', icon: Home, path: '/', active: isActive('/') },
    { label: 'Plan Trip', icon: Sparkles, path: '/wizard', active: isActive('/wizard') },
    { label: 'My Trips', icon: Luggage, path: '/dashboard', active: false },
    { label: 'Explore', icon: Compass, path: '/dashboard#explore', active: false },
    { label: 'AI Agents', icon: Bot, path: '#', active: false, onClick: onOpenAgents },
    { label: 'Saved', icon: Heart, path: '/dashboard#saved', active: false },
    { label: 'Budget', icon: BarChart3, path: '/dashboard#budget', active: false },
    { label: 'Settings', icon: Settings, path: '/dashboard#settings', active: false },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] transition-colors select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center py-3">
          {/* Left: Brand Logo matching image copy 5.png */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 aspect-square rounded-xl overflow-hidden shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all duration-200 shrink-0">
                <img
                  src="/app-logo.png"
                  alt="TripPilot AI Logo"
                  width="36"
                  height="36"
                  className="w-full h-full object-cover shrink-0"
                />
              </div>
              <span className="text-xl font-black text-neutral-900 tracking-tight">
                TripPilot <span className="text-[#1E60FF]">AI</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const linkClass = `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  item.active
                    ? 'bg-[#EAF5EE] text-[#15803D] font-bold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60'
                }`;

                if (item.onClick) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className={linkClass}
                    >
                      <Icon className={`w-3.5 h-3.5 ${item.active ? 'text-[#16A34A]' : 'text-neutral-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                return (
                  <Link key={item.label} to={item.path} className={linkClass}>
                    <Icon className={`w-3.5 h-3.5 ${item.active ? 'text-[#16A34A]' : 'text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Search, Notifications, User Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Icon */}
            <button
              type="button"
              onClick={() => {
                if (onOpenSearch) {
                  onOpenSearch();
                } else {
                  const input = document.querySelector('input[placeholder*="Ask TripPilot"]') as HTMLInputElement;
                  if (input) {
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              }}
              aria-label="Search"
              className="w-9 h-9 rounded-full border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 flex items-center justify-center text-neutral-600 transition-colors"
              title="Search destinations..."
            >
              <Search className="w-4 h-4 text-neutral-600" />
            </button>

            {/* Notification Bell with Red Dot */}
            <button
              type="button"
              onClick={() => setHasUnreadNotification(false)}
              aria-label="Notifications"
              className="w-9 h-9 rounded-full border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 flex items-center justify-center text-neutral-600 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-neutral-600" />
              {hasUnreadNotification && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {/* User Avatar with Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#16A34A]/20 hover:border-[#16A34A] transition-all flex items-center justify-center bg-emerald-50 text-emerald-800"
                aria-label="User Profile Menu"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {profile?.full_name || 'Traveler'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user?.email || profile?.phone || 'trip.pilot@demo.ai'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#1E60FF] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1E60FF]" />
                      <span>{isDemoMode ? 'Active Workspace' : 'Supabase Connected'}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/wizard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-[#1E60FF]" />
                      <span>Trip Planning Wizard</span>
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-neutral-400" />
                      <span>My Itineraries</span>
                    </Link>
                  </div>

                  <div className="border-t border-neutral-100 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        await signOut();
                        navigate('/auth');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-neutral-100 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.onClick) item.onClick();
                    else navigate(item.path);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? 'bg-[#EAF5EE] text-[#15803D]'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-[#16A34A]' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
