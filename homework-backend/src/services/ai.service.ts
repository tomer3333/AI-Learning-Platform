import { GoogleGenAI, Type, Schema } from '@google/genai';
import { BadRequestError, ServiceUnavailableError } from '../utils/errors';
import { buildHomeworkGenerationPrompt } from '../prompts/homeworkPrompt';

// ─── Shared Interfaces ────────────────────────────────────────────────────────

export interface ExtractedVocabularyItem {
  arabic_phonetic: string;
  hebrew_definition: string;
}

export interface FillInTheBlankQuestion {
  context_sentence: string;   // In Arabic/transliteration — NEVER Hebrew
  missing_word: string;
  hebrew_translation: string;
}

export interface FillInTheBlankSection {
  word_bank: string[];
  questions: FillInTheBlankQuestion[];
}

export interface TranslationHeToArSection {
  sentences_to_translate: string[];
}

export interface SituationalStorySection {
  scenario_prompt_hebrew: string;
}

export interface HomeworkPackage {
  fill_in_the_blank: FillInTheBlankSection;
  translation_he_to_ar: TranslationHeToArSection;
  situational_story: SituationalStorySection;
}

// ─── Step 1: Extraction Schema ────────────────────────────────────────────────

export const extractionResponseSchema: Schema = {
  type: Type.ARRAY,
  description: "Array of vocabulary items extracted from the whiteboard images",
  items: {
    type: Type.OBJECT,
    properties: {
      arabic_phonetic: {
        type: Type.STRING,
        description: "The Arabic word or phrase, in either Arabic script or Hebrew-character transliteration",
      },
      hebrew_definition: {
        type: Type.STRING,
        description: "The Hebrew translation or definition of the word",
      },
    },
    required: ["arabic_phonetic", "hebrew_definition"],
  },
};

// ─── Step 2: Generation Schema ────────────────────────────────────────────────

export const homeworkPackageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    fill_in_the_blank: {
      type: Type.OBJECT,
      properties: {
        word_bank: {
          type: Type.ARRAY,
          description:
            'Each entry MUST include both the Arabic/transliteration word AND its Hebrew translation, ' +
            'formatted as: "<arabic_or_transliteration> — <hebrew_translation>". ' +
            'Example: "كِتَاب — ספר" or "כִּתָּאב — ספר".',
          items: { type: Type.STRING },
        },
        questions: {
          type: Type.ARRAY,
          description:
            'EXHAUSTIVE COVERAGE REQUIRED: This array MUST contain exactly one entry per ' +
            'input vocabulary word. The length of this array MUST equal the number of words ' +
            'provided in the vocabulary list. Every single input word must be the missing_word ' +
            'in exactly one question. No word may be skipped.',
          items: {
            type: Type.OBJECT,
            properties: {
              context_sentence: {
                type: Type.STRING,
                description:
                  'MUST be in Arabic or Hebrew Transliteration, NOT Hebrew. ' +
                  'The sentence contains a blank "___" where the missing_word belongs.',
              },
              missing_word: {
                type: Type.STRING,
                description:
                  'The Arabic/transliteration word from the vocabulary list that fills the blank. ' +
                  'Must be one of the provided input vocabulary words.',
              },
              hebrew_translation: {
                type: Type.STRING,
                description: 'Hebrew translation of the full context_sentence.',
              },
            },
            required: ["context_sentence", "missing_word", "hebrew_translation"],
          },
        },
      },
      required: ["word_bank", "questions"],
    },
    translation_he_to_ar: {
      type: Type.OBJECT,
      properties: {
        sentences_to_translate: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["sentences_to_translate"],
    },
    situational_story: {
      type: Type.OBJECT,
      properties: {
        scenario_prompt_hebrew: {
          type: Type.STRING,
        },
      },
      required: ["scenario_prompt_hebrew"],
    },
  },
  required: ["fill_in_the_blank", "translation_he_to_ar", "situational_story"],
};

// ─── AI Service ───────────────────────────────────────────────────────────────

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

/**
 * Calls `fn` up to `maxAttempts` times.
 * On a 429 response it extracts the `retryDelay` from the error body and waits
 * that many seconds before retrying, so transient quota bursts recover automatically.
 */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number }).status;
      if (status !== 429 || attempt === maxAttempts) throw err;

      // Parse retryDelay from the Gemini error body (e.g. "32s" or "32.35s")
      let delaySec = 60;
      try {
        const msg = (err as { message?: string }).message ?? '';
        const match = msg.match(/"retryDelay":"([\d.]+)s"/);
        if (match) delaySec = Math.ceil(parseFloat(match[1]));
      } catch { /* ignore parse errors, fall back to 60 s */ }

      console.warn(
        `[AIService] 429 rate-limit hit — waiting ${delaySec}s before retry ` +
        `(attempt ${attempt}/${maxAttempts})…`
      );
      await new Promise((r) => setTimeout(r, delaySec * 1_000));
    }
  }
  throw lastError;
}

