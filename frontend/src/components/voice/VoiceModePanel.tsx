import React, { useState, useEffect, useRef } from 'react';
import {
  VoiceState,
  SUPPORTED_VOICE_LANGUAGES,
  VoiceLanguage,
  globalVoiceController
} from '../../lib/voice';
import { TripPilotAPI, VoiceConfigResponse } from '../../lib/api';
import { VoiceVisualizerOrb } from './VoiceVisualizerOrb';
import { Trip, TripDay, Activity } from '../../types';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Globe,
  MapPin,
  ArrowRight,
  Check,
  AlertCircle,
  PlusCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../../context/TripContext';

interface VoiceModePanelProps {
  trip?: Trip | null;
  currentDay?: TripDay;
  conversationId?: string;
  onConversationIdChange?: (id: string) => void;
  onSwitchToChat: () => void;
  onNewMessage: (msg: {
    id: string;
    sender: 'ai' | 'user';
    text: string;
    timestamp: string;
    createdTrip?: Trip;
    suggestedAction?: { type: 'add_activity'; activity: Activity };
  }) => void;
  onNewChat?: () => void;
}

export const VoiceModePanel: React.FC<VoiceModePanelProps> = ({
  trip,
  currentDay,
  conversationId,
  onConversationIdChange,
  onSwitchToChat,
  onNewMessage,
  onNewChat
}) => {
  const { addActivity, addPlannedTrip, activeTripActivities, setActiveTripId } = useTrips();
  const navigate = useNavigate();

  const [state, setState] = useState<VoiceState>('idle');
  const [volume, setVolume] = useState<number>(0);
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [transcript, setTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);
  const [suggestedActivity, setSuggestedActivity] = useState<Activity | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfigResponse | null>(null);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);

  // Synchronization refs to prevent stale closure in timers
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<string>('');
  const stateRef = useRef<VoiceState>('idle');
  const isProcessingRef = useRef<boolean>(false);

  stateRef.current = state;
  transcriptRef.current = transcript;

  const clearSilenceTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setAutoSubmitCountdown(null);
  };

  // Initialize voice configuration and audio volume hooks
  useEffect(() => {
    TripPilotAPI.getVoiceConfig().then(setVoiceConfig).catch(() => {});
    globalVoiceController.setVolumeCallback((vol) => {
      setVolume(vol);

      // If user is actively speaking (audio soundwaves), reset the silence timer
      if (vol > 0.09 && stateRef.current === 'listening' && transcriptRef.current.trim().length > 0) {
        restartSilenceTimer();
      }
    });

    return () => {
      clearSilenceTimers();
      globalVoiceController.stopPlayback();
      globalVoiceController.cancelRecording();
    };
  }, []);

  const restartSilenceTimer = () => {
    if (stateRef.current !== 'listening' || isProcessingRef.current) return;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setAutoSubmitCountdown(2);
    let secondsLeft = 2;

    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setAutoSubmitCountdown(secondsLeft);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setAutoSubmitCountdown(null);
      }
    }, 1000);

    silenceTimerRef.current = setTimeout(() => {
      clearSilenceTimers();
      if (
        stateRef.current === 'listening' &&
        transcriptRef.current.trim().length > 0 &&
        !isProcessingRef.current
      ) {
        handleStopAndProcess();
      }
    }, 2000);
  };

  // Handle Start Recording
  const handleStartListening = async () => {
    try {
      clearSilenceTimers();
      setErrorMessage(null);
      setState('listening');
      setTranscript('');
      transcriptRef.current = '';
      setIsAudioPaused(false);
      isProcessingRef.current = false;

      await globalVoiceController.startRecording({
        language: selectedLang,
        onInterimTranscript: (interim) => {
          setTranscript(interim);
          transcriptRef.current = interim;
          if (interim.trim().length > 0) {
            restartSilenceTimer();
          }
        }
      });
    } catch (err: any) {
      console.error('Failed to start listening:', err);
      setState('error');
      setErrorMessage(err.message || 'Could not access microphone.');
    }
  };

  // Handle Stop Recording and Send to Orchestrator Pipeline
  const handleStopAndProcess = async () => {
    if (stateRef.current !== 'listening' || isProcessingRef.current) return;

    clearSilenceTimers();
    isProcessingRef.current = true;

    try {
      setState('processing');
      const { audioBase64, format } = await globalVoiceController.stopRecording();

      let recognizedText = transcriptRef.current.trim();

      // Transcribe via backend STT service
      try {
        const sttRes = await TripPilotAPI.speechToText({
          audioBase64,
          format,
          language: selectedLang
        });
        if (sttRes.text && sttRes.text.trim()) {
          recognizedText = sttRes.text.trim();
        }
      } catch (sttErr: any) {
        console.warn('Backend STT fallback:', sttErr);
      }

      if (!recognizedText) {
        setState('idle');
        isProcessingRef.current = false;
        setErrorMessage('No speech was detected. Please tap the microphone and speak again.');
        return;
      }

      setTranscript(recognizedText);

      // Record user message into chat history
      onNewMessage({
        id: `user-voice-${Date.now()}`,
        sender: 'user',
        text: recognizedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Submit recognized speech to the shared TripPilot agent conversation orchestrator
      const response = await TripPilotAPI.modifyItinerary({
        trip_id: trip?.id || 'new-trip',
        day_id: currentDay?.id,
        day_number: currentDay?.day_number,
        user_prompt: recognizedText,
        conversationId: conversationId || undefined,
        context: {
          destination: trip?.destination || 'Global Destinations',
          origin: trip?.origin || 'User Location',
          dates: trip ? `${trip.start_date} to ${trip.end_date}` : 'Upcoming',
          travelStyle: trip?.travel_style || 'balanced',
          interests: trip?.interests || ['sightseeing'],
          budget: trip?.total_budget || 20000,
          currency: trip?.currency || 'INR',
          language: selectedLang,
          selectedDay: currentDay
            ? {
                dayNumber: currentDay.day_number,
                date: currentDay.date,
                activities: (currentDay.id && activeTripActivities[currentDay.id]) || []
              }
            : undefined
        }
      });

      if (response.conversationId && onConversationIdChange) {
        onConversationIdChange(response.conversationId);
      }

      let newlyCreatedTrip: Trip | undefined;
      if (response.createdTrip) {
        newlyCreatedTrip = addPlannedTrip(response.createdTrip);
        setCreatedTrip(newlyCreatedTrip || null);
      }

      if (response.new_activity && currentDay) {
        await addActivity(currentDay.id, response.new_activity);
        setSuggestedActivity(response.new_activity);
      }

      const replyText = response.message || 'I have planned that for you!';
      setAssistantReply(replyText);

      // Record AI response into chat history
      onNewMessage({
        id: `ai-voice-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdTrip: newlyCreatedTrip,
        suggestedAction: response.new_activity
          ? { type: 'add_activity', activity: response.new_activity }
          : undefined
      });

      // Convert response into speech and speak aloud
      setState('speaking');
      await globalVoiceController.speakText({
        text: replyText,
        language: selectedLang,
        voice: voiceConfig?.defaultVoice || 'alloy',
        onStart: () => setState('speaking'),
        onEnd: () => {
          setState('idle');
          isProcessingRef.current = false;
        },
        onError: (err) => {
          console.warn('Speech playback issue:', err);
          setState('idle');
          isProcessingRef.current = false;
        }
      });
    } catch (err: any) {
      console.error('Processing voice query failed:', err);
      setState('error');
      setErrorMessage(err.message || 'Error executing travel request.');
      isProcessingRef.current = false;
    }
  };

  // User Interrupts Pilot
  const handleInterrupt = () => {
    clearSilenceTimers();
    globalVoiceController.stopPlayback();
    setState('interrupted');
    setTimeout(() => {
      setState('idle');
      isProcessingRef.current = false;
    }, 600);
  };

  // Replay Last Spoken Response
  const handleReplay = () => {
    if (!assistantReply) return;
    setState('speaking');
    globalVoiceController.replayLast({
      language: selectedLang,
      onStart: () => setState('speaking'),
      onEnd: () => setState('idle'),
      onError: () => setState('idle')
    });
  };

  // Pause / Resume audio
  const handleTogglePause = () => {
    if (isAudioPaused) {
      globalVoiceController.resumePlayback();
      setIsAudioPaused(false);
    } else {
      globalVoiceController.pausePlayback();
      setIsAudioPaused(true);
    }
  };

  // Start fresh chat
  const handleResetChat = () => {
    clearSilenceTimers();
    globalVoiceController.stopPlayback();
    globalVoiceController.cancelRecording();
    setState('idle');
    setTranscript('');
    setAssistantReply('');
    setCreatedTrip(null);
    setSuggestedActivity(null);
    setErrorMessage(null);
    isProcessingRef.current = false;
    onNewChat?.();

    // Friendly voice greeting
    const welcomeText = `Hi! I am Pilot, your TripPilot AI travel assistant. Where would you like to travel next? Speak or type your request!`;
    setAssistantReply(welcomeText);
    globalVoiceController.speakText({
      text: welcomeText,
      language: selectedLang,
      onStart: () => setState('speaking'),
      onEnd: () => setState('idle')
    });
  };

  const handleOrbClick = () => {
    if (state === 'idle' || state === 'error' || state === 'interrupted') {
      handleStartListening();
    } else if (state === 'listening') {
      handleStopAndProcess();
    } else if (state === 'speaking') {
      handleInterrupt();
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-white via-blue-50/20 to-white text-[#171717] overflow-y-auto">
      {/* Top Voice Header & Controls */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
        {/* Language selector & New Chat */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#1E60FF]" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={state === 'listening' || state === 'processing'}
            className="text-xs font-semibold bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#1E60FF] cursor-pointer shadow-xs"
          >
            {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleResetChat}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#1E60FF] hover:bg-blue-50 border border-blue-200 transition-colors flex items-center gap-1 shadow-xs"
            title="Start a fresh chat"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Provider badge */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Pilot Voice Active</span>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="my-auto py-6 flex flex-col items-center justify-center text-center">
        {/* Interactive Orb & Waveform */}
        <VoiceVisualizerOrb
          state={state}
          volume={volume}
          onClick={handleOrbClick}
          className="my-4"
        />

        {/* State Guide Message */}
        <div className="mt-4 max-w-xs space-y-1">
          <p className="text-sm font-bold text-slate-800">
            {state === 'listening'
              ? 'Listening to your request...'
              : state === 'processing'
              ? 'Pilot is reasoning & planning...'
              : state === 'speaking'
              ? 'Pilot is answering...'
              : state === 'interrupted'
              ? 'Interrupted'
              : state === 'error'
              ? 'Something went wrong'
              : 'Tap to speak with Pilot'}
          </p>

          <p className="text-xs text-slate-500">
            {state === 'listening'
              ? 'Speak naturally with pauses. Auto-submits after 2s of silence.'
              : state === 'speaking'
              ? 'Tap orb or "Interrupt" to stop audio anytime.'
              : 'Ask anything: "Plan 3 days in Coorg under ₹10,000", "Change tomorrow\'s plan", or "Weather in Manali".'}
          </p>
        </div>

        {/* 2-Second Silence Auto-Submit Countdown Badge */}
        {state === 'listening' && autoSubmitCountdown !== null && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E60FF] text-[11px] font-bold animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Auto-submitting in {autoSubmitCountdown}s... (keep speaking to extend)</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 max-w-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="text-left">{errorMessage}</span>
          </div>
        )}

        {/* Live Transcription Box */}
        {(transcript || state === 'listening') && (
          <div className="mt-4 w-full max-w-sm p-3.5 bg-white border border-blue-200 rounded-2xl shadow-sm text-left animate-in fade-in">
            <span className="text-[10px] font-black uppercase text-[#1E60FF] tracking-wider block mb-1">
              You Said:
            </span>
            <p className="text-xs text-slate-800 italic">
              "{transcript || 'Listening to your voice...'}"
            </p>
          </div>
        )}

        {/* Spoken AI Response Snippet */}
        {assistantReply && (
          <div className="mt-3 w-full max-w-sm p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-left animate-in fade-in">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">
                Pilot's Answer:
              </span>
              {state === 'speaking' && (
                <span className="text-[10px] font-bold text-[#1E60FF] flex items-center gap-1">
                  <Volume2 className="w-3 h-3 animate-bounce" /> Speaking
                </span>
              )}
            </div>
            <p className="text-xs text-slate-800 line-clamp-4 leading-relaxed">
              {assistantReply}
            </p>
          </div>
        )}

        {/* Newly Created Trip Card Preview */}
        {createdTrip && (
          <div className="mt-3 w-full max-w-sm p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-card space-y-2 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#171717] text-[#1E60FF] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#1E60FF]" />
                </div>
                <div>
                  <p className="font-bold text-xs text-[#171717] line-clamp-1">{createdTrip.title}</p>
                  <p className="text-[10px] text-[#525252]">
                    {createdTrip.destination} • {createdTrip.duration_days} Day(s)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Booked & Ready
              </span>
            </div>

            <button
              onClick={() => {
                setActiveTripId(createdTrip.id);
                navigate(`/trip/${createdTrip.id}`);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1E60FF] hover:bg-[#0052FF] text-white font-semibold text-xs shadow-sm transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span>Open & Start Trip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Added Activity Tag Preview */}
        {suggestedActivity && (
          <div className="mt-2.5 w-full max-w-sm p-2.5 rounded-xl bg-white text-[#171717] border border-[#E5E7EB] shadow-xs flex items-center justify-between text-left">
            <div>
              <p className="font-bold text-[11px] line-clamp-1">{suggestedActivity.title}</p>
              <p className="text-[10px] text-[#525252]">
                {suggestedActivity.start_time} • {suggestedActivity.location_name}
              </p>
            </div>
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-3 h-3 text-[#1E60FF]" /> Added
            </span>
          </div>
        )}
      </div>

      {/* Bottom Voice Controls Panel */}
      <div className="pt-3 border-t border-[#E5E7EB] space-y-2.5">
        <div className="flex items-center justify-center gap-3">
          {state === 'listening' ? (
            <>
              <button
                onClick={() => {
                  clearSilenceTimers();
                  globalVoiceController.cancelRecording();
                  setState('idle');
                  isProcessingRef.current = false;
                }}
                className="px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStopAndProcess}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 flex items-center gap-2 animate-pulse"
              >
                <MicOff className="w-4 h-4" />
                <span>Done Speaking</span>
              </button>
            </>
          ) : state === 'speaking' ? (
            <>
              <button
                onClick={handleTogglePause}
                className="p-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors shadow-xs"
                title={isAudioPaused ? 'Resume' : 'Pause'}
              >
                {isAudioPaused ? <Play className="w-4 h-4 text-[#1E60FF]" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                onClick={handleInterrupt}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm flex items-center gap-2"
              >
                <VolumeX className="w-4 h-4" />
                <span>Interrupt</span>
              </button>
              <button
                onClick={handleReplay}
                className="p-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors shadow-xs"
                title="Replay Response"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStartListening}
                className="px-6 py-2.5 rounded-xl bg-[#1E60FF] hover:bg-[#0052FF] text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-transform active:scale-95"
              >
                <Mic className="w-4 h-4" />
                <span>Tap to Speak</span>
              </button>

              {assistantReply && (
                <button
                  onClick={handleReplay}
                  className="p-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors shadow-xs"
                  title="Replay Response"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Quick switch to Chat link */}
        <div className="flex items-center justify-center">
          <button
            onClick={onSwitchToChat}
            className="text-[11px] font-semibold text-neutral-500 hover:text-[#1E60FF] flex items-center gap-1 transition-colors py-1"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Switch to Text Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
