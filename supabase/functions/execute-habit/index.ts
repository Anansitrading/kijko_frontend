/**
 * Supabase Edge Function: execute-habit
 * Executes a scheduled habit by running its associated skill
 *
 * Task 3_1: Habits Implementation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.71.2';

// =============================================================================
// Types
// =============================================================================

interface HabitExecutionRequest {
  habitId?: string;
  executionId?: string;
  // Support for batch processing
  processPending?: boolean;
}

interface Skill {
  id: string;
  name: string;
  prompt_template: string;
  model: string;
  parameters: {
    temperature?: number;
    max_tokens?: number;
  };
}

interface Habit {
  id: string;
  skill_id: string;
  user_id: string;
  config: Record<string, unknown>;
}

interface SkillExecution {
  id: string;
  skill_id: string;
  reference_id: string;
  input: Record<string, unknown>;
  status: string;
}

// =============================================================================
// Configuration
// =============================================================================

const ALLOWED_ORIGINS = [
  'https://app.kijko.nl',
  'http://localhost:1420',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Interpolate variables in prompt template
 */
function interpolatePrompt(template: string, variables: Record<string, unknown>): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(pattern, String(value ?? ''));
  }

  return result;
}

/**
 * Execute a skill using the AI model
 */
async function executeSkill(
  skill: Skill,
  input: Record<string, unknown>,
  anthropicApiKey: string
): Promise<{
  output: string;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
}> {
  const startTime = Date.now();

  // Interpolate the prompt
  const prompt = interpolatePrompt(skill.prompt_template, input);

  // Initialize Anthropic client
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  // Call the AI model
  const response = await anthropic.messages.create({
    model: skill.model || 'claude-3-5-sonnet-20241022',
    max_tokens: skill.parameters?.max_tokens || 4096,
    temperature: skill.parameters?.temperature ?? 1,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const durationMs = Date.now() - startTime;

  // Extract text content from response
  const output = response.content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  return {
    output,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    promptTokens: response.usage.input_tokens,
    completionTokens: response.usage.output_tokens,
    durationMs,
  };
}

// =============================================================================
// Main Handler
// =============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!anthropicApiKey) {
      throw new Error('Missing Anthropic API key');
    }

    // Initialize Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: HabitExecutionRequest = await req.json();

    // Mode 1: Execute a specific execution (called by cron/scheduler)
    if (body.executionId) {
      const result = await executeByExecutionId(
        supabase,
        body.executionId,
        anthropicApiKey
      );

      return new Response(JSON.stringify(result), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Mode 2: Execute a specific habit immediately (manual trigger)
    if (body.habitId) {
      const result = await executeHabitNow(
        supabase,
        body.habitId,
        anthropicApiKey
      );

      return new Response(JSON.stringify(result), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Mode 3: Process all pending executions (batch mode)
    if (body.processPending) {
      const results = await processPendingExecutions(supabase, anthropicApiKey);

      return new Response(JSON.stringify({ processed: results.length, results }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Invalid request
    return new Response(
      JSON.stringify({ error: 'Invalid request. Provide habitId, executionId, or processPending.' }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  } catch (error) {
    console.error('Edge Function Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// =============================================================================
// Execution Functions
// =============================================================================

/**
 * Execute by existing execution ID (for pending executions)
 */
async function executeByExecutionId(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
  anthropicApiKey: string
): Promise<{ success: boolean; executionId: string; error?: string }> {
  // Get execution record
  const { data: execution, error: execError } = await supabase
    .from('skill_executions')
    .select('*, skills(*)')
    .eq('id', executionId)
    .single();

  if (execError || !execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }

  if (execution.status !== 'pending') {
    return { success: true, executionId, error: 'Execution already processed' };
  }

  // Mark as running
  await supabase
    .from('skill_executions')
    .update({ status: 'running' })
    .eq('id', executionId);

  try {
    // Execute the skill
    const result = await executeSkill(
      execution.skills as Skill,
      execution.input || {},
      anthropicApiKey
    );

    // Update execution as completed
    await supabase.rpc('complete_habit_execution', {
      p_execution_id: executionId,
      p_status: 'completed',
      p_output: result.output,
      p_tokens_used: result.tokensUsed,
      p_duration_ms: result.durationMs,
      p_error_message: null,
    });

    return { success: true, executionId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update execution as failed
    await supabase.rpc('complete_habit_execution', {
      p_execution_id: executionId,
      p_status: 'failed',
      p_output: null,
      p_tokens_used: null,
      p_duration_ms: null,
      p_error_message: errorMessage,
    });

    return { success: false, executionId, error: errorMessage };
  }
}

/**
 * Execute a habit immediately (manual trigger)
 */
async function executeHabitNow(
  supabase: ReturnType<typeof createClient>,
  habitId: string,
  anthropicApiKey: string
): Promise<{ success: boolean; executionId: string; error?: string }> {
  // Get habit and skill
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('*, skills(*)')
    .eq('id', habitId)
    .single();

  if (habitError || !habit) {
    throw new Error(`Habit not found: ${habitId}`);
  }

  // Create execution record
  const { data: execution, error: execError } = await supabase
    .from('skill_executions')
    .insert({
      skill_id: habit.skill_id,
      user_id: habit.user_id,
      execution_type: 'habit',
      reference_id: habitId,
      input: habit.config,
      status: 'running',
      executed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (execError || !execution) {
    throw new Error('Failed to create execution record');
  }

  try {
    // Execute the skill
    const result = await executeSkill(
      habit.skills as Skill,
      habit.config || {},
      anthropicApiKey
    );

    // Update execution as completed
    await supabase.rpc('complete_habit_execution', {
      p_execution_id: execution.id,
      p_status: 'completed',
      p_output: result.output,
      p_tokens_used: result.tokensUsed,
      p_duration_ms: result.durationMs,
      p_error_message: null,
    });

    // Update habit run count
    await supabase
      .from('habits')
      .update({
        last_run_at: new Date().toISOString(),
        run_count: habit.run_count + 1,
      })
      .eq('id', habitId);

    return { success: true, executionId: execution.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update execution as failed
    await supabase.rpc('complete_habit_execution', {
      p_execution_id: execution.id,
      p_status: 'failed',
      p_output: null,
      p_tokens_used: null,
      p_duration_ms: null,
      p_error_message: errorMessage,
    });

    return { success: false, executionId: execution.id, error: errorMessage };
  }
}

/**
 * Process all pending executions (batch mode for cron)
 */
async function processPendingExecutions(
  supabase: ReturnType<typeof createClient>,
  anthropicApiKey: string
): Promise<{ executionId: string; success: boolean; error?: string }[]> {
  // Get pending executions
  const { data: executions, error } = await supabase
    .from('skill_executions')
    .select('id')
    .eq('status', 'pending')
    .eq('execution_type', 'habit')
    .order('executed_at', { ascending: true })
    .limit(10);

  if (error || !executions) {
    console.error('Failed to fetch pending executions:', error);
    return [];
  }

  // Process each execution
  const results: { executionId: string; success: boolean; error?: string }[] = [];

  for (const exec of executions) {
    const result = await executeByExecutionId(supabase, exec.id, anthropicApiKey);
    results.push(result);
  }

  return results;
}
