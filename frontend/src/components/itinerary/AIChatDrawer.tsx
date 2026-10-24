import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Bot, User as UserIcon, X, Check, Loader2, ArrowRight, MapPin, Compass } from 'lucide-react';
import { Trip, TripDay, Activity } from '../../types';
import { TripPilotAPI } from '../../lib/api';
import { useTrips } from '../../context/TripContext';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  currentDay?: TripDay;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'add_activity';
    activity: Activity;
  };
  createdTrip?: Trip;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  trip,
  currentDay,
}) => {
  const { addActivity, addPlannedTrip, activeTripActivities, setActiveTripId } = useTrips();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hi! I'm your AI Travel Architect powered by Google Gemini. Ask me about local specialities, vegetarian or non-vegetarian dining, scenic hangout spots, or tell me to plan a brand-new trip anywhere in the world!`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Plan a 3-day trip to Goa',
    'Recommend top hangout spots & evening cafes',
    'Authentic dining with veg/non-veg options',
    'Plan a weekend trip to Dubai',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isThinking) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await TripPilotAPI.modifyItinerary({
        trip_id: trip.id,
        day_id: currentDay?.id,
        day_number: currentDay?.day_number,
        user_prompt: prompt,
        context: {
          destination: trip.destination,
          origin: trip.origin,
          dates: `${trip.start_date} to ${trip.end_date}`,
          travelStyle: trip.travel_style,
          interests: trip.interests,
          budget: trip.total_budget,
          currency: trip.currency,
          selectedDay: currentDay ? {
            dayNumber: currentDay.day_number,
            date: currentDay.date,
            activities: activeTripActivities[currentDay.id] || [],
          } : undefined,
        },
      });

      let newlyCreatedTrip: Trip | undefined;
      if (response.createdTrip) {
        newlyCreatedTrip = addPlannedTrip(response.createdTrip);
      }

      // If response generated an activity for the current day
      if (response.new_activity && currentDay) {
        await addActivity(currentDay.id, response.new_activity);
      }

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdTrip: newlyCreatedTrip,
        suggestedAction: response.new_activity
          ? {
              type: 'add_activity',
              activity: response.new_activity,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: e instanceof Error ? e.message : 'I had trouble processing that request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-[#E5E7EB] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header (Selective Dark Section) */}
      <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#171717] text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-[#F97316] border border-neutral-700">
            <Sparkles className="w-4 h-4 text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-white">
              <span>TripPilot AI Architect</span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Active on {currentDay ? `Day ${currentDay.day_number}` : trip.destination} • Gemini Driven
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Close Chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested prompts chips */}
      <div className="px-4 py-2 bg-[#F3F4F6] border-b border-[#E5E7EB] overflow-x-auto">
        <div className="flex items-center gap-1.5 text-[11px] min-w-max">
          <span className="font-semibold text-[#525252] mr-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#F97316]" />
            Try:
          </span>
          {samplePrompts.map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sp)}
              className="px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#171717] hover:border-[#F97316] hover:text-[#F97316] transition-colors shadow-sm"
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((m) => {
          const isAi = m.sender === 'ai';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isAi ? 'bg-[#171717] text-[#F97316] border border-neutral-800' : 'bg-[#F3F4F6] text-[#171717] border border-[#E5E7EB]'
                }`}
              >
                {isAi ? <Bot className="w-4 h-4 text-[#F97316]" /> : <UserIcon className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] space-y-1.5`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAi
                      ? 'bg-[#F3F4F6] text-[#171717] rounded-tl-none border border-[#E5E7EB]/50'
                      : 'bg-[#F97316] text-white rounded-tr-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Render Newly Planned Trip Card */}
                  {m.createdTrip && (
                    <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-card space-y-2.5 text-left text-[#171717]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#171717] text-[#F97316] flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#F97316]" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#171717] line-clamp-1">{m.createdTrip.title}</p>
                            <p className="text-[10px] text-[#525252]">
                              {m.createdTrip.destination} • {m.createdTrip.duration_days} Day(s) • {m.createdTrip.traveler_count} Traveler(s)
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Ready
                        </span>
                      </div>

                      <div className="text-[11px] text-[#525252] flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
                        <span>Budget: <strong className="text-[#171717]">{m.createdTrip.currency} {m.createdTrip.total_budget}</strong></span>
                        <span>Style: <strong className="text-[#171717] capitalize">{m.createdTrip.travel_style}</strong></span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTripId(m.createdTrip!.id);
                          onClose();
                          navigate(`/trip/${m.createdTrip!.id}`);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs shadow-sm transition-all group"
                      >
                        <MapPin className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                        <span>Open & Start Trip</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Applied activity card badge */}
                  {m.suggestedAction?.activity && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-white text-[#171717] border border-[#E5E7EB] shadow-sm flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-[11px] line-clamp-1">
                          {m.suggestedAction.activity.title}
                        </p>
                        <p className="text-[10px] text-[#525252]">
                          {m.suggestedAction.activity.start_time} • {m.suggestedAction.activity.location_name}
                        </p>
                      </div>
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-[#16A34A]" />
                        Added
                      </span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] text-[#525252] block ${isAi ? 'pl-1' : 'text-right pr-1'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-[#525252] pl-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F97316]" />
            <span>AI Orchestrator reasoning with Gemini...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 border-t border-[#E5E7EB] bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI or say 'Plan a 3-day trip to Goa'..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#171717] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white disabled:opacity-40 transition-colors shadow-sm active:scale-95"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
