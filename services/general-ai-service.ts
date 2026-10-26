import { GoogleGenAI, type Content } from '@google/genai';

import { sanitizeAssistantText } from '@/services/assistant-text-sanitizer';

export type GeneralChatMessage = {
  role: 'user' | 'model';
  text: string;
};

export type GeneralChatHistory = GeneralChatMessage[];

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GENERAL_ANSWER_TIMEOUT_MS = 20_000;
const SYSTEM_INSTRUCTION = `You are the DistraKill Study Assistant, a helpful educational assistant for university students.

Answer general knowledge and study questions clearly, accurately, and concisely.
Use simple explanations unless the user asks for more detail.
Give concise answers by default, usually 2–5 short paragraphs or bullets unless the user asks for more detail.
Return clean plain text for a mobile chat bubble. Do not use Markdown bold, italic markers, headings, asterisks around words, backticks, or code fences.
Never invent the user's tasks, study planner data, focus history, profile information, Quran verses, duas, or Hadith references.
Private or app-specific information must come only from DistraKill's own data services.
For general knowledge questions, answer normally.`;

function getFriendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('api key') || message.includes('401') || message.includes('403')) {
    return 'The AI service configuration is not available right now. Please check the Gemini API key.';
  }
  if (message.includes('quota') || message.includes('429') || message.includes('rate')) {
    return 'The AI service is temporarily busy. Please try again in a moment.';
  }
  return "I couldn't reach the AI service right now. Please try again.";
}

export async function generateGeneralAnswer(
  question: string,
  history: GeneralChatHistory = [],
): Promise<string> {
  let answer = '';
  await generateGeneralAnswerStream(question, history, (chunk) => {
    answer += chunk;
  });
  return answer;
}

export async function generateGeneralAnswerStream(
  question: string,
  history: GeneralChatHistory = [],
  onChunk: (chunk: string) => void,
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return 'General AI is not configured for this development build yet.';
  }

  const client = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: GENERAL_ANSWER_TIMEOUT_MS },
  });
  const contents: Content[] = [
    ...history.slice(-6).map((message) => ({
      role: message.role,
      parts: [{ text: message.text }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];

  try {
    const stream = await client.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION, maxOutputTokens: 400 },
    });
    let answer = '';
    for await (const response of stream) {
      const chunk = response.text ?? '';
      if (chunk) {
        answer += chunk;
        onChunk(chunk);
      }
    }

    const cleanAnswer = sanitizeAssistantText(answer.trim());
    if (!cleanAnswer) return "I couldn't get a usable answer from the AI service. Please try again.";
    return cleanAnswer;
  } catch (error) {
    if (__DEV__) {
      const category = error instanceof Error ? error.name : 'unknown-error';
      console.debug('Gemini general-answer request failed:', category);
    }
    throw new Error(getFriendlyErrorMessage(error));
  }
}
