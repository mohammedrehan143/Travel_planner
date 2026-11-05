import React, { useState } from 'react';
import { Sidebar } from '../common/Sidebar';
import { TopHeader } from '../common/TopHeader';
import { AIAgentsModal } from '../home/AIAgentsModal';
import { AIChatDrawer } from '../itinerary/AIChatDrawer';
import { useTrips } from '../../context/TripContext';
import { X } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAgentsModalOpen, setIsAgentsModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const { trips, activeTrip } = useTrips();

  const sampleTrip = activeTrip || trips[0] || null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-neutral-900 flex font-sans antialiased selection:bg-[#1E60FF] selection:text-white">
      {/* Desktop Persistent Left Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenAgents={() => setIsAgentsModalOpen(true)}
        />
      </div>

      {/* Mobile Slide-over Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="pt-2 flex-1 flex flex-col justify-between">
              <Sidebar
                isCollapsed={false}
                onOpenAgents={() => {
                  setIsMobileMenuOpen(false);
                  setIsAgentsModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <TopHeader
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSearch={() => {
            const input = document.querySelector('input[placeholder*="Ask TripPilot"]') as HTMLInputElement;
            if (input) {
              input.focus();
              input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>

      {/* Global AI Agents Modal */}
      <AIAgentsModal
        isOpen={isAgentsModalOpen}
        onClose={() => setIsAgentsModalOpen(false)}
      />

      {/* Global AI Chat Drawer */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        trip={sampleTrip}
      />
    </div>
  );
};
