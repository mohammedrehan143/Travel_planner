import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroBanner } from '../components/home/HeroBanner';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Full End-to-End Hero Section matching demo image.png */}
      <HeroBanner onSearchSubmit={(query) => navigate(`/wizard?q=${encodeURIComponent(query)}`)} />
    </div>
  );
};
