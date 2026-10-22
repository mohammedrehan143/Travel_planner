import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Bot, User as UserIcon, X, Check, Loader2, ArrowRight, MapPin } from 'lucide-react';
import { Trip, TripDay, Activity } from '../../types';
import { HangoutPlace, TripPilotAPI } from '../../lib/api';
import { useTrips } from '../../context/TripContext';
import { useAuth } from '../../context/AuthContext';

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
  tripId?: string;
}

interface HangoutFlow {
  step: 'idle' | 'location' | 'duration';
  location?: { label: string; lat: number; lng: number };
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  trip,
  currentDay,
}) => {
  const { addActivity, addHangoutPlan, activeTripActivities, setActiveTripId } = useTrips();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hangoutFlow, setHangoutFlow] = useState<HangoutFlow>({ step: 'idle' });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hi! I can help plan a day out with your cousin. Tell me what you have in mind and I’ll ask how long you want to go out for.`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addAIMessage = (text: string, tripId?: string) => setMessages((prev) => [...prev, {
    id: `msg-ai-${Date.now()}`,
    sender: 'ai',
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tripId,
  }]);

  const detectLocation = async (): Promise<NonNullable<HangoutFlow['location']>> => {
    if (!navigator.geolocation) throw new Error('Location services are not available in this browser.');
    const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        () => reject(new Error('I could not access your location. You can type your city or neighborhood instead.')),
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
      );
    });

    let label = `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`;
    try {
      const params = new URLSearchParams({ format: 'jsonv2', lat: String(coords.latitude), lon: String(coords.longitude) });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        label = address.suburb || address.neighbourhood || address.city_district || address.city || address.town || address.village || label;
        if (address.city && label !== address.city) label = `${label}, ${address.city}`;
      }
    } catch {
      // Coordinates still locate nearby results if reverse geocoding is unavailable.
    }
    return { label, lat: coords.latitude, lng: coords.longitude };
  };

  const createHangout = async (location: NonNullable<HangoutFlow['location']>, hours: number) => {
    const found = await TripPilotAPI.searchHangoutPlaces(location.label, location);
    const usable = found.filter((place) => place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng));
    const count = Math.min(usable.length, hours >= 5 ? 3 : 2);
    if (count < 2) throw new Error(`I couldn't find enough places near ${location.label} to make a good hangout plan.`);

    const places = usable.slice(0, count);
    const planLocation = {
      ...location,
      lat: location.lat || places[0].lat,
      lng: location.lng || places[0].lng,
    };
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tripId = `hangout-${Date.now()}`;
    const dayId = `day-${tripId}-1`;
    const totalMinutes = Math.round(hours * 60);
    const activityMinutes = Math.max(45, Math.floor((totalMinutes - (count - 1) * 15) / count));
    const startAt = 10 * 60;
    const categoryMap: Record<string, Activity['category']> = {
      sightseeing: 'sightseeing', cultural: 'cultural', outdoor: 'outdoor', dining: 'dining',
      entertainment: 'entertainment', shopping: 'shopping', relaxation: 'relaxation', transit: 'transit',
    };
    const activities: Activity[] = places.map((place: HangoutPlace, index) => {
      const start = startAt + index * (activityMinutes + 15);
      const end = start + activityMinutes;
      const time = (mins: number) => `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
      const rawCategory = (place.category || 'sightseeing').toLowerCase();
      return {
        id: `act-${tripId}-${index + 1}`,
        trip_id: tripId,
        trip_day_id: dayId,
        title: place.name,
        description: place.description || `A stop on your ${hours}-hour hangout near ${location.label}.`,
        category: categoryMap[rawCategory] || 'sightseeing',
        start_time: time(start),
        end_time: time(end),
        duration_minutes: activityMinutes,
        location_name: place.name,
        location_address: place.address,
        latitude: place.lat,
        longitude: place.lng,
        estimated_cost: place.estimatedCost || 0,
        currency: trip.currency,
        booking_required: false,
        booking_status: 'not_booked',
        order_index: index,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
    });
    const hangoutTrip: Trip = {
      id: tripId,
      user_id: user?.id || '00000000-0000-0000-0000-000000000001',
      title: 'Hangout with Cousin',
      description: `${hours}-hour outing with ${activities.length} stops near ${location.label}.`,
      origin: location.label,
      destination: location.label,
      start_date: date,
      end_date: date,
      duration_days: 1,
      traveler_count: 2,
      travel_companion: 'friends',
      travel_style: 'balanced',
      interests: ['hangout', 'food', 'sightseeing'],
      total_budget: activities.reduce((sum, activity) => sum + activity.estimated_cost, 0),
      currency: trip.currency || 'USD',
      status: 'planning',
      destination_lat: planLocation.lat,
      destination_lng: planLocation.lng,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    const day: TripDay = {
      id: dayId,
      trip_id: tripId,
      day_number: 1,
      date,
      theme: `Cousin hangout · ${hours} hours`,
      summary: `${activities.length} nearby stops planned around ${location.label}.`,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    addHangoutPlan(hangoutTrip, day, activities);
    return { hangoutTrip, activities };
  };

  const samplePrompts = [
    'Plan a one-day hangout with my cousin',
    'Plan a 4-hour outing near me',
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
      const isHangoutRequest = /\b(hang ?out|go out|day out|outing|with my cousin|with cousin|near me)\b/i.test(prompt);
      if (isHangoutRequest && hangoutFlow.step === 'idle') {
        try {
          const location = await detectLocation();
          if (!location) throw new Error('Location not found');
          setHangoutFlow({ step: 'duration', location });
          addAIMessage(`I found your area near ${location.label}. How many hours would you like the hangout to last?`);
        } catch {
          setHangoutFlow({ step: 'location' });
          addAIMessage('I need your area to find nearby places. Type your city or neighborhood, and I’ll plan around it.');
        }
        return;
      }

      if (hangoutFlow.step === 'location') {
        const location = { label: prompt, lat: 0, lng: 0 };
        setHangoutFlow({ step: 'duration', location });
        addAIMessage(`Got it, ${prompt}. How many hours should I plan for?`);
        return;
      }

      if (hangoutFlow.step === 'duration' && hangoutFlow.location) {
        const durationText = prompt.toLowerCase();
        const parsedHours = Number(durationText.match(/\d+(?:\.\d+)?/)?.[0]);
        const hours = durationText.includes('half day') ? 4 : durationText.includes('all day') || durationText.includes('full day') || /\b1\s*day\b/.test(durationText) ? 8 :
          durationText.includes('hour') || durationText.endsWith('h') || /^\d+(?:\.\d+)?$/.test(durationText) ? parsedHours : NaN;
        if (!Number.isFinite(hours) || hours < 2 || hours > 12) {
          addAIMessage('Please choose a duration between 2 and 12 hours (for example, 3 hours or half a day).');
          return;
        }
        const { hangoutTrip, activities } = await createHangout(hangoutFlow.location, hours);
        setHangoutFlow({ step: 'idle' });
        const list = activities.map((activity) => `• ${activity.start_time}–${activity.end_time}: ${activity.title}`).join('\n');
        addAIMessage(`Your ${hours}-hour hangout with your cousin is ready with ${activities.length} stops near ${hangoutTrip.destination}:\n${list}\n\nI added it to your dashboard.`, hangoutTrip.id);
        return;
      }

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
      setHangoutFlow({ step: 'idle' });
      addAIMessage(e instanceof Error ? e.message : 'I had trouble planning that hangout. Please try again.');
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
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.tripId && (
                    <button
                      onClick={() => { setActiveTripId(m.tripId!); onClose(); navigate(`/trip/${m.tripId}`); }}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                    >
                      <MapPin className="h-3 w-3" /> View hangout plan
                    </button>
                  )}

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
