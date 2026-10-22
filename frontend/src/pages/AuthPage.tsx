import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Mail, Lock, User, Sparkles, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signUpWithEmail, signInWithDemo, isDemoMode } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          navigate(from, { replace: true });
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (role: 'alice' | 'bob') => {
    setIsLoading(true);
    await signInWithDemo(role);
    setIsLoading(false);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {mode === 'signin' ? 'Welcome Back to TripPilot' : 'Create Your TripPilot Account'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'signin'
              ? 'Access your saved trips, itineraries, and collaborations'
              : 'Join to generate smart itineraries with agentic AI'}
          </p>
        </div>

        {/* Demo Fast-Track Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Instant Demo Access (Seeded Profiles)</span>
          </div>
          <p className="text-[11px] text-blue-700 leading-normal">
            No password required to evaluate. Instantly authenticate with pre-loaded trips and activities:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoSignIn('alice')}
              className="px-3 py-2 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-900 font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=40&q=80"
                alt="Alice"
                className="w-4 h-4 rounded-full"
              />
              <span>Alice (Owner)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('bob')}
              className="px-3 py-2 rounded-xl bg-white hover:bg-indigo-600 hover:text-white border border-blue-200 text-indigo-900 font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=40&q=80"
                alt="Bob"
                className="w-4 h-4 rounded-full"
              />
              <span>Bob (Co-planner)</span>
            </button>
          </div>
        </div>

        {/* Main Auth Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mode === 'signin' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mode === 'signup' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alice Wanderlust"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@trippilot.test"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to TripPilot' : 'Create TripPilot Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Secured with Supabase Auth & JWT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
