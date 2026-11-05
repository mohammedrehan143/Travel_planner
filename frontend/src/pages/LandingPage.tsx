import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { HeroBanner } from '../components/home/HeroBanner';
import { FeatureCards } from '../components/home/FeatureCards';
import { YourTripsSection } from '../components/home/YourTripsSection';
import { TripPilotChatWidget } from '../components/home/TripPilotChatWidget';
import { MonthStatsWidget } from '../components/home/MonthStatsWidget';
import { AIChatDrawer } from '../components/itinerary/AIChatDrawer';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { trips, setActiveTripId } = useTrips();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);

  const handleOpenTrip = (tripId: string) => {
    setActiveTripId(tripId);
    navigate(`/trip/${tripId}`);
  };

  const handleOpenAssistant = (prompt?: string) => {
    setChatPrompt(prompt);
    setIsAIChatOpen(true);
  };

  const sampleTrip = trips[0] || {
    id: 'coorg-trip-0001',
    user_id: 'demo-user',
    title: 'Coorg Getaway',
    destination: 'Coorg, Karnataka',
    duration_days: 5,
    traveler_count: 2,
    travel_style: 'adventure',
    interests: ['coffee plantations', 'trekking'],
    total_budget: 15000,
    currency: 'INR',
    status: 'planning',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-8 select-none">
      {/* 1. Hero Section matching image.png with static background image */}
      <HeroBanner onSearchSubmit={(query) => navigate(`/wizard?q=${encodeURIComponent(query)}`)} />

      {/* 2. Four Feature Cards directly below Hero Section */}
      <FeatureCards />

      {/* 3. Main Dashboard 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Your Trips Carousel & Interactive Cards */}
        <div className="lg:col-span-8 space-y-6">
          <YourTripsSection trips={trips} onOpenTrip={handleOpenTrip} />
        </div>

        {/* Right Column (4 cols): TripPilot AI Assistant Widget & Monthly Stats */}
        <div className="lg:col-span-4 space-y-6">
          <TripPilotChatWidget onOpenAssistant={handleOpenAssistant} />
          <MonthStatsWidget
            tripsCount={trips.length > 0 ? trips.length : 2}
            nightsCount={trips.reduce((acc, t) => acc + (t.duration_days || 0), 0) || 6}
            totalSpend={trips.reduce((acc, t) => acc + (t.total_budget || 0), 0) || 24500}
          />
        </div>
      </div>

      {/* Interactive AI Chat Drawer */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        trip={sampleTrip}
      />
    </div>
  );
};
