import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Route,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Users,
  Luggage,
  Clock,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, signInWithDemo } = useAuth();

  const featuredDestinations = [
    {
      city: 'Tokyo, Japan',
      tag: 'Culture & Culinary',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      days: 5,
      budget: '$3,500',
    },
    {
      city: 'Paris, France',
      tag: 'Art & Architecture',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
      days: 5,
      budget: '€2,800',
    },
    {
      city: 'Zermatt, Switzerland',
      tag: 'Alpine Adventure',
      image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
      days: 6,
      budget: 'CHF 4,200',
    },
    {
      city: 'Rome, Italy',
      tag: 'Antiquity & Gastronomy',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
      days: 4,
      budget: '€2,200',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Next-Generation Autonomous Travel Agent</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Effortless Travel Planning Powered by{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  Agentic AI
                </span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Experience precision itineraries created in seconds. TripPilot AI researches live attractions, optimizes transit routes geographically, verifies budget allocations, and adapts to your changes on the fly.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/wizard"
                  className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center gap-2 group"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Start AI Trip Wizard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/dashboard"
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm shadow-xs transition-colors flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Explore Demo Trips</span>
                </Link>
              </div>

              {/* Social Proof Stats */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200/80">
                <div>
                  <p className="text-2xl font-black text-slate-900">100%</p>
                  <p className="text-xs text-slate-500">Geospatial Validation</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">&lt; 30s</p>
                  <p className="text-xs text-slate-500">Autonomous Orchestration</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">4.9 / 5</p>
                  <p className="text-xs text-slate-500">Traveler Rating</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                {/* Decorative glow */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-xl" />

                {/* Floating Preview Card */}
                <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80"
                      alt="Tokyo Itinerary"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-900 backdrop-blur-sm shadow-xs">
                        Tokyo, Japan • 5 Days
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-extrabold text-lg">Tokyo Cultural & Culinary Odyssey</h3>
                      <p className="text-xs text-slate-300">Curated with 14 activities & route clusters</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-3">
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <DollarSign className="w-3.5 h-3.5" /> Total Budget: $3,500
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-blue-600">
                        <Users className="w-3.5 h-3.5" /> 2 Travelers
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-800">Senso-ji Temple & Nakamise-dori</span>
                        <span className="text-blue-600 font-bold">09:00 AM</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-800">Namiki Yabusoba Lunch</span>
                        <span className="text-blue-600 font-bold">12:00 PM</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-800">Tokyo Skytree Observation</span>
                        <span className="text-blue-600 font-bold">02:00 PM</span>
                      </div>
                    </div>

                    <Link
                      to="/trip/11111111-1111-1111-1111-111111111111"
                      className="block text-center w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                    >
                      View Live Interactive Schedule
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Curated Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Trending AI-Designed Itineraries
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Explore realistic trips generated with live tool calling, optimized for minimum commute times and maximum experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredDestinations.map((dest, i) => (
            <div
              key={i}
              className="group rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-slate-800 backdrop-blur-sm">
                    {dest.tag}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                    {dest.city}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span>{dest.days} Days Itinerary</span>
                    <span className="font-semibold text-slate-900">{dest.budget}</span>
                  </div>
                </div>

                <Link
                  to="/wizard"
                  className="w-full py-2 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold text-center border border-slate-200 hover:border-transparent transition-all"
                >
                  Customize This Trip
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Architecture & Key Features */}
      <section className="bg-slate-900 text-white py-20 rounded-3xl max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Built on Supabase & Intelligent Tool Calling</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            How TripPilot AI Transforms Travel
          </h2>
          <p className="text-slate-400 text-sm">
            Person 1 (Frontend) & Person 2 (Backend Agent) collaborate over shared Supabase schemas and real-time planning states.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Route className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Geospatial Routing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Activities are grouped geographically into smart morning, afternoon, and evening clusters to eliminate wasted cross-city transit.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Precision Budget Tracker</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time expenditure tracking with Recharts visualizations across flights, accommodations, dining, tickets, and contingency funds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Natural Language Tweaks</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Chat directly with your AI Co-Pilot: "Find an omakase sushi dinner near Shibuya" or "Regenerate Day 3 with outdoor parks" for instant updates.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-10 sm:p-14 text-center overflow-hidden shadow-2xl shadow-blue-500/20">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to Plan Your Next Journey?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Create a personalized, day-by-day travel blueprint in under a minute with complete budget control and live route visualization.
            </p>
            <div className="pt-2">
              <Link
                to="/wizard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-blue-50 text-blue-900 font-extrabold text-sm shadow-lg transition-transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Launch Trip Creation Wizard</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
