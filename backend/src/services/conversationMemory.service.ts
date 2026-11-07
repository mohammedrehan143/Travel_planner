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
   * Retrieves or creates a lightweight in-memory conversation session.
   * Prioritizes in-memory active chat state without querying the database for every turn.
   */
  static async getOrCreateSession(
    conversationId?: string,
    userId = '00000000-0000-0000-0000-000000000001',
    recentMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<ConversationSession> {
    const validId = conversationId && conversationId.trim().length > 0 ? conversationId.trim() : crypto.randomUUID();

    if (memorySessions.has(validId)) {
      const existing = memorySessions.get(validId)!;
      // If the session belongs to a different user, isolate by generating a fresh session ID
      if (userId && existing.userId && existing.userId !== userId) {
        const freshId = crypto.randomUUID();
        return this.getOrCreateSession(freshId, userId, recentMessages);
      }
      if (recentMessages && recentMessages.length > 0) {
        this.syncRecentInChatMessages(existing, recentMessages);
      }
      return existing;
    }

    // Fast in-memory session initialization if client provided active messages (No DB lookup needed!)
    if (recentMessages && recentMessages.length > 0) {
      const inMemorySession: ConversationSession = {
        conversationId: validId,
        userId,
        title: 'Active Travel Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: recentMessages.map((m) => ({
          id: crypto.randomUUID(),
          conversationId: validId,
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
        })),
        tripMemory: {},
      };
      this.inferTripMemoryFromMessages(inMemorySession);
      memorySessions.set(validId, inMemorySession);
      return inMemorySession;
    }

    // Only query database when loading persistent history across sessions/refreshes
    try {
      const supabase = getAdminSupabase();
      const { data: conv } = await (supabase.from('conversations') as any)
        .select('*')
        .eq('id', validId)
        .single();

      if (conv) {
        if (userId && conv.user_id && conv.user_id !== userId) {
          const freshId = crypto.randomUUID();
          return this.getOrCreateSession(freshId, userId, recentMessages);
        }

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
            createdTrip: m.metadata?.createdTrip,
          })),
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
      tripMemory: {},
    };

    memorySessions.set(validId, newSession);
    return newSession;
  }

  /**
   * Fast in-memory sync of messages supplied by the frontend state.
   */
  static syncRecentInChatMessages(
    session: ConversationSession,
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ) {
    if (!recentMessages || recentMessages.length === 0) return;

    for (const m of recentMessages) {
      const alreadyExists = session.messages.some((em) => em.role === m.role && em.content === m.content);
      if (!alreadyExists) {
        session.messages.push({
          id: crypto.randomUUID(),
          conversationId: session.conversationId,
          role: m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
        });
      }
    }
    this.inferTripMemoryFromMessages(session);
  }

  /**
   * Infers structured trip memory (destination, days, budget) from in-memory conversation messages
   */
  static inferTripMemoryFromMessages(session: ConversationSession) {
    if (!session.tripMemory.destination) {
      for (let i = session.messages.length - 1; i >= 0; i--) {
        const msg = session.messages[i].content;
        const destMatch = msg.match(/\b(Manali|Goa|Coorg|Paris|Tokyo|Dubai|Jaipur|Rajasthan|Ooty|Shimla|Kashmir)\b/i);
        if (destMatch) {
          session.tripMemory.destination = destMatch[1];
          break;
        }
      }
    }

    if (!session.tripMemory.durationDays) {
      for (let i = session.messages.length - 1; i >= 0; i--) {
        const dayMatch = session.messages[i].content.match(/(\d+)\s*[- ]*(?:day|night)/i);
        if (dayMatch) {
          session.tripMemory.durationDays = parseInt(dayMatch[1], 10);
          break;
        }
      }
    }
  }

  /**
   * Retrieves an existing session or null if not found.
   */
  static async getSession(conversationId: string, userId?: string): Promise<ConversationSession | null> {
    if (memorySessions.has(conversationId)) {
      const s = memorySessions.get(conversationId)!;
      if (userId && s.userId && s.userId !== userId) {
        return null;
      }
      return s;
    }

    try {
      const supabase = getAdminSupabase();
      let query = (supabase.from('conversations') as any).select('*').eq('id', conversationId);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data: conv } = await query.single();

      if (conv) {
        if (userId && conv.user_id && conv.user_id !== userId) {
          return null;
        }

        const { data: msgs } = await (supabase.from('conversation_messages') as any)
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        const session: ConversationSession = {
          conversationId: conv.id,
          userId: conv.user_id || userId || '00000000-0000-0000-0000-000000000001',
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
            createdTrip: m.metadata?.createdTrip,
          })),
        };

        memorySessions.set(conversationId, session);
        return session;
      }
    } catch (e) {
      // Supabase unavailable in local dev / tests
    }

    return null;
  }

  /**
   * Lists all conversation sessions belonging to a specific user.
   */
  static async listUserSessions(userId: string): Promise<Array<{ conversationId: string; title: string; updatedAt: string; messageCount: number; destination?: string }>> {
    const list: Array<{ conversationId: string; title: string; updatedAt: string; messageCount: number; destination?: string }> = [];

    for (const [id, session] of memorySessions.entries()) {
      if (session.userId === userId) {
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
   * Clears in-memory sessions belonging to a specific user.
   */
  static clearUserSessions(userId: string): void {
    for (const [id, session] of memorySessions.entries()) {
      if (session.userId === userId) {
        memorySessions.delete(id);
      }
    }
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

    let currentDest = session.tripMemory.destination;
    if (!currentDest) {
      this.inferTripMemoryFromMessages(session);
      currentDest = session.tripMemory.destination;
    }

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
   * Prepares complete contextual bundle for LLM execution with configurable history window and rolling summary
   */
  static buildContextPayload(
    session: ConversationSession,
    userPrompt: string,
    historyWindowSize = 6
  ): {
    resolvedPrompt: string;
    context: Record<string, unknown>;
    recentHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    const { resolvedPrompt, isFollowUp, isModification, targetDayNumber, newBudget } = this.resolveContextualReferences(userPrompt, session);

    // Limit recent history sent to LLM to the configurable recent-message window
    const recentHistory = session.messages.slice(-historyWindowSize).map((m) => ({
      role: m.role,
      content: m.content
    }));

    // Trigger rolling summary when total conversation length exceeds the history window
    if (session.messages.length > historyWindowSize) {
      this.maintainRollingSummary(session);
    }

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
