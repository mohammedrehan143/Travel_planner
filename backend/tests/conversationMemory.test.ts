import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { ConversationMemoryService } from '../src/services/conversationMemory.service.js';

const app = createApp();

describe('Context-Aware Conversational Memory Suite', () => {
  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    // Fresh setup if needed
  });

  describe('ConversationMemoryService Unit Operations', () => {
    it('creates and retrieves a new conversation session', async () => {
      const convId = `test-conv-${Date.now()}`;
      const session = await ConversationMemoryService.getOrCreateSession(convId, TEST_USER_ID);

      expect(session).toBeDefined();
      expect(session.conversationId).toBe(convId);
      expect(session.userId).toBe(TEST_USER_ID);
      expect(session.messages).toEqual([]);
      expect(session.tripMemory).toEqual({});
    });

    it('records user and assistant messages in order with timestamps', async () => {
      const convId = `test-conv-msgs-${Date.now()}`;
      await ConversationMemoryService.recordMessage(convId, {
        role: 'user',
        content: 'Plan a 3-day trip to Manali'
      }, TEST_USER_ID);

      await ConversationMemoryService.recordMessage(convId, {
        role: 'assistant',
        content: 'I have designed your 3-day trip to Manali!'
      }, TEST_USER_ID);

      const session = await ConversationMemoryService.getSession(convId, TEST_USER_ID);
      expect(session?.messages).toHaveLength(2);
      expect(session?.messages[0].role).toBe('user');
      expect(session?.messages[0].content).toBe('Plan a 3-day trip to Manali');
      expect(session?.messages[1].role).toBe('assistant');
      expect(session?.messages[1].content).toContain('3-day trip to Manali');
    });

    it('resolves contextual reference "there" to active trip destination', async () => {
      const convId = `test-conv-ref-${Date.now()}`;
      await ConversationMemoryService.updateTripMemory(convId, {
        destination: 'Manali',
        durationDays: 3,
        budget: 20000
      }, TEST_USER_ID);

      const session = await ConversationMemoryService.getSession(convId, TEST_USER_ID);
      expect(session).toBeDefined();

      const { resolvedPrompt, isFollowUp } = ConversationMemoryService.resolveContextualReferences(
        'What is the weather there?',
        session!
      );

      expect(isFollowUp).toBe(true);
      expect(resolvedPrompt.toLowerCase()).toContain('manali');
    });

    it('resolves day reference "second day" or "day two"', async () => {
      const convId = `test-conv-day-${Date.now()}`;
      await ConversationMemoryService.updateTripMemory(convId, {
        destination: 'Manali',
        durationDays: 3
      }, TEST_USER_ID);

      const session = await ConversationMemoryService.getSession(convId, TEST_USER_ID);
      const res = ConversationMemoryService.resolveContextualReferences(
        'What about the second day?',
        session!
      );

      expect(res.isFollowUp).toBe(true);
      expect(res.targetDayNumber).toBe(2);
    });

    it('resolves budget modification "make it cheaper"', async () => {
      const convId = `test-conv-budget-${Date.now()}`;
      await ConversationMemoryService.updateTripMemory(convId, {
        destination: 'Manali',
        budget: 20000
      }, TEST_USER_ID);

      const session = await ConversationMemoryService.getSession(convId, TEST_USER_ID);
      const res = ConversationMemoryService.resolveContextualReferences(
        'Make the trip cheaper',
        session!
      );

      expect(res.isModification).toBe(true);
      expect(res.newBudget).toBe(15000); // 75% of 20000
    });

    it('resolves activity removal "remove the last activity"', async () => {
      const convId = `test-conv-remove-${Date.now()}`;
      await ConversationMemoryService.updateTripMemory(convId, {
        destination: 'Manali',
        durationDays: 3
      }, TEST_USER_ID);

      const session = await ConversationMemoryService.getSession(convId, TEST_USER_ID);
      const res = ConversationMemoryService.resolveContextualReferences(
        'Remove the last activity',
        session!
      );

      expect(res.isModification).toBe(true);
      expect(res.isFollowUp).toBe(true);
    });
  });

  describe('Multi-Turn Conversational Memory REST API Flow', () => {
    const multiTurnConvId = `multi-turn-${Date.now()}`;

    it('Turn 1: User asks to plan a trip to Manali', async () => {
      const res = await request(app)
        .post('/api/agent/chat')
        .send({
          conversationId: multiTurnConvId,
          message: 'Plan a 3-day trip to Manali'
        })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.conversationId).toBe(multiTurnConvId);
      expect(res.body.action).toBe('plan_new_trip');
      expect(res.body.tripMemory).toBeDefined();
      expect(res.body.tripMemory.destination).toBe('Manali');
    });

    it('Turn 2: User asks "What is the weather there?" and Pilot remembers Manali', async () => {
      const res = await request(app)
        .post('/api/agent/chat')
        .send({
          conversationId: multiTurnConvId,
          message: 'What is the weather there?'
        })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.action).toBe('chat');
      // Must refer to Manali or Himalayan mountain weather
      expect(res.body.message.toLowerCase()).toMatch(/manali|himalayan|mountain/);
    });

    it('Turn 3: User asks "What about the second day?" and Pilot references Day 2 of Manali', async () => {
      const res = await request(app)
        .post('/api/agent/chat')
        .send({
          conversationId: multiTurnConvId,
          message: 'What about the second day?'
        })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.action).toBe('chat');
      expect(res.body.message).toMatch(/Day 2|second day|Solang/i);
    });

    it('Turn 4: User asks "Make the trip cheaper" and Pilot lowers the budget', async () => {
      const res = await request(app)
        .post('/api/agent/chat')
        .send({
          conversationId: multiTurnConvId,
          message: 'Make the trip cheaper'
        })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.action).toBe('chat');
      expect(res.body.message.toLowerCase()).toMatch(/budget|adjusted|cheaper|recalibrated/);
    });

    it('Turn 5: User asks "Remove the last activity" and Pilot updates the plan', async () => {
      const res = await request(app)
        .post('/api/agent/chat')
        .send({
          conversationId: multiTurnConvId,
          message: 'Remove the last activity'
        })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.action).toBe('chat');
      expect(res.body.message.toLowerCase()).toMatch(/removed the activity|updated your itinerary/);
    });

    it('retrieves full conversation history via GET /api/agent/conversations/:id', async () => {
      const res = await request(app)
        .get(`/api/agent/conversations/${multiTurnConvId}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.conversation).toBeDefined();
      expect(res.body.conversation.conversationId).toBe(multiTurnConvId);
      // Turn 1..5 produced 5 user messages and 5 assistant messages = 10 messages
      expect(res.body.conversation.messages.length).toBeGreaterThanOrEqual(5);
      expect(res.body.conversation.tripMemory.destination).toBe('Manali');
    });

    it('lists user conversation sessions via GET /api/agent/conversations', async () => {
      const res = await request(app)
        .get('/api/agent/conversations')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.conversations)).toBe(true);
      const found = res.body.conversations.find((c: any) => c.conversationId === multiTurnConvId);
      expect(found).toBeDefined();
      expect(found.destination).toBe('Manali');
    });

    it('creates a fresh conversation session via POST /api/agent/conversations', async () => {
      const res = await request(app)
        .post('/api/agent/conversations')
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.conversation.conversationId).toBeDefined();
      expect(res.body.conversation.messages).toEqual([]);
      expect(res.body.conversation.tripMemory).toEqual({});
    });
  });
});