export class AIService {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      throw new BadRequestError(
        'GEMINI_API_KEY environment variable is not configured or is using a placeholder value.'
      );
    }
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  // ── Step 1: Extract vocabulary from one or more whiteboard images ─────────

  async extractVocabularyFromImages(
    files: Express.Multer.File[]
  ): Promise<ExtractedVocabularyItem[]> {
    const client = this.getClient();

    if (!files || files.length === 0) {
      throw new BadRequestError('At least one whiteboard image is required.');
    }

    // Build the multimodal content array: images first, then the text prompt
    const imageParts = files.map((file) => ({
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype || 'image/jpeg',
      },
    }));

    const extractionPrompt =
      'Extract all Arabic words written across these whiteboard images and provide their Hebrew translation. ' +
      'Combine them into one list without duplicates. Do not invent words.';

    let response;
    try {
      response = await withRetry(() =>
        client.models.generateContent({
          model: GEMINI_MODEL,
          contents: [...imageParts, extractionPrompt],
          config: {
            responseMimeType: 'application/json',
            responseSchema: extractionResponseSchema,
          },
        })
      );
    } catch (err) {
      console.error('[AIService] Gemini API error during vocabulary extraction:', err);
      throw new ServiceUnavailableError(
        'שירות ה-AI אינו זמין כרגע. אנא בדוק את מפתח ה-API ונסה שוב.'
      );
    }

    const responseText = response.text;
    if (!responseText) {
      throw new ServiceUnavailableError(
        'שירות ה-AI החזיר תשובה ריקה בזמן חילוץ המילים. אנא נסה שוב.'
      );
    }

    try {
      return JSON.parse(responseText) as ExtractedVocabularyItem[];
    } catch (parseError) {
      throw new ServiceUnavailableError(
        `נכשל בפירוש תשובת ה-AI: ${(parseError as Error).message}`
      );
    }
  }

  // ── Step 2: Generate homework package from verified vocabulary ────────────

  async generateHomeworkFromVocabulary(
    studentStage: number,
    scriptPreference: string,
    verifiedVocabulary: ExtractedVocabularyItem[],
    topicsLabels: string[] = [],
    teacherNote: string | null = null
  ): Promise<HomeworkPackage> {
    const client = this.getClient();

    const safeStage = Math.max(0, Math.min(studentStage, 34)); // 35 topics total

    // Prompt is fully managed in src/prompts/homeworkPrompt.ts
    const generationPrompt = buildHomeworkGenerationPrompt(
      safeStage,
      scriptPreference,
      verifiedVocabulary,
      topicsLabels,
      teacherNote
    );

    let response;
    try {
      response = await withRetry(() =>
        client.models.generateContent({
          model: GEMINI_MODEL,
          contents: [generationPrompt],
          config: {
            responseMimeType: 'application/json',
            responseSchema: homeworkPackageSchema,
          },
        })
      );
    } catch (err) {
      console.error('[AIService] Gemini API error during homework generation:', err);
      throw new ServiceUnavailableError(
        'שירות ה-AI אינו זמין כרגע. ייתכן שחרגת ממכסת הבקשות. אנא המתן ונסה שוב.'
      );
    }

    const responseText = response.text;
    if (!responseText) {
      throw new ServiceUnavailableError(
        'שירות ה-AI החזיר תשובה ריקה בזמן יצירת המטלה. אנא נסה שוב.'
      );
    }

    try {
      return JSON.parse(responseText) as HomeworkPackage;
    } catch (parseError) {
      throw new ServiceUnavailableError(
        `נכשל בפירוש תשובת ה-AI: ${(parseError as Error).message}`
      );
    }
  }
}

export const aiService = new AIService();

// ─── Convenience exports ──────────────────────────────────────────────────────

export async function extractVocabularyFromImages(
  files: Express.Multer.File[]
): Promise<ExtractedVocabularyItem[]> {
  return aiService.extractVocabularyFromImages(files);
}

export async function generateHomeworkFromVocabulary(
  studentStage: number,
  scriptPreference: string,
  verifiedVocabulary: ExtractedVocabularyItem[],
  topicsLabels: string[] = [],
  teacherNote: string | null = null
): Promise<HomeworkPackage> {
  return aiService.generateHomeworkFromVocabulary(
    studentStage,
    scriptPreference,
    verifiedVocabulary,
    topicsLabels,
    teacherNote
  );
}
