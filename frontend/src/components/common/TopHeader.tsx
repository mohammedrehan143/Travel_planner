import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, User as UserIcon, LogOut, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopHeaderProps {
  onToggleMobileMenu?: () => void;
  onOpenSearch?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileMenu,
  onOpenSearch,
}) => {
  const { user, profile, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine dynamic time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 18) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-8 py-5 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Dynamic Greeting & Headings */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="space-y-0.5">
          <div className="text-xs sm:text-sm font-semibold text-neutral-500">
            {getGreeting()}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            Plan your next adventure with AI.
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-neutral-500 font-medium">
            From ideas to itineraries, TripPilot AI handles it all.
          </p>
        </div>
      </div>

      {/* Right: Quick Search, Notifications, Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Search Icon Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search destinations or plans"
          className="w-10 h-10 rounded-full border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 flex items-center justify-center text-neutral-600 transition-colors"
          title="Search destinations..."
        >
          <Search className="w-4 h-4 text-neutral-600" />
        </button>

        {/* Notification Bell Button with Red Dot */}
        <button
          type="button"
          onClick={() => setHasUnreadNotification(false)}
          aria-label="Notifications"
          className="w-10 h-10 rounded-full border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 flex items-center justify-center text-neutral-600 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-neutral-600" />
          {hasUnreadNotification && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>

        {/* User Profile Avatar with Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1E60FF]/20 hover:border-[#1E60FF] transition-all flex items-center justify-center bg-blue-50 text-blue-800"
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

          {/* Profile Dropdown */}
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
                  <Shield className="w-4 h-4 text-neutral-400" />
                  <span>Trip Architect Wizard</span>
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-neutral-400" />
                  <span>Manage Trips & Budget</span>
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
      </div>
    </header>
  );
};
