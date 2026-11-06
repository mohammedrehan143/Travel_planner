import { getAdminSupabase } from '../db/supabase.js';

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: string;
  createdTrip?: any;
}

export interface StructuredTripMemory {
  destination?: string;
  origin?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  travelerCount?: number;
  travelCompanion?: string;
  travelStyle?: string;
  interests?: string[];
  dietaryPreference?: string;
  budget?: number;
  currency?: string;
  activeItinerary?: any;
  summary?: string;
  lastModified?: string;
}

export interface ConversationSession {
  conversationId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
  tripMemory: StructuredTripMemory;
  summary?: string;
}

// In-memory store guaranteeing persistent state across requests, local dev, and testing
const memorySessions = new Map<string, ConversationSession>();

export class ConversationMemoryService {
  /**
   * Retrieves or creates a conversation session.
   */
  static async getOrCreateSession(conversationId?: string, userId = '00000000-0000-0000-0000-000000000001'): Promise<ConversationSession> {
    const validId = conversationId && conversationId.trim().length > 0 ? conversationId.trim() : crypto.randomUUID();

    if (memorySessions.has(validId)) {
      const existing = memorySessions.get(validId)!;
      return existing;
    }

    // Try loading from Supabase if available
    try {
      const supabase = getAdminSupabase();
      const { data: conv } = await (supabase.from('conversations') as any)
        .select('*')
        .eq('id', validId)
        .single();

      if (conv) {
        const { data: msgs } = await (supabase.from('conversation_messages') as any)
          .select('*')
          .eq('conversation_id', validId)
          .order('created_at', { ascending: true });

        const session: ConversationSession = {
          conversationId: conv.id,
          userId: conv.user_id || userId,
          title: conv.title || 'Trip Planning Conversation',
          createdAt: conv.created_at || new Date().toISOString(),
          updatedAt: conv.updated_at || new Date().toISOString(),
          summary: conv.summary || undefined,
          tripMemory: conv.trip_memory || {},
          messages: (msgs || []).map((m: any) => ({
            id: m.id,
            conversationId: m.conversation_id,
            role: m.role,
            content: m.content,
            timestamp: m.created_at,
            action: m.action,
            createdTrip: m.metadata?.createdTrip
          }))
        };

        memorySessions.set(validId, session);
        return session;
      }
    } catch (e) {
      // Supabase unavailable in local dev / tests, proceed with memory session
    }

    // Initialize new session
    const newSession: ConversationSession = {
      conversationId: validId,
      userId,
      title: 'New Travel Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      tripMemory: {}
    };

    memorySessions.set(validId, newSession);

    // Save to Supabase asynchronously
    try {
      const supabase = getAdminSupabase();
      await (supabase.from('conversations') as any).insert({
        id: validId,
        user_id: userId,
        title: 'New Travel Conversation',
        trip_memory: {}
      });
    } catch (e) {
      // ignore
    }

    return newSession;
  }

  /**
   * Retrieves an existing session or null if not found.
   */
  static async getSession(conversationId: string, userId?: string): Promise<ConversationSession | null> {
    if (memorySessions.has(conversationId)) {
      const s = memorySessions.get(conversationId)!;
      if (!userId || s.userId === userId || userId === '00000000-0000-0000-0000-000000000001') {
        return s;
      }
    }
    return this.getOrCreateSession(conversationId, userId);
  }

  /**
   * Lists all conversation sessions belonging to a user.
   */
  static async listUserSessions(userId: string): Promise<Array<{ conversationId: string; title: string; updatedAt: string; messageCount: number; destination?: string }>> {
    const list: Array<{ conversationId: string; title: string; updatedAt: string; messageCount: number; destination?: string }> = [];

    for (const [id, session] of memorySessions.entries()) {
      if (session.userId === userId || userId === '00000000-0000-0000-0000-000000000001') {
        list.push({
          conversationId: id,
          title: session.title,
          updatedAt: session.updatedAt,
          messageCount: session.messages.length,
          destination: session.tripMemory.destination
        });
      }
    }

    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }

