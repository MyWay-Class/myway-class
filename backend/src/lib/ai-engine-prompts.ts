import { getLectureDetail, type AIIntentRequest, type AIIntentResult, type AIAnswerRequest, type AIAnswerResult, type AISummaryRequest, type AIQuizRequest } from '@myway/shared';
import type { OllamaChatMessage } from './providers';

export function buildSummaryPrompt(
  lectureTitle: string,
  courseTitle: string,
  sourceText: string,
  style: AISummaryRequest['style'],
  language: AISummaryRequest['language'],
): OllamaChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'You are a careful lecture summarizer. Return valid JSON only. Do not wrap the response in markdown or prose.',
    },
    {
      role: 'user',
      content: [
        `Lecture title: ${lectureTitle}`,
        `Course title: ${courseTitle}`,
        `Language: ${language ?? 'ko'}`,
        `Style: ${style ?? 'brief'}`,
        'Return JSON with the following shape:',
        '{"title":"string","content":"string","key_points":["string"]}',
        'Rules:',
        '- Use only the provided source text.',
        '- Keep factual claims grounded in the lecture.',
        '- title should be short and descriptive.',
        '- content should be concise and readable in the selected language.',
        '- key_points should contain 3 to 5 short bullets.',
        'Source text:',
        sourceText,
      ].join('\n'),
    },
  ];
}

export function buildQuizPrompt(
  lectureTitle: string,
  courseTitle: string,
  sourceText: string,
  input: AIQuizRequest,
): OllamaChatMessage[] {
  const count = Math.max(1, Math.min(5, input.count ?? 4));
  const difficulty = input.difficulty ?? 'medium';

  return [
    {
      role: 'system',
      content:
        'You are a careful quiz writer. Return valid JSON only. Do not wrap the response in markdown or prose.',
    },
    {
      role: 'user',
      content: [
        `Lecture title: ${lectureTitle}`,
        `Course title: ${courseTitle}`,
        `Difficulty: ${difficulty}`,
        `Question count: ${count}`,
        'Return JSON with the following shape:',
        '{"title":"string","difficulty":"easy|medium|hard","questions":[{"question":"string","choices":["string","string","string","string"],"correct_choice_index":0,"explanation":"string"}]}',
        'Rules:',
        '- Use only the provided source text.',
        '- Create exactly four choices per question.',
        '- Keep one clearly correct choice per question.',
        '- Explanations should be short and grounded in the lecture.',
        '- Output between 1 and 5 questions.',
        'Source text:',
        sourceText,
      ].join('\n'),
    },
  ];
}

export function buildIntentPrompt(input: AIIntentRequest, fallback: AIIntentResult): OllamaChatMessage[] {
  const lecture = input.lecture_id ? getLectureDetail(input.lecture_id) : undefined;

  return [
    {
      role: 'system',
      content:
        'You are an AI intent classifier for a learning platform. Return valid JSON only. Do not wrap the response in markdown or prose.',
    },
    {
      role: 'user',
      content: [
        `Message: ${input.message}`,
        `Lecture title: ${lecture?.title ?? 'none'}`,
        `Course title: ${lecture?.course_title ?? 'none'}`,
        `Context: ${(input.context ?? []).join(' | ') || 'none'}`,
        'Return JSON with the following shape:',
        '{"intent":"request_summary|generate_quiz|search_content|ask_concept|ask_recommendation|explain_deeper|translate|compare|create_shortform|extract_audio|analyze_progress|general_chat|clarify","confidence":0.0,"action":"SEARCH|DIRECT_ANSWER|CLARIFY|DECOMPOSE","reason":"string","entities":["string"],"needs_clarification":true}',
        'Rules:',
        '- Keep the confidence between 0 and 1.',
        '- Keep the action aligned with the intent.',
        '- Use the lecture and context when it helps classification.',
        '- Return a concise reason in Korean.',
        '- entities should contain 2 to 6 short values.',
        `Fallback intent: ${fallback.intent}`,
        `Fallback action: ${fallback.action}`,
      ].join('\n'),
    },
  ];
}

export function buildAnswerPrompt(input: AIAnswerRequest, fallback: AIAnswerResult): OllamaChatMessage[] {
  const lecture = input.lecture_id ? getLectureDetail(input.lecture_id) : undefined;
  const references = fallback.references.slice(0, 3);

  return [
    {
      role: 'system',
      content:
        'You are a grounded lecture assistant. Return valid JSON only. Do not wrap the response in markdown or prose.',
    },
    {
      role: 'user',
      content: [
        `Question: ${input.question}`,
        `Lecture title: ${lecture?.title ?? 'none'}`,
        `Course title: ${lecture?.course_title ?? 'none'}`,
        `Intent: ${fallback.intent.intent}`,
        'Reference snippets:',
        ...references.map((reference, index) => `${index + 1}. ${reference.title}: ${reference.excerpt}`),
        'Return JSON with the following shape:',
        '{"answer":"string","suggestions":["string","string"]}',
        'Rules:',
        '- Base the answer on the provided references and lecture context.',
        '- Keep the answer short, direct, and natural in Korean.',
        '- suggestions should contain 2 short follow-up questions.',
        '- If the references are weak, acknowledge that briefly.',
      ].join('\n'),
    },
  ];
}
