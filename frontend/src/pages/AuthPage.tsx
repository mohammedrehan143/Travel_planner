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
import { normalizePhoneNumber } from '../lib/phone';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signUpWithDetails, signInWithDemo } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!normalizePhoneNumber(phone)) {
        setErrorMsg('Enter your full phone number with its country code, starting with +.');
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
        const identifier = email.trim();
        if (!identifier) {
          setErrorMsg('Please enter your email address.');
          setIsLoading(false);
          return;
        }
        const res = await signInWithEmail(identifier, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          navigate(from, { replace: true });
        }
      } else {
        const formattedPhone = normalizePhoneNumber(phone);
        if (!formattedPhone) {
          setErrorMsg('Enter your full phone number with its country code, starting with +.');
          return;
        }
        const res = await signUpWithDetails({
          fullName: fullName.trim(),
          phone: formattedPhone,
          email: email.trim().toLowerCase(),
          password,
          termsAccepted,
        });
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.message) {
          setSuccessMsg(res.message);
          setMode('signin');
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

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    await signInWithDemo();
    setIsLoading(false);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-[#F3F4F6]">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#171717] text-[#F97316] shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-[#171717] tracking-tight">
            {mode === 'signin' ? 'Welcome Back to TripPilot' : 'Create Your TripPilot Account'}
          </h2>
          <p className="text-xs text-[#525252] max-w-sm mx-auto">
            {mode === 'signin'
              ? 'Sign in with your email to access your trips and agent blueprints.'
              : 'Sign up with your mobile number to generate and store trips under your account.'}
          </p>
        </div>

        {/* Development demo entry */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#F97316]" />
              <span>Development Demo Mode</span>
            </div>
            <span className="text-[10px] bg-[#F3F4F6] text-[#525252] font-semibold px-2 py-0.5 rounded-full border border-[#E5E7EB]">
              Local only
            </span>
          </div>
          <p className="text-[11px] text-[#525252] leading-normal">
            Explore sample itineraries. Demo activity stays in this browser and is not saved to Supabase.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="px-3.5 py-2 rounded-xl bg-[#F3F4F6] hover:bg-[#171717] hover:text-white border border-[#E5E7EB] text-[#171717] font-bold text-xs transition-all shadow-sm flex items-center justify-between w-full group"
            >
              <span>Explore demo account</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* Main Auth Form Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card p-6 sm:p-8 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-[#F3F4F6] p-1 text-xs font-bold border border-[#E5E7EB]/50">
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-[#171717] shadow-sm border border-[#E5E7EB]' : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'signin' ? 'bg-white text-[#171717] shadow-sm border border-[#E5E7EB]' : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              Sign In
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div role="status" className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-[#16A34A] text-xs">
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white text-[#171717] placeholder:text-neutral-400"
                  />
                </div>
              </div>
            )}

            {/* Phone Number */}
            {mode === 'signup' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Phone Number <span className="text-[#DC2626]">*</span>
                  </label>
                  <span className="text-[10px] text-[#F97316] font-semibold bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">Primary ID</span>
                </div>
                <div className="relative flex">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      placeholder="e.g. 9876543210 or +919876543210"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white text-[#171717] placeholder:text-neutral-400 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#525252] mt-1">Enter your 10-digit mobile number or full international format (+91...).</p>
              </div>
            )}

            {/* Email Address or Mobile for Signin */}
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                {mode === 'signin' ? 'Email or Mobile Number' : 'Email Address'} <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type={mode === 'signin' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'signin' ? 'name@example.com or mobile number' : 'name@example.com'}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white text-[#171717] placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                Password <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] bg-white text-[#171717] placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Terms and Conditions Acceptance Link & Checkbox */}
            {mode === 'signup' && (
              <div className="pt-1.5 space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#525252] leading-snug">
                  <button
                    type="button"
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className="mt-0.5 text-[#F97316] shrink-0 focus:outline-none"
                    aria-label="Toggle Terms Acceptance"
                  >
                    {termsAccepted ? (
                      <CheckSquare className="w-4 h-4 text-[#F97316] fill-orange-50" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                  <span>
                    I accept and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-[#F97316] hover:text-[#EA580C] font-bold underline underline-offset-2"
                    >
                      Terms & Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-[#F97316] hover:text-[#EA580C] font-bold underline underline-offset-2"
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
              className="w-full py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

          <div className="pt-2 text-center border-t border-[#E5E7EB]">
            <span className="text-[11px] text-[#525252] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              Data encrypted and indexed by verified mobile number in Supabase
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#171717]/70 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-4 max-h-[85vh] flex flex-col text-[#171717]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 font-black text-base">
                <FileText className="w-5 h-5 text-[#F97316]" />
                <span>TripPilot AI Terms & Conditions</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-[#F3F4F6] hover:bg-neutral-200 text-[#525252] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3.5 text-xs text-[#525252] leading-relaxed pr-2">
              <div>
                <h4 className="font-bold text-[#171717] mb-1">1. Account & Mobile Number Identification</h4>
                <p>
                  By creating an account on TripPilot, you agree that your mobile number serves as your primary unique identifier for itinerary records, trip collaborations, and booking receipts. You agree to provide a valid, active mobile phone number.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#171717] mb-1">2. AI-Generated Travel Blueprints</h4>
                <p>
                  TripPilot orchestrates itineraries using autonomous agentic AI models (including Google Gemini). While we strive for realistic timings, real-world venue hours, transit conditions, and weather variations may occur. Always verify opening hours before visiting.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#171717] mb-1">3. Privacy & Data Storage</h4>
                <p>
                  Trip data, budgets, expenses, and collaboration preferences stored under your mobile number are protected via Postgres Row Level Security (RLS). We do not sell your personal data or phone number to third-party telemarketers.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#171717] mb-1">4. Bookings & Third-Party Services</h4>
                <p>
                  Accommodations, ticket estimates, and route calculations are informational recommendations. Direct bookings through third-party platforms are subject to the terms of those specific providers.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <span className="text-[11px] text-[#525252]">Version 1.0 &bull; Effective Oct 2026</span>
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-sm"
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