  /**
   * Records a user or assistant message to the persistent conversation session.
   */
  static async recordMessage(
    conversationId: string,
    message: {
      role: 'user' | 'assistant';
      content: string;
      action?: string;
      createdTrip?: any;
    },
    userId = '00000000-0000-0000-0000-000000000001'
  ): Promise<ConversationMessage> {
    const session = await this.getOrCreateSession(conversationId, userId);

    const msgId = crypto.randomUUID();
    const newMsg: ConversationMessage = {
      id: msgId,
      conversationId,
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
      action: message.action,
      createdTrip: message.createdTrip
    };

    session.messages.push(newMsg);
    session.updatedAt = new Date().toISOString();

    // Dynamically update conversation title based on first user query or destination
    if (session.title === 'New Travel Conversation' && message.role === 'user') {
      const cleanTitle = message.content.slice(0, 45).trim();
      session.title = cleanTitle.length > 0 ? cleanTitle : 'Trip Discussion';
    }

    // Summarize older messages if thread exceeds 14 messages
    if (session.messages.length > 14) {
      this.maintainRollingSummary(session);
    }

    // Persist to Supabase asynchronously
    try {
      const supabase = getAdminSupabase();
      await (supabase.from('conversation_messages') as any).insert({
        id: msgId,
        conversation_id: conversationId,
        user_id: userId,
        role: message.role,
        content: message.content,
        action: message.action || null,
        metadata: message.createdTrip ? { createdTrip: message.createdTrip } : {}
      });

      await (supabase.from('conversations') as any)
        .update({
          title: session.title,
          updated_at: session.updatedAt,
          trip_memory: session.tripMemory,
          summary: session.summary || null
        })
        .eq('id', conversationId);
    } catch (e) {
      // offline dev
    }

    return newMsg;
  }

  /**
   * Updates structured trip memory (e.g. destination, budget, itinerary)
   */
  static async updateTripMemory(
    conversationId: string,
    updates: Partial<StructuredTripMemory>,
    userId = '00000000-0000-0000-0000-000000000001'
  ): Promise<StructuredTripMemory> {
    const session = await this.getOrCreateSession(conversationId, userId);

    session.tripMemory = {
      ...session.tripMemory,
      ...updates,
      lastModified: new Date().toISOString()
    };

    if (updates.destination && session.title.includes('New Travel Conversation')) {
      session.title = `Trip to ${updates.destination}`;
    }

    session.updatedAt = new Date().toISOString();

    try {
      const supabase = getAdminSupabase();
      await (supabase.from('conversations') as any)
        .update({
          title: session.title,
          updated_at: session.updatedAt,
          trip_memory: session.tripMemory
        })
        .eq('id', conversationId);
    } catch (e) {
      // offline dev
    }

    return session.tripMemory;
  }

  /**
   * Summarizes older messages into rolling conversation summary to protect token window.
   */
  private static maintainRollingSummary(session: ConversationSession) {
    const olderSlice = session.messages.slice(0, session.messages.length - 8);
    const summaryLines: string[] = [];

    if (session.tripMemory.destination) {
      summaryLines.push(`Trip planned for ${session.tripMemory.destination} (${session.tripMemory.durationDays || 'multi'}-day).`);
    }
    if (session.tripMemory.budget) {
      summaryLines.push(`Budget: ${session.tripMemory.currency || 'INR'} ${session.tripMemory.budget}.`);
    }

    for (const msg of olderSlice) {
      if (msg.role === 'user') {
        summaryLines.push(`User asked: "${msg.content.slice(0, 80)}"`);
      }
    }

    session.summary = summaryLines.slice(-6).join(' ');
  }

