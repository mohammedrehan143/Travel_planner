import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  User as UserIcon,
  X,
  Check,
  Loader2,
  ArrowRight,
  MapPin,
  Compass,
  Mic,
  Volume2,
  MessageSquare,
  PlusCircle
} from 'lucide-react';
import { Trip, TripDay, Activity } from '../../types';
import { TripPilotAPI } from '../../lib/api';
import { useTrips } from '../../context/TripContext';
import { VoiceModePanel } from '../voice/VoiceModePanel';
import { globalVoiceController } from '../../lib/voice';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trip?: Trip | null;
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

  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [conversationId, setConversationId] = useState<string>(() => {
    return localStorage.getItem('trippilot_active_conversation_id') || '';
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hi! I am Pilot, your TripPilot AI travel assistant. Ask me by voice or text about local specialities, dining options, scenic hangout spots, or say "Plan a 3-day trip to Coorg under ₹10,000" and I will build an authentic itinerary!`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const dictateSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock background body scroll completely while the chat drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'contain';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [isOpen]);

  // Isolate wheel scrolling inside the messages container and prevent boundary chaining to the background
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      const { scrollTop, scrollHeight, clientHeight } = el;
      const deltaY = e.deltaY;
      const isAtTop = scrollTop <= 0;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1;

      // Prevent boundary wheel events from chaining to the window/hero section
      if ((isAtTop && deltaY < 0) || (isAtBottom && deltaY > 0)) {
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, mode, messages.length]);

  // Restore conversation thread from memory/backend if existing
  useEffect(() => {
    if (conversationId && isOpen) {
      TripPilotAPI.getConversation(conversationId)
        .then((session) => {
          if (session && session.messages && session.messages.length > 0) {
            setMessages(
              session.messages.map((m) => ({
                id: m.id,
                sender: m.role === 'user' ? 'user' : 'ai',
                text: m.content,
                timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdTrip: m.createdTrip,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [conversationId, isOpen]);

  const samplePrompts = [
    'Plan a 3-day trip to Coorg under ₹10,000',
    'Plan a 3-day trip to Goa',
    'Recommend top hangout spots & evening cafes',
    'What\'s the weather in Manali?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && mode === 'chat') scrollToBottom();
  }, [messages, isOpen, mode]);

  // Clean up audio playback and timers when closing the drawer
  useEffect(() => {
    if (!isOpen) {
      if (dictateSilenceTimerRef.current) {
        clearTimeout(dictateSilenceTimerRef.current);
        dictateSilenceTimerRef.current = null;
      }
      globalVoiceController.stopPlayback();
      globalVoiceController.cancelRecording();
      setSpeakingMessageId(null);
      setIsDictating(false);
    }
  }, [isOpen]);

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

    // Fast in-memory conversation context (configurable window of recent 6 messages)
    const recentMessages = messages
      .filter((m) => m.id !== '1')
      .slice(-6)
      .map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

    try {
      const response = await TripPilotAPI.modifyItinerary({
        trip_id: trip?.id || 'new-trip',
        day_id: currentDay?.id,
        day_number: currentDay?.day_number,
        user_prompt: prompt,
        conversationId: conversationId || undefined,
        recentMessages,
        context: {
          destination: trip?.destination || 'Global Destinations',
          origin: trip?.origin || 'User Location',
          dates: trip ? `${trip.start_date} to ${trip.end_date}` : 'Upcoming',
          travelStyle: trip?.travel_style || 'balanced',
          interests: trip?.interests || ['sightseeing'],
          budget: trip?.total_budget || 20000,
          currency: trip?.currency || 'INR',
          selectedDay: currentDay ? {
            dayNumber: currentDay.day_number,
            date: currentDay.date,
            activities: (currentDay.id && activeTripActivities[currentDay.id]) || [],
          } : undefined,
        },
      });

      if (response.conversationId) {
        setConversationId(response.conversationId);
        localStorage.setItem('trippilot_active_conversation_id', response.conversationId);
      }

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

  // Speak specific message bubble aloud
  const handleSpeakMessage = async (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      globalVoiceController.stopPlayback();
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(msgId);
    await globalVoiceController.speakText({
      text,
      language: 'en',
      voice: localStorage.getItem('trippilot_preferred_voice') || 'Jenny',
      onStart: () => setSpeakingMessageId(msgId),
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  const stopDictation = async () => {
    if (dictateSilenceTimerRef.current) {
      clearTimeout(dictateSilenceTimerRef.current);
      dictateSilenceTimerRef.current = null;
    }
    setIsDictating(false);
    try {
      const { audioBase64, format } = await globalVoiceController.stopRecording();
      // Only call backend STT if speech recognition did not already provide text
      if (!input.trim()) {
        const sttRes = await TripPilotAPI.speechToText({ audioBase64, format, language: 'en' });
        if (sttRes.text && sttRes.text.trim()) {
          setInput(sttRes.text.trim());
        }
      }
    } catch (e) {
      console.warn('Dictation failed:', e);
    }
  };

  // Quick dictation in text input with 2-second silence auto-stop
  const handleQuickDictate = async () => {
    if (isDictating) {
      await stopDictation();
    } else {
      try {
        setIsDictating(true);
        if (dictateSilenceTimerRef.current) clearTimeout(dictateSilenceTimerRef.current);

        // Auto-stop after 2 seconds of silence (only fallback to energy when speech recognition inactive)
        globalVoiceController.setVolumeCallback((vol) => {
          if (!globalVoiceController.isSpeechRecognitionActive()) {
            if (vol > 0.22) {
              if (dictateSilenceTimerRef.current) clearTimeout(dictateSilenceTimerRef.current);
              dictateSilenceTimerRef.current = setTimeout(() => {
                stopDictation();
              }, 2000);
            }
          }
        });

        // 12-second safety ceiling
        dictateSilenceTimerRef.current = setTimeout(() => {
          stopDictation();
        }, 12000);

        await globalVoiceController.startRecording({
          language: 'en',
          onInterimTranscript: (interim) => {
            const trimmed = interim.trim();
            if (trimmed) {
              setInput(trimmed);
              if (dictateSilenceTimerRef.current) clearTimeout(dictateSilenceTimerRef.current);
              dictateSilenceTimerRef.current = setTimeout(() => {
                stopDictation();
              }, 2000);
            }
          },
        });
      } catch (err: any) {
        setIsDictating(false);
        if (dictateSilenceTimerRef.current) clearTimeout(dictateSilenceTimerRef.current);
        alert(err.message || 'Microphone access failed.');
      }
    }
  };

  // Start a fresh new chat session with agent greeting
  const handleNewChat = async () => {
    globalVoiceController.stopPlayback();
    globalVoiceController.cancelRecording();
    setSpeakingMessageId(null);
    setIsDictating(false);
    setInput('');
    setIsThinking(false);

    try {
      const fresh = await TripPilotAPI.createConversation();
      if (fresh) {
        setConversationId(fresh.conversationId);
        localStorage.setItem('trippilot_active_conversation_id', fresh.conversationId);
      } else {
        const fallbackId = crypto.randomUUID();
        setConversationId(fallbackId);
        localStorage.setItem('trippilot_active_conversation_id', fallbackId);
      }
    } catch {
      const fallbackId = crypto.randomUUID();
      setConversationId(fallbackId);
      localStorage.setItem('trippilot_active_conversation_id', fallbackId);
    }

    const greetingMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: `Hi! I am Pilot, your TripPilot AI travel assistant. Where would you like to travel next? Speak or type your request!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([greetingMsg]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Semi-transparent Backdrop: locks background and closes drawer on outside click */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-200"
        onClick={() => {
          globalVoiceController.stopPlayback();
          onClose();
        }}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-hidden="true"
      />

      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-[#E5E7EB] flex flex-col animate-in slide-in-from-right duration-200 overscroll-contain"
        style={{ overscrollBehavior: 'contain' }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header with Dual Mode Toggle (Chat / Voice) */}
      <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-[#171717] text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-blue-400/40 shadow-xs shrink-0 bg-white">
            <img src="/chatbot-avatar.png" alt="Pilot AI Mascot" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-white">
              <span>Pilot • AI Travel Assistant</span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              TripPilot AI • Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 transition-colors border border-neutral-700/60 shadow-xs"
            title="Start a fresh chat"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">New</span>
          </button>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-neutral-900 border border-neutral-700/80 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                globalVoiceController.stopPlayback();
                setMode('chat');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                mode === 'chat'
                  ? 'bg-[#1E60FF] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={() => {
                globalVoiceController.stopPlayback();
                setMode('voice');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                mode === 'voice'
                  ? 'bg-[#1E60FF] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-cyan-300" />
              <span>Voice</span>
            </button>
          </div>

          <button
            onClick={() => {
              globalVoiceController.stopPlayback();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* BODY: Mode Switch (Voice Mode vs Text Chat Mode) */}
      {mode === 'voice' ? (
        <VoiceModePanel
          trip={trip}
          currentDay={currentDay}
          conversationId={conversationId}
          recentMessages={messages
            .filter((m) => m.id !== '1')
            .slice(-6)
            .map((m) => ({
              role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: m.text,
            }))}
          onConversationIdChange={(id) => {
            setConversationId(id);
            localStorage.setItem('trippilot_active_conversation_id', id);
          }}
          onSwitchToChat={() => setMode('chat')}
          onNewMessage={(msg) => setMessages((prev) => [...prev, msg])}
          onNewChat={handleNewChat}
        />
      ) : (
        <>
          {/* Suggested prompts chips */}
          <div className="px-4 py-2 bg-[#F3F4F6] border-b border-[#E5E7EB] overflow-x-auto">
            <div className="flex items-center gap-1.5 text-[11px] min-w-max">
              <span className="font-semibold text-[#525252] mr-1 flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#1E60FF]" />
                Try:
              </span>
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sp)}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB] text-[#171717] hover:border-[#1E60FF] hover:text-[#1E60FF] transition-colors shadow-sm"
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Thread */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-white overscroll-contain"
            style={{ overscrollBehavior: 'contain' }}
            onWheel={(e) => e.stopPropagation()}
          >
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 overflow-hidden ${
                      isAi
                        ? 'border border-[#1E60FF]/30 shadow-xs bg-white'
                        : 'bg-[#F3F4F6] text-[#171717] border border-[#E5E7EB]'
                    }`}
                  >
                    {isAi ? (
                      <img src="/chatbot-avatar.png" alt="AI" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className={`max-w-[85%] space-y-1.5`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isAi
                          ? 'bg-[#F3F4F6] text-[#171717] rounded-tl-none border border-[#E5E7EB]/50'
                          : 'bg-[#1E60FF] text-white rounded-tr-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>

                      {/* Render Newly Planned Trip Card */}
                      {m.createdTrip && (
                        <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-card space-y-2.5 text-left text-[#171717]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#171717] text-[#1E60FF] flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-[#1E60FF]" />
                              </div>
                              <div>
                                <p className="font-bold text-xs text-[#171717] line-clamp-1">{m.createdTrip.title}</p>
                                <p className="text-[10px] text-[#525252]">
                                  {m.createdTrip.destination} • {m.createdTrip.duration_days} Day(s) • {m.createdTrip.traveler_count} Traveler(s)
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
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
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1E60FF] hover:bg-[#0052FF] text-white font-semibold text-xs shadow-sm transition-all group"
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
                            <Check className="w-3 h-3 text-[#1E60FF]" />
                            Added
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer for message with timestamp and speak aloud control */}
                    <div className={`flex items-center gap-2 text-[10px] text-[#525252] ${isAi ? 'pl-1' : 'justify-end pr-1'}`}>
                      <span>{m.timestamp}</span>
                      {isAi && (
                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(m.id, m.text)}
                          title="Speak response aloud"
                          className="p-1 rounded-md text-neutral-400 hover:text-[#1E60FF] hover:bg-neutral-100 transition-colors"
                        >
                          <Volume2
                            className={`w-3.5 h-3.5 ${
                              speakingMessageId === m.id ? 'text-[#1E60FF] animate-bounce' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-[#525252] pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1E60FF]" />
                <span>AI Orchestrator reasoning with Pilot AI...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input box with Send and Voice Dictation */}
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
                placeholder="Ask Pilot or say 'Plan a 3-day trip to Coorg'..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#171717] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1E60FF]"
              />

              {/* Quick Dictate Mic Button */}
              <button
                type="button"
                onClick={handleQuickDictate}
                className={`p-2.5 rounded-xl border transition-all ${
                  isDictating
                    ? 'bg-red-500 text-white animate-pulse border-red-600'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-200'
                }`}
                title={isDictating ? 'Listening... Tap to finish' : 'Dictate with voice'}
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="p-2.5 rounded-xl bg-[#1E60FF] hover:bg-[#0052FF] text-white disabled:opacity-40 transition-colors shadow-sm active:scale-95"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
    </>
  );
};
