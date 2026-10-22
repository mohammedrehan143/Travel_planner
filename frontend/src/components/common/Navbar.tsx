import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, MapPin, Calendar, PlusCircle, LogOut, User, Sparkles, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrips } from '../../context/TripContext';

export const Navbar: React.FC = () => {
  const { user, profile, signOut, isDemoMode, signInWithDemo } = useAuth();
  const { activeTrip } = useTrips();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Compass className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div>
                <span className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-950 to-blue-700 bg-clip-text text-transparent">
                  TripPilot<span className="text-blue-600">.ai</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-700 border border-blue-200">
                  Agentic AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-8 space-x-1">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                Dashboard
              </Link>

              {activeTrip && (
                <Link
                  to={`/trip/${activeTrip.id}`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/trip') && !location.pathname.includes('/new')
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  Current Itinerary
                </Link>
              )}

              <Link
                to="/wizard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/wizard')
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Plan New Trip
              </Link>
            </div>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isDemoMode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Demo Workspace</span>
              </div>
            )}

            <Link
              to="/wizard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm shadow-blue-600/30 transition-all hover:shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Trip</span>
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                >
                  <img
                    src={profile?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'}
                    alt={profile?.full_name || 'User'}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                  />
                  <span className="text-sm font-medium text-slate-700 hidden lg:inline-block">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 py-2 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2">
                      <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{profile?.email || user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          signInWithDemo(profile?.full_name?.includes('Bob') ? 'alice' : 'bob');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span>Switch Demo User</span>
                        <span className="text-[10px] text-blue-600 font-medium">
                          {profile?.full_name?.includes('Bob') ? 'Switch to Alice' : 'Switch to Bob'}
                        </span>
                      </button>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          signOut();
                          setProfileDropdownOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
          {activeTrip && (
            <Link
              to={`/trip/${activeTrip.id}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Current Itinerary ({activeTrip.destination})
            </Link>
          )}
          <Link
            to="/wizard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-blue-600 font-semibold hover:bg-blue-50"
          >
            Plan New Trip
          </Link>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{profile?.full_name || 'Alice Wanderlust'}</span>
            <button
              onClick={() => {
                signOut();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-rose-600 font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
