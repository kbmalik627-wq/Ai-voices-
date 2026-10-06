import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const VOICE_MAPPING: Record<string, { voiceName: string; styleDescription: string }> = {
  amina: {
    voiceName: 'Kore',
    styleDescription: 'Clear, gentle, dignified and warm female voice. Natural pronunciation for Urdu and English narration.',
  },
  zayan: {
    voiceName: 'Charon',
    styleDescription: 'Deep, respectful, confident and resonant masculine voice with clear Urdu and English diction.',
  },
  sara: {
    voiceName: 'Puck',
    styleDescription: 'Young, cheerful, polite and melodious young female voice.',
  },
  bilal: {
    voiceName: 'Charon',
    styleDescription: 'Solemn, deep baritone, eloquent and spiritual voice for recitation and poetic narration.',
  },
  fatima: {
    voiceName: 'Aoede',
    styleDescription: 'Warm, caring, motherly and soothing storyteller voice for lessons and literature.',
  },
  hamza: {
    voiceName: 'Zephyr',
    styleDescription: 'Dynamic, energetic, crisp modern broadcaster and podcaster voice.',
  },
  areeba: {
    voiceName: 'Kore',
    styleDescription: 'Sophisticated, pleasant, crystal-clear commercial and instructional host.',
  },
  tariq: {
    voiceName: 'Fenrir',
    styleDescription: 'Authoritative, calm, wise documentary and history narrator.',
  },
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return true;
  }

  // GET /api/health
  if (url === '/api/health' && req.method === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    sendJson(res, 200, {
      status: 'ok',
      hasApiKey: hasKey,
      voices: Object.keys(VOICE_MAPPING),
    });
    return true;
  }

  // POST /api/tts
  if (url === '/api/tts' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const { text, voiceId = 'nova', style } = JSON.parse(raw || '{}');

      if (!text || typeof text !== 'string' || !text.trim()) {
        sendJson(res, 400, { error: 'Text prompt is required' });
        return true;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        sendJson(res, 200, {
          fallback: true,
          message: 'No GEMINI_API_KEY configured; fallback to Web Audio Studio engine',
        });
        return true;
      }

      const ai = new GoogleGenAI({ apiKey });
      const config = VOICE_MAPPING[voiceId] || VOICE_MAPPING.amina;
      const effectiveStyle = style || config.styleDescription;

      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 800), // safe limit for real-time speech clip
                speechMetadata: {
                  style: effectiveStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: config.voiceName },
            },
          },
        },
      });

      const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!audioBase64) {
        sendJson(res, 200, {
          fallback: true,
          message: 'Model did not return audio data; fallback to Web Audio Studio engine',
        });
        return true;
      }

      sendJson(res, 200, {
        success: true,
        audioBase64,
        mimeType: 'audio/wav',
        provider: 'gemini',
        voiceId,
      });
      return true;
    } catch (err: unknown) {
      console.error('TTS error:', err);
      const message = err instanceof Error ? err.message : 'TTS generation error';
      sendJson(res, 200, {
        fallback: true,
        error: message,
      });
      return true;
    }
  }

  // POST /api/enhance-script
  if (url === '/api/enhance-script' && req.method === 'POST') {
    try {
      const raw = await readBody(req);
      const { script, tone = 'punchy' } = JSON.parse(raw || '{}');

      if (!script || typeof script !== 'string') {
        sendJson(res, 400, { error: 'Script text is required' });
        return true;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        // High quality heuristic polish if no key
        let polished = script.trim();
        if (tone === 'punchy') {
          polished = `Attention: ${script.replace(/\s+/g, ' ').trim()} Don't wait. Experience the future now!`;
        } else if (tone === 'dramatic') {
          polished = `In a world of noise... ${script.trim()} Listen closely. Everything changes today.`;
        } else if (tone === 'podcast') {
          polished = `Hey everyone, welcome back! ${script.trim()} Let's dive right in.`;
        } else if (tone === 'calm') {
          polished = `Take a deep breath. Relax your shoulders. ${script.trim()} Be present in this moment.`;
        }
        sendJson(res, 200, { enhancedScript: polished, provider: 'local' });
        return true;
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an award-winning voiceover script director. Rewrite and polish this voiceover script to make it sound compelling, natural to speak aloud, and styled for "${tone}". 
Keep the core message intact.
Do NOT output explanations, introductory text, or markdown quotes. Return ONLY the revised voice script:

Original text:
${script}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const enhancedScript = aiResponse.text?.trim() || script;
      sendJson(res, 200, { enhancedScript, provider: 'gemini' });
      return true;
    } catch (err: unknown) {
      console.error('Enhance script error:', err);
      sendJson(res, 500, { error: 'Script enhancement failed' });
      return true;
    }
  }

  return false;
}
