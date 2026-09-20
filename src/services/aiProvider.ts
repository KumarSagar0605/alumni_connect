// @ts-nocheck
/**
 * Multi-Provider AI Fallback Pipeline
 * Primary: Gemini → Fallback: Groq → Safety Net: OpenRouter
 *
 * All providers return structured JSON via a unified interface.
 */

import { GoogleGenAI } from '@google/genai';

// ============================================================
// PROVIDER CONFIG
// ============================================================

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

const genai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const GEMINI_MODEL = 'gemini-3.6-flash';
const GROQ_MODEL = 'openai/gpt-oss-120b';
const OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

// ============================================================
// JSON SANITIZER
// ============================================================

/**
 * Extracts a balanced JSON object or array from raw model output.
 * Handles models that wrap JSON in markdown fences or append trailing text.
 */
function extractJsonString(raw: string): string {
  let cleaned = raw.trim();

  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // Find the first { or [
  const startObj = cleaned.indexOf('{');
  const startArr = cleaned.indexOf('[');
  let start: number;
  let openChar: string;
  let closeChar: string;

  if (startObj === -1 && startArr === -1) throw new Error('No JSON found in AI response.');

  if (startObj === -1) { start = startArr; openChar = '['; closeChar = ']'; }
  else if (startArr === -1) { start = startObj; openChar = '{'; closeChar = '}'; }
  else if (startObj < startArr) { start = startObj; openChar = '{'; closeChar = '}'; }
  else { start = startArr; openChar = '['; closeChar = ']'; }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === openChar || (openChar === '{' && ch === '{') || (openChar === '[' && ch === '[')) {
      if (ch === '{' || ch === '[') depth++;
    }
    if (ch === closeChar || (closeChar === '}' && ch === '}') || (closeChar === ']' && ch === ']')) {
      if (ch === '}' || ch === ']') depth--;
    }

    if (depth === 0 && i > start) {
      return cleaned.slice(start, i + 1);
    }
  }

  // Fallback: return everything from start (may still fail parse)
  return cleaned.slice(start);
}

/**
 * Strips markdown fences, extracts balanced JSON, and parses it.
 */
export function cleanAndParseJson<T = any>(rawText: string): T {
  const jsonStr = extractJsonString(rawText);
  return JSON.parse(jsonStr) as T;
}

// ============================================================
// PROVIDER: GEMINI
// ============================================================

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!genai) throw new Error('Gemini API key not configured.');

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  const response = await genai.models.generateContent({
    model: GEMINI_MODEL,
    contents: fullPrompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 16384,
    },
  });

  return response.text || '';
}

// ============================================================
// PROVIDER: GROQ (OpenAI-compatible)
// ============================================================

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!GROQ_KEY) throw new Error('Groq API key not configured.');

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt + '\n\nIMPORTANT: Output ONLY raw valid JSON. No markdown, no code fences, no explanation, no text before or after. Just the JSON.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 16384,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ============================================================
// PROVIDER: OPENROUTER (OpenAI-compatible)
// ============================================================

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENROUTER_KEY) throw new Error('OpenRouter API key not configured.');

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'CIA Campus Platform',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt + '\n\nIMPORTANT: Output ONLY raw valid JSON. No markdown, no code fences, no explanation, no text before or after. Just the JSON.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 16384,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenRouter API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ============================================================
// UNIFIED EXECUTOR: Gemini → Groq → OpenRouter
// ============================================================

interface ProviderError {
  provider: string;
  message: string;
}

/**
 * Call a provider with retries on transient / parse errors.
 */
async function callWithRetry(
  name: string,
  fn: () => Promise<string>,
  retries = 2
): Promise<string> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const raw = await fn();
      if (!raw.trim()) throw new Error('Empty response.');
      // Validate JSON before returning
      cleanAndParseJson(raw);
      return raw;
    } catch (err: any) {
      lastErr = err;
      const msg = err.message || String(err);
      console.warn(`[AI Fallback] ${name} attempt ${attempt + 1} failed: ${msg}`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

/**
 * Execute a structured JSON completion across the fallback chain.
 * Returns the raw text response from whichever provider succeeds.
 */
export async function executeJsonCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const errors: ProviderError[] = [];

  // Provider 1: Gemini
  try {
    return await callWithRetry('Gemini', () => callGemini(systemPrompt, userPrompt));
  } catch (err: any) {
    const msg = err.message || String(err);
    console.warn(`[AI Fallback] Gemini failed: ${msg}`);
    errors.push({ provider: 'Gemini', message: msg });
  }

  // Provider 2: Groq
  try {
    return await callWithRetry('Groq', () => callGroq(systemPrompt, userPrompt));
  } catch (err: any) {
    const msg = err.message || String(err);
    console.warn(`[AI Fallback] Groq failed: ${msg}`);
    errors.push({ provider: 'Groq', message: msg });
  }

  // Provider 3: OpenRouter (only if key exists)
  if (OPENROUTER_KEY) {
    try {
      return await callWithRetry('OpenRouter', () => callOpenRouter(systemPrompt, userPrompt));
    } catch (err: any) {
      const msg = err.message || String(err);
      console.warn(`[AI Fallback] OpenRouter failed: ${msg}`);
      errors.push({ provider: 'OpenRouter', message: msg });
    }
  }

  // All providers failed
  const summary = errors.map((e) => `${e.provider}: ${e.message}`).join(' | ');
  throw new Error(`All AI providers failed. ${summary}`);
}
