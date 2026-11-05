import React, { useState } from 'react';
import { HeroSection } from '../components/home/HeroSection';
import { WhyChooseSection } from '../components/home/WhyChooseSection';
import { Footer } from '../components/common/Footer';
import { AIAgentsModal } from '../components/home/AIAgentsModal';
import { DemoModal } from '../components/home/DemoModal';

export const LandingPage: React.FC = () => {
  const [isAgentsModalOpen, setIsAgentsModalOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
      {/* 
        1. HERO SECTION:
        Pixel-perfect modern hero with alpine background (image copy.png),
        left typography, CTA buttons, social proof, and 4 bottom feature cards.
      */}
      <HeroSection
        onOpenAgents={() => setIsAgentsModalOpen(true)}
        onOpenDemo={() => setIsDemoOpen(true)}
      />

      {/* 
        2. WHY CHOOSE TRIPPILOT AI? SECTION & 3. CLEAN MODERN FOOTER:
        Preserved for desktop, hidden on mobile per explicit user requirement:
        "for mobile view i need it like this the herosection only rest all must be clear"
      */}
      <div className="hidden md:block">
        <WhyChooseSection
          onOpenAgents={() => setIsAgentsModalOpen(true)}
          onOpenDemo={() => setIsDemoOpen(true)}
        />
        <Footer />
      </div>

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
