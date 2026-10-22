import { getAdminSupabase } from '../db/supabase.js';
import { AgentLogEntry } from '../types/trip.types.js';

interface MemoryAgentRun {
  id: string;
  trip_id: string | null;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_step: string;
  progress_percent: number;
  input_params: any;
  logs: AgentLogEntry[];
  result: any | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// In-memory registry to support local offline testing and fast polling
const memoryRuns = new Map<string, MemoryAgentRun>();

export class AgentRunService {
  /**
   * Create a new agent run record
   */
  static async createRun(userId: string, inputParams: any, tripId?: string): Promise<string> {
    const runId = crypto.randomUUID();
    const newRun: MemoryAgentRun = {
      id: runId,
      trip_id: tripId || null,
      user_id: userId,
      status: 'running',
      current_step: 'initialized',
      progress_percent: 5,
      input_params: inputParams,
      logs: [
        {
          timestamp: new Date().toISOString(),
          step: 'initialized',
          message: 'Agent run created and planning initialized.'
        }
      ],
      result: null,
      error_message: null,
      started_at: new Date().toISOString(),
      completed_at: null
    };

    memoryRuns.set(runId, newRun);

    try {
      const supabase = getAdminSupabase();
      await (supabase.from('agent_runs') as any).insert({
        id: runId,
        user_id: userId,
        trip_id: tripId || null,
        status: 'running',
        current_step: 'initialized',
        progress_percent: 5,
        input_params: inputParams,
        logs: newRun.logs as any
      });
    } catch {
      // In-memory fallback
    }

    return runId;
  }

  /**
   * Update progress percentage and step logs
   */
  static async updateProgress(
    runId: string,
    currentStep: string,
    progressPercent: number,
    logs: AgentLogEntry[]
  ): Promise<void> {
    const memRun = memoryRuns.get(runId);
    if (memRun) {
      memRun.current_step = currentStep;
      memRun.progress_percent = progressPercent;
      memRun.logs = [...logs];
    }

    try {
      const supabase = getAdminSupabase();
      await (supabase.from('agent_runs') as any)
        .update({
          current_step: currentStep,
          progress_percent: progressPercent,
          logs: logs as any
        })
        .eq('id', runId);
    } catch {
      // Ignore DB errors during live agent loop
    }
  }

  /**
   * Mark run as successfully completed
   */
  static async markCompleted(runId: string, result: any): Promise<void> {
    const completedAt = new Date().toISOString();
    const memRun = memoryRuns.get(runId);
    if (memRun) {
      memRun.status = 'completed';
      memRun.progress_percent = 100;
      memRun.current_step = 'completed';
      memRun.result = result;
      memRun.completed_at = completedAt;
    }

    try {
      const supabase = getAdminSupabase();
      await (supabase.from('agent_runs') as any)
        .update({
          status: 'completed',
          current_step: 'completed',
          progress_percent: 100,
          result,
          completed_at: completedAt
        })
        .eq('id', runId);
    } catch {
      // Fallback
    }
  }

  /**
   * Mark run as failed
   */
  static async markFailed(runId: string, errorMessage: string, logs: AgentLogEntry[]): Promise<void> {
    const completedAt = new Date().toISOString();
    const memRun = memoryRuns.get(runId);
    if (memRun) {
      memRun.status = 'failed';
      memRun.current_step = 'error';
      memRun.error_message = errorMessage;
      memRun.completed_at = completedAt;
      memRun.logs = logs;
    }

    try {
      const supabase = getAdminSupabase();
      await (supabase.from('agent_runs') as any)
        .update({
          status: 'failed',
          current_step: 'error',
          error_message: errorMessage,
          completed_at: completedAt,
          logs: logs as any
        })
        .eq('id', runId);
    } catch {
      // Fallback
    }
  }

  /**
   * Retrieve current run status and logs
   */
  static async getRun(runId: string): Promise<MemoryAgentRun | null> {
    if (memoryRuns.has(runId)) {
      return memoryRuns.get(runId)!;
    }

    try {
      const supabase = getAdminSupabase();
      const { data, error } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (data && !error) {
        return data as any;
      }
    } catch {
      // Fallback
    }

    return null;
  }
}