  /**
   * Resolves contextual pronouns and references like "there", "the second day", "make it cheaper".
   */
  static resolveContextualReferences(
    userPrompt: string,
    session: ConversationSession
  ): {
    resolvedPrompt: string;
    isFollowUp: boolean;
    isModification: boolean;
    targetDayNumber?: number;
    newBudget?: number;
  } {
    let resolvedPrompt = userPrompt;
    const p = userPrompt.toLowerCase().trim();
    let isFollowUp = false;
    let isModification = false;
    let targetDayNumber: number | undefined;
    let newBudget: number | undefined;

    const currentDest = session.tripMemory.destination;

    // 1. Resolve destination pronouns: "there", "that place", "this destination", "the city"
    if (currentDest && /\b(?:there|that place|this destination|the city|that trip|the location)\b/i.test(p)) {
      resolvedPrompt = resolvedPrompt.replace(/\b(?:there|that place|this destination|the city)\b/gi, currentDest);
      isFollowUp = true;
    }

    // 2. Identify Day references: "day two", "second day", "day 2", "first day", "day 1", "last day"
    if (/\b(?:second day|day two|day 2)\b/i.test(p)) {
      targetDayNumber = 2;
      isFollowUp = true;
    } else if (/\b(?:first day|day one|day 1)\b/i.test(p)) {
      targetDayNumber = 1;
      isFollowUp = true;
    } else if (/\b(?:third day|day three|day 3)\b/i.test(p)) {
      targetDayNumber = 3;
      isFollowUp = true;
    } else if (/\b(?:last day)\b/i.test(p) && session.tripMemory.durationDays) {
      targetDayNumber = session.tripMemory.durationDays;
      isFollowUp = true;
    }

    // 3. Identify budget modification intent: "make it cheaper", "reduce budget to", "increase budget to"
    const budgetMatch = p.match(/(?:budget|cost|price|spend|under|to)\s*(?:of|is|to)?\s*[₹$€]?\s*(\d+(?:,\d+)*)/i);
    if (budgetMatch) {
      const val = Number(budgetMatch[1].replace(/,/g, ''));
      if (val > 0) {
        newBudget = val;
        isModification = true;
      }
    } else if (/\b(?:make\s+(?:it|the\s+trip|this)\s+cheaper|cheaper|reduce\s+(?:the\s+)?budget|lower\s+(?:the\s+)?budget|less\s+expensive|budget\s+friendly)\b/i.test(p)) {
      if (session.tripMemory.budget) {
        newBudget = Math.round(session.tripMemory.budget * 0.75);
      }
      isModification = true;
    }

    // 4. Identify itinerary activity modification: "remove last activity", "replace", "add activity", "change activity"
    if (/\b(?:remove|delete|replace|change|swap|drop|add)\b.*?\b(?:activity|sight|spot|museum|place|dinner|lunch|cafe)\b/i.test(p)) {
      isModification = true;
      isFollowUp = true;
    }

    return {
      resolvedPrompt,
      isFollowUp,
      isModification,
      targetDayNumber,
      newBudget
    };
  }

  /**
   * Prepares complete contextual bundle for LLM execution
   */
  static buildContextPayload(
    session: ConversationSession,
    userPrompt: string
  ): {
    resolvedPrompt: string;
    context: Record<string, unknown>;
    recentHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    const { resolvedPrompt, isFollowUp, isModification, targetDayNumber, newBudget } = this.resolveContextualReferences(userPrompt, session);

    // Recent 6 messages for LLM conversational awareness
    const recentHistory = session.messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content
    }));

    // Active itinerary summary
    let itineraryBrief = '';
    if (session.tripMemory.activeItinerary?.days) {
      itineraryBrief = session.tripMemory.activeItinerary.days.map((d: any) => {
        const acts = (d.activities || []).map((a: any) => a.title).join(', ');
        return `Day ${d.dayNumber || d.day_number}: ${d.theme || ''} [${acts}]`;
      }).join(' | ');
    }

    const context: Record<string, unknown> = {
      conversationId: session.conversationId,
      destination: session.tripMemory.destination || 'Global Destinations',
      origin: session.tripMemory.origin || 'User Location',
      dates: session.tripMemory.startDate && session.tripMemory.endDate
        ? `${session.tripMemory.startDate} to ${session.tripMemory.endDate}`
        : 'Upcoming',
      durationDays: session.tripMemory.durationDays || 3,
      travelerCount: session.tripMemory.travelerCount || 2,
      travelStyle: session.tripMemory.travelStyle || 'balanced',
      interests: session.tripMemory.interests || ['sightseeing'],
      budget: newBudget || session.tripMemory.budget || 20000,
      currency: session.tripMemory.currency || 'INR',
      targetDayNumber,
      isFollowUp,
      isModification,
      conversationSummary: session.summary,
      recentItineraryBrief: itineraryBrief || undefined,
      activeItinerary: session.tripMemory.activeItinerary
    };

    return {
      resolvedPrompt,
      context,
      recentHistory
    };
  }
}
