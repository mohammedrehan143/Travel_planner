import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { HeroBanner } from '../components/home/HeroBanner';
import { FeatureCards } from '../components/home/FeatureCards';
import { YourTripsSection } from '../components/home/YourTripsSection';
import { TripPilotChatWidget } from '../components/home/TripPilotChatWidget';
import { MonthStatsWidget } from '../components/home/MonthStatsWidget';
import { AIChatDrawer } from '../components/itinerary/AIChatDrawer';

export const DashboardPage: React.FC = () => {
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

  const activeTripForChat = trips[0] || null;

  return (
    <div className="space-y-6 select-none">
      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left & Center Column (8 cols): Hero Banner, 4 Feature Cards, Your Trips */}
        <div className="lg:col-span-8 space-y-5">
          {/* Hero Banner with static background image */}
          <HeroBanner onSearchSubmit={(query) => navigate(`/wizard?q=${encodeURIComponent(query)}`)} />

          {/* 4 Feature Cards row */}
          <FeatureCards />

          {/* "Your Trips" carousel/grid */}
          <YourTripsSection trips={trips} onOpenTrip={handleOpenTrip} />
        </div>

        {/* Right Column (4 cols): TripPilot AI Assistant Widget & Monthly Stats */}
        <div className="lg:col-span-4 space-y-5">
          <TripPilotChatWidget onOpenAssistant={handleOpenAssistant} />
          <MonthStatsWidget
            tripsCount={trips.length}
            nightsCount={trips.reduce((acc, t) => acc + (t.duration_days || 0), 0)}
            totalSpend={trips.reduce((acc, t) => acc + (t.total_budget || 0), 0)}
          />
        </div>
      </div>

      {/* Interactive AI Chat Drawer */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        trip={activeTripForChat}
      />
    </div>
  );
};
