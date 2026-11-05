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
import { getLenis } from '../../hooks/useSmoothScroll';
import { CuteRobotChatbot, CuteRobotMobileButton } from './CuteRobotChatbot';

interface HeroSectionProps {
  onOpenAgents?: () => void;
  onOpenDemo?: () => void;
  onSelectFeature?: (feature: string) => void;
  onOpenChat?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenAgents,
  onOpenDemo,
  onSelectFeature,
  onOpenChat
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
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(`#${id}`, { offset: -30, duration: 1.4 });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
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
    <section className="relative w-full h-[100dvh] min-h-[620px] md:h-auto md:min-h-[720px] lg:min-h-[840px] select-none flex flex-col justify-between overflow-hidden md:overflow-visible">
      {/* 
        1. Mobile View Background: Pristine clean alpine & sky panorama (hero-mobile-bg.png)
        Matches image copy 4.png with airplane, sunrise, tree foliage, and backpacker
      */}
      <img
        src="/hero-mobile-bg.png"
        alt="TripPilot AI mountain scenery with aircraft and hiker"
        className="md:hidden absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
      />

      {/* 
        2. Desktop View Background: High-Resolution Panoramic Background (hero-bg.png)
        Clean, majestic alpine landscape with backpacker and soaring aircraft
      */}
      <img
        src="/hero-bg.png"
        alt="Mountain adventure panorama with backpacker and soaring aircraft"
        className="hidden md:block absolute inset-0 w-full h-full object-cover object-[70%_center] xl:object-center pointer-events-none select-none z-0"
      />

      {/* Desktop subtle bottom fade to guarantee bottom cards sit cleanly above subsequent content */}
      <div className="hidden md:block absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none z-10" />

      {/* =========================================================================
          TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-5 sm:pt-6">
        <div className="flex items-center justify-between">
          {/* Brand Logo: Reactive logo button (image copy 5.png) + bold brand text */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            {/* Reactive Logo Button matching image copy 5.png */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 aspect-square rounded-2xl overflow-hidden shadow-md shadow-blue-500/25 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-blue-500/35 transition-all duration-200 shrink-0">
              <img
                src="/app-logo.png"
                alt="TripPilot AI Logo"
                width="40"
                height="40"
                className="w-full h-full object-cover shrink-0"
              />
            </div>

            <span className="text-xl sm:text-2xl font-black text-white md:text-slate-900 tracking-tight drop-shadow-xs md:drop-shadow-none">
              TripPilot AI
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9">
            <button
              type="button"
              onClick={() => scrollToSection('why-choose-us')}
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

          {/* Mobile Menu Button: Rounded square outline with white hamburger bars (image copy 4.png) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl border border-white/50 bg-white/10 hover:bg-white/20 backdrop-blur-xs flex items-center justify-center text-white transition-all shadow-sm"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAgents) onOpenAgents();
                else handlePlanTrip();
              }}
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
          MOBILE HERO CONTENT: Exactly matching image copy 4.png
          Centered typography, sparkle doodles, curved underline, and 2 CTA buttons
          ========================================================================= */}
      <div className="md:hidden relative z-10 w-full px-5 pt-8 sm:pt-12 pb-2 flex-1 flex flex-col items-center justify-start text-center">
        {/* Sparkle Doodles & Main Headline */}
        <div className="relative inline-block mt-4 sm:mt-8">
          {/* Left Sparkles: 3 radiating blue strokes (image copy 4.png) */}
          <div className="absolute -top-3.5 -left-7 sm:-left-9 text-[#1E60FF] pointer-events-none">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 17L2 19" stroke="#1E60FF" strokeWidth="3" strokeLinecap="round" />
              <path d="M6 10L1 9" stroke="#1E60FF" strokeWidth="3" strokeLinecap="round" />
              <path d="M10 5L7 1" stroke="#1E60FF" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          {/* Right Sparkles: 3 radiating blue strokes (image copy 4.png) */}
          <div className="absolute -bottom-1 -right-7 sm:-right-9 text-[#1E60FF] pointer-events-none">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M14 5L19 3" stroke="#1E60FF" strokeWidth="3" strokeLinecap="round" />
              <path d="M15 12L21 13" stroke="#1E60FF" strokeWidth="3" strokeLinecap="round" />
              <path d="M12 18L15 22" stroke="#1E60FF" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          <h1 className="text-[36px] sm:text-[42px] font-black text-[#0B1536] tracking-tight leading-[1.12]">
            <div>Your AI Travel</div>
            <div className="relative inline-block text-[#1E60FF] mt-1">
              <span>Co-Pilot</span>
              {/* Hand-Drawn Curved Underline underneath Co-Pilot */}
              <svg
                className="absolute -bottom-2.5 left-0 w-full h-3.5 text-[#1E60FF] pointer-events-none"
                viewBox="0 0 160 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 8C45 2 115 2 156 8"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-[#243552] font-semibold text-[14.5px] sm:text-base leading-relaxed max-w-[320px] sm:max-w-sm mx-auto">
          Plan, research, optimize and validate your trips with a team of intelligent AI agents.
        </p>

        {/* 2 CTA Buttons in a single row */}
        <div className="flex items-center justify-center gap-3 mt-6 sm:mt-7 w-full max-w-xs">
          <button
            type="button"
            onClick={handlePlanTrip}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#0066FF] to-[#0052FF] text-white font-bold text-sm py-3 px-4 rounded-full shadow-lg shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Plan Your Trip</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenDemo) onOpenDemo();
              else handlePlanTrip();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/80 hover:bg-white text-slate-900 font-bold text-sm py-3 px-4 rounded-full border border-white/90 shadow-xs backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
            <span>Watch Demo</span>
          </button>
        </div>

        {/* Bottom space intentionally left clear so mountains, valley mist & backpacker shine unobstructed */}
        <div className="flex-1 min-h-[160px]" />
      </div>

      {/* =========================================================================
          DESKTOP HERO MAIN CONTENT: Clean Left Typography + Right Jumping Cute Robot
          ========================================================================= */}
      <div className="hidden md:flex relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 flex-1 items-center justify-between gap-8">
        <div className="max-w-xl lg:max-w-2xl space-y-5 sm:space-y-6 shrink-0">
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

        {/* Right Side: Jumping Robotic Cute Character AI Chatbot */}
        <div className="relative flex flex-col items-center justify-center shrink-0 pr-2 lg:pr-8 xl:pr-12">
          <CuteRobotChatbot onOpenChat={onOpenChat} />
        </div>
      </div>

      {/* Mobile Floating Jumping Robot Chatbot Option */}
      <div className="md:hidden fixed bottom-6 right-4 z-40">
        <CuteRobotMobileButton onOpenChat={onOpenChat} />
      </div>

      {/* =========================================================================
          BOTTOM 4 FEATURE CARDS (Desktop only, mobile bottom is clear)
          ========================================================================= */}
      <div id="hero-features" className="hidden md:block relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-4 pb-16 sm:pb-20 lg:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={card.action}
                className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/70 shadow-lg shadow-slate-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center gap-3.5 group cursor-pointer"
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
