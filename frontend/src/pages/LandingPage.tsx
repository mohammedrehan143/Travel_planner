import React, { useState } from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { Footer } from '../components/common/Footer';
import { AIAgentsModal } from '../components/home/AIAgentsModal';
import { DemoModal } from '../components/home/DemoModal';

export const LandingPage: React.FC = () => {
  const [isAgentsModalOpen, setIsAgentsModalOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
      {/* 
        CLEAN HERO SECTION:
        Pixel-perfect modern hero with alpine background (image copy.png),
        left typography, CTA buttons, social proof, and 4 bottom feature cards
        with generous bottom padding so cards never collide with the footer.
      */}
      <div className="flex-1 flex flex-col">
        <HeroSection
          onOpenAgents={() => setIsAgentsModalOpen(true)}
          onOpenDemo={() => setIsDemoOpen(true)}
        />
      </div>

      {/* Clean Modern Footer */}
      <Footer />

      {/* Interactive AI Agents Modal */}
      <AIAgentsModal
        isOpen={isAgentsModalOpen}
        onClose={() => setIsAgentsModalOpen(false)}
      />

      {/* Interactive Watch Demo Walkthrough Modal */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
