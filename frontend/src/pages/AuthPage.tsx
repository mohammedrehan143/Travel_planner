import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Compass, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  FileText, 
  X, 
  CheckSquare, 
  Square 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPhoneOrEmail, signUpWithDetails, signInWithDemo } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('You must agree to the Terms & Conditions and Privacy Policy to proceed.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const identifier = phone || email;
        if (!identifier.trim()) {
          setErrorMsg('Please enter your mobile number or email address.');
          setIsLoading(false);
          return;
        }
        const res = await signInWithPhoneOrEmail(identifier, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          navigate(from, { replace: true });
        }
      } else {
        const formattedPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+91${phone.replace(/\D/g, '')}`;
        const res = await signUpWithDetails({
          fullName: fullName.trim(),
          phone: formattedPhone,
          email: email.trim().toLowerCase(),
          password,
          termsAccepted,
        });
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-slate-50/50">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'signin' ? 'Welcome Back to TripPilot' : 'Create Your TripPilot Account'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {mode === 'signin'
              ? 'Sign in using your mobile number or email to access your trips and agent blueprints.'
              : 'Sign up with your mobile number to generate and store trips under your account.'}
          </p>
        </div>

        {/* Demo Fast-Track Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Instant Fast-Track Login (Pre-seeded Accounts)</span>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">One-click</span>
          </div>
          <p className="text-[11px] text-blue-700 leading-normal">
            Authenticate immediately with pre-loaded trips stored under mock mobile numbers:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoSignIn('alice')}
              className="px-3 py-2.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-900 font-bold text-xs transition-all shadow-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=40&q=80"
                  alt="Alice"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <div className="text-left leading-tight">
                  <div className="text-[11px]">Alice</div>
                  <div className="text-[9px] text-slate-500 group-hover:text-blue-100">+91 98765 43210</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('bob')}
              className="px-3 py-2.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white border border-blue-200 text-indigo-900 font-bold text-xs transition-all shadow-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=40&q=80"
                  alt="Bob"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <div className="text-left leading-tight">
                  <div className="text-[11px]">Bob</div>
                  <div className="text-[9px] text-slate-500 group-hover:text-indigo-100">+91 98765 43211</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* Main Auth Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account (Sign Up)
            </button>
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                mode === 'signin' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Mobile Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mobile Number {mode === 'signup' ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal lowercase">(or email)</span>}
                </label>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">Primary ID</span>
              </div>
              <div className="relative flex">
                <div className="inline-flex items-center gap-1 px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-bold text-slate-700 select-none">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required={mode === 'signup' || !email}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={mode === 'signup' ? "98765 43210" : "98765 43210 (or enter email below)"}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-r-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>
              {mode === 'signup' && (
                <p className="text-[10px] text-slate-400 mt-1">Your trips and itineraries will be securely stored under this mobile number.</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address {mode === 'signup' ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal lowercase">(optional if mobile provided)</span>}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required={mode === 'signup' || !phone}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul.sharma@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Terms and Conditions Acceptance Link & Checkbox */}
            {mode === 'signup' && (
              <div className="pt-1.5 space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-snug">
                  <button
                    type="button"
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className="mt-0.5 text-blue-600 shrink-0 focus:outline-none"
                    aria-label="Toggle Terms Acceptance"
                  >
                    {termsAccepted ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 fill-blue-50" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <span>
                    I accept and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-blue-600 hover:text-blue-800 font-bold underline underline-offset-2"
                    >
                      Terms & Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-blue-600 hover:text-blue-800 font-bold underline underline-offset-2"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === 'signup' && !termsAccepted)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Authenticating with database...</span>
              ) : (
                <>
                  <span>
                    {mode === 'signin' ? 'Sign In with Mobile / Email' : 'Create Account & Agree to Terms'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Data encrypted and indexed by verified mobile number in Supabase
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>TripPilot AI Terms & Conditions</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3.5 text-xs text-slate-600 leading-relaxed pr-2">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">1. Account & Mobile Number Identification</h4>
                <p>
                  By creating an account on TripPilot, you agree that your mobile number serves as your primary unique identifier for itinerary records, trip collaborations, and booking receipts. You agree to provide a valid, active mobile phone number.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">2. AI-Generated Travel Blueprints</h4>
                <p>
                  TripPilot orchestrates itineraries using autonomous agentic AI models (including Google Gemini and OpenAI). While we strive for realistic timings, real-world venue hours, transit conditions, and weather variations may occur. Always verify opening hours before visiting.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">3. Privacy & Data Storage</h4>
                <p>
                  Trip data, budgets, expenses, and collaboration preferences stored under your mobile number are protected via Postgres Row Level Security (RLS). We do not sell your personal data or phone number to third-party telemarketers.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">4. Bookings & Third-Party Services</h4>
                <p>
                  Accommodations, ticket estimates, and route calculations are informational recommendations. Direct bookings through third-party platforms are subject to the terms of those specific providers.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Version 1.0 &bull; Effective Oct 2026</span>
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
