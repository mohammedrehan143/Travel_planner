import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane,
  Sparkles,
  ArrowRight,
  Play,
  Calendar,
  Bed,
  Users,
  Menu,
  X,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeroSectionProps {
  onOpenAgents?: () => void;
  onOpenDemo?: () => void;
  onSelectFeature?: (feature: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenAgents,
  onOpenDemo,
  onSelectFeature
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePlanTrip = () => {
    navigate('/wizard');
  };

  const handleAuthAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const featureCards = [
    {
      id: 'itineraries',
      icon: Calendar,
      title: 'Smart Itineraries',
      subtitle: 'Personalised for you',
      action: () => {
        if (onSelectFeature) onSelectFeature('itineraries');
        else navigate('/wizard');
      }
    },
    {
      id: 'budget',
      isRupee: true,
      title: 'Budget Optimizer',
      subtitle: 'Travel more, spend less',
      action: () => {
        if (onSelectFeature) onSelectFeature('budget');
        else navigate('/wizard');
      }
    },
    {
      id: 'stay',
      icon: Bed,
      title: 'Stay & Travel',
      subtitle: 'Best deals in one place',
      action: () => {
        if (onSelectFeature) onSelectFeature('stay');
        else navigate('/wizard');
      }
    },
    {
      id: 'collaboration',
      icon: Users,
      title: 'Trip Collaboration',
      subtitle: 'Plan together, travel together',
      action: () => {
        if (onSelectFeature) onSelectFeature('collaboration');
        else navigate('/wizard');
      }
    }
  ];

  return (
    <section className="relative w-full min-h-[800px] lg:h-[calc(100vh-80px)] lg:min-h-[760px] lg:max-h-[920px] overflow-hidden select-none flex flex-col justify-between">
      {/* 
        High-Resolution Background Image (image copy.png)
        Clean, majestic alpine landscape with backpacker and soaring aircraft
      */}
      <img
        src="/hero-bg.png"
        alt="Mountain adventure panorama with backpacker and soaring aircraft"
        className="absolute inset-0 w-full h-full object-cover object-[70%_center] xl:object-center pointer-events-none select-none z-0"
      />

      {/* Soft gradient overlay on smaller screens so text remains legible */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent lg:hidden pointer-events-none z-0" />

      {/* =========================================================================
          TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-5 sm:pt-6">
        <div className="flex items-center justify-between">
          {/* Brand Logo: Vibrant royal blue rounded square + bold brand text */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#1E60FF] flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
              <Plane className="w-5 h-5 -rotate-45 fill-white stroke-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              TripPilot AI
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9">
            <button
              type="button"
              onClick={() => scrollToSection('hero-features')}
              className="text-[15px] font-semibold text-slate-800 hover:text-[#1E60FF] transition-colors"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => {
                if (onOpenAgents) onOpenAgents();
              }}
              className="text-[15px] font-semibold text-slate-800 hover:text-[#1E60FF] transition-colors flex items-center gap-1.5"
            >
              <span>AI Agents</span>
              <span className="w-2 h-2 rounded-full bg-[#1E60FF] animate-pulse" />
            </button>
            <button
              type="button"
              onClick={handlePlanTrip}
              className="text-[15px] font-semibold text-slate-800 hover:text-[#1E60FF] transition-colors"
            >
              Destinations
            </button>
            <button
              type="button"
              onClick={() => {
                if (onOpenDemo) onOpenDemo();
                else handlePlanTrip();
              }}
              className="text-[15px] font-semibold text-slate-800 hover:text-[#1E60FF] transition-colors"
            >
              Pricing
            </button>
          </nav>

          {/* Desktop Auth Actions: Log In & Get Started */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={handleAuthAction}
              className="px-6 py-2 rounded-full text-sm font-semibold text-slate-800 bg-white/75 hover:bg-white border border-slate-200/80 shadow-xs backdrop-blur-xs transition-all hover:border-slate-300"
            >
              {user ? 'Dashboard' : 'Log In'}
            </button>
            <button
              type="button"
              onClick={() => (user ? navigate('/wizard') : navigate('/auth'))}
              className="px-6 py-2 rounded-full text-sm font-semibold text-white bg-[#1E60FF] hover:bg-[#1850db] shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-white/70 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => scrollToSection('hero-features')}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-semibold text-slate-800 hover:bg-blue-50"
            >
              Features
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAgents) onOpenAgents();
              }}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-semibold text-slate-800 hover:bg-blue-50"
            >
              AI Agents
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handlePlanTrip();
              }}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-semibold text-slate-800 hover:bg-blue-50"
            >
              Destinations
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenDemo) onOpenDemo();
                else handlePlanTrip();
              }}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-semibold text-slate-800 hover:bg-blue-50"
            >
              Pricing
            </button>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={handleAuthAction}
                className="flex-1 py-2 rounded-full text-sm font-semibold text-slate-800 bg-slate-100 text-center"
              >
                {user ? 'Dashboard' : 'Log In'}
              </button>
              <button
                onClick={() => (user ? navigate('/wizard') : navigate('/auth'))}
                className="flex-1 py-2 rounded-full text-sm font-semibold text-white bg-[#1E60FF] text-center"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          HERO MAIN CONTENT: Clean Left Typography + Clean Panoramic Background
          ========================================================================= */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl space-y-5 sm:space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBF2FF] border border-[#D3E3FD] text-[#1E60FF] text-xs sm:text-sm font-semibold shadow-2xs">
            <Sparkles className="w-4 h-4 fill-[#1E60FF]" />
            <span>Your AI Travel Co-Pilot</span>
          </div>

          {/* Main Headline with playful curved underline on "with AI" */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] xl:text-[62px] font-black tracking-tight text-slate-900 leading-[1.12]">
            Plan, Book & Experience <br className="hidden sm:inline" />
            Smarter Trips{' '}
            <span className="relative inline-block text-[#1E60FF]">
              with AI
              {/* Custom Curved Underline Stroke matching image.png */}
              <svg
                className="absolute -bottom-2.5 left-0 w-full h-3.5 text-[#1E60FF] pointer-events-none"
                viewBox="0 0 170 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 10C50 4 120 4 166 10"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-base sm:text-lg font-normal leading-relaxed max-w-lg">
            From personalised itineraries to budget planning and bookings, TripPilot AI takes care of your entire travel journey.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
            <button
              type="button"
              onClick={handlePlanTrip}
              className="inline-flex items-center justify-center gap-2.5 bg-[#1E60FF] hover:bg-[#1850db] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Plan Your Trip</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenDemo) onOpenDemo();
              }}
              className="inline-flex items-center justify-center gap-2.5 bg-white/90 hover:bg-white text-slate-800 font-semibold text-base px-7 py-3.5 rounded-full border border-slate-200/80 shadow-xs backdrop-blur-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-5 h-5 rounded-full border border-slate-700/80 flex items-center justify-center">
                <Play className="w-2.5 h-2.5 fill-slate-800 ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Social Proof & Rating Stars */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center">
              {/* Exact Avatar Group from image.png */}
              <img
                src="/avatars/avatar-group-exact.png"
                alt="TripPilot Happy Travellers"
                className="h-8.5 w-auto object-contain rounded-full shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                10K+ Travellers
              </span>

              <div className="flex items-center gap-0.5 ml-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-[#1E60FF] fill-[#1E60FF]"
                  />
                ))}
                <span className="font-bold text-slate-900 text-sm ml-1.5">
                  4.8/5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM 4 FEATURE CARDS (Positioned cleanly along the bottom wave)
          ========================================================================= */}
      <div id="hero-features" className="relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-6 sm:pb-8 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={card.action}
                className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 border border-white/80 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center gap-3.5 group cursor-pointer"
              >
                {/* Icon Badge */}
                <div className="w-12 h-12 rounded-2xl bg-[#EAF2FF] text-[#1E60FF] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#1E60FF] group-hover:text-white transition-all shadow-2xs">
                  {card.isRupee ? (
                    <span className="font-bold text-xl leading-none">₹</span>
                  ) : (
                    Icon && <Icon className="w-6 h-6 stroke-[2]" />
                  )}
                </div>

                {/* Card Title & Subtitle */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-[#1E60FF] transition-colors truncate">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
};
