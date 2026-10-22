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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-200 backdrop-blur-sm border border-blue-400/30">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <span>TripPilot AI Architect</span>
            </h3>
            <p className="text-[11px] text-blue-200">
              Active on {currentDay ? `Day ${currentDay.day_number}` : trip.destination} • Gemini Driven
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          title="Close Chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested prompts chips */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-[11px] min-w-max">
          <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-blue-600" />
            Try:
          </span>
          {samplePrompts.map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sp)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-2xs"
            >
              {sp}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isAi = m.sender === 'ai';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isAi ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] space-y-1.5`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAi
                      ? 'bg-slate-100 text-slate-800 rounded-tl-xs'
                      : 'bg-blue-600 text-white rounded-tr-xs shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Render Newly Planned Trip Card */}
                  {m.createdTrip && (
                    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-xs space-y-2.5 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-blue-950 line-clamp-1">{m.createdTrip.title}</p>
                            <p className="text-[10px] text-blue-700">
                              {m.createdTrip.destination} • {m.createdTrip.duration_days} Day(s) • {m.createdTrip.traveler_count} Traveler(s)
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                          Ready
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-blue-100">
                        <span>Budget: <strong className="text-slate-800">{m.createdTrip.currency} {m.createdTrip.total_budget}</strong></span>
                        <span>Style: <strong className="text-slate-800 capitalize">{m.createdTrip.travel_style}</strong></span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTripId(m.createdTrip!.id);
                          onClose();
                          navigate(`/trip/${m.createdTrip!.id}`);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all group"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-200 group-hover:scale-110 transition-transform" />
                        <span>Open & Start Trip</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Applied activity card badge */}
                  {m.suggestedAction?.activity && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-white text-slate-900 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-[11px] line-clamp-1">
                          {m.suggestedAction.activity.title}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {m.suggestedAction.activity.start_time} • {m.suggestedAction.activity.location_name}
                        </p>
                      </div>
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" />
                        Added
                      </span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] text-slate-400 block ${isAi ? 'pl-1' : 'text-right pr-1'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pl-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>AI Orchestrator reasoning with Gemini...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 border-t border-slate-100 bg-white">
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
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors shadow-sm"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
