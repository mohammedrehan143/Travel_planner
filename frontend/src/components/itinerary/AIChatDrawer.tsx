import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User as UserIcon, X, Check, Loader2, ArrowRight } from 'lucide-react';
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
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  trip,
  currentDay,
}) => {
  const { addActivity, activeTripActivities } = useTrips();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello! I'm your AI Travel Co-Pilot. I can adjust schedules, swap museums for outdoors, find authentic restaurants, or optimize route timings for ${trip.destination}. How can I tweak your trip?`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Add an authentic ramen or sushi dinner for tonight',
    'Make tomorrow afternoon slower-paced and relaxing',
    'Find a scenic sunset viewpoint with drinks',
    'Is there any scheduling conflict in Day 1?',
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

      // If response generated an activity, automatically add it or show apply button
      if (response.new_activity && currentDay) {
        await addActivity(currentDay.id, response.new_activity);
      }

      const aiMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          id: `msg-err-${Date.now()}`,
          sender: 'ai',
          text: 'I had trouble processing that modification right now, but your schedule is intact!',
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
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-200 backdrop-blur-sm border border-blue-400/30">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold">TripPilot AI Assistant</h3>
            <p className="text-[11px] text-blue-200">
              Active on {currentDay ? `Day ${currentDay.day_number}` : trip.destination}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested prompts chips */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-[11px] min-w-max">
          <span className="font-semibold text-slate-500 mr-1">Try:</span>
          {samplePrompts.slice(0, 2).map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sp)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
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

              <div className={`max-w-[80%] space-y-1.5`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAi
                      ? 'bg-slate-100 text-slate-800 rounded-tl-xs'
                      : 'bg-blue-600 text-white rounded-tr-xs shadow-sm'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Applied activity card badge */}
                  {m.suggestedAction?.activity && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-white text-slate-900 border border-slate-200/80 shadow-xs flex items-center justify-between gap-2">
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
            <span>AI Orchestrator reasoning through route & opening hours...</span>
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
            placeholder="Ask AI to modify your day..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
