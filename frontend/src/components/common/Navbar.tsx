import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, LogOut, User, Plus, LayoutDashboard, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, profile, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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

  const isActive = (path: string) => location.pathname === path;

  return (
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#171717] flex items-center justify-center text-[#F97316] shadow-sm group-hover:scale-105 transition-transform duration-200">
                <Compass className="w-5 h-5 text-[#F97316]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#171717]">
                  TripPilot<span className="text-[#F97316]">.ai</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#525252] border border-[#E5E7EB]">
                  Agentic AI
                </span>
              </div>
            </Link>

            {/* Navigation Links with Orange Active Indicator */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive('/dashboard')
                      ? 'text-[#171717] bg-[#F3F4F6]'
                      : 'text-[#525252] hover:text-[#171717] hover:bg-[#F3F4F6]/60'
                  }`}
                >
                  <LayoutDashboard className={`w-3.5 h-3.5 ${isActive('/dashboard') ? 'text-[#F97316]' : 'text-[#525252]'}`} />
                  <span>Dashboard</span>
                  {isActive('/dashboard') && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-[#F97316]" />
                  )}
                </Link>

                <Link
                  to="/wizard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                    isActive('/wizard')
                      ? 'text-[#171717] bg-[#F3F4F6]'
                      : 'text-[#525252] hover:text-[#171717] hover:bg-[#F3F4F6]/60'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isActive('/wizard') ? 'text-[#F97316]' : 'text-[#525252]'}`} />
                  <span>AI Wizard</span>
                  {isActive('/wizard') && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-[#F97316]" />
                  )}
                </Link>
              </div>
            )}
          </div>

          {/* Right Actions: CTAs & User Profile */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Orange Primary CTA Button */}
                <Link
                  to="/wizard"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition-all duration-200 shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Trip</span>
                </Link>

                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F3F4F6] transition-colors border border-transparent hover:border-[#E5E7EB]"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || 'Account profile'}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-[#E5E7EB]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs">
                        {(profile?.full_name || user.email || '').trim().charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#171717] hidden sm:inline-block max-w-[120px] truncate">
                      {profile?.full_name || user.email?.split('@')[0] || (isDemoMode ? 'Demo User' : 'Account')}
                    </span>
                  </button>

                  {profileDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl py-2 z-50 divide-y divide-[#E5E7EB] border border-[#E5E7EB] animate-in fade-in duration-150"
                      onMouseLeave={() => setProfileDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5">
                        <p className="text-[11px] text-[#525252] font-medium">Signed in as</p>
                        <p className="text-xs font-bold text-[#171717] truncate">
                          {profile?.email || user.email || (isDemoMode ? 'Local Demo Session' : 'No email on file')}
                        </p>
                      </div>

                      {isDemoMode && (
                        <div className="px-4 py-2 text-[11px] text-[#525252] bg-[#F3F4F6]">
                          Local Development Mode
                        </div>
                      )}

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-[#171717] hover:bg-[#F3F4F6] flex items-center gap-2 font-medium"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#525252]" />
                          Dashboard
                        </Link>
                        <Link
                          to="/wizard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-[#171717] hover:bg-[#F3F4F6] flex items-center gap-2 font-medium"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#F97316]" />
                          Create New Trip
                        </Link>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            signOut();
                            setProfileDropdownOpen(false);
                            navigate('/');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[#171717] text-xs font-semibold hover:bg-[#F3F4F6] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
