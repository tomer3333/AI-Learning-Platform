import type { HomeworkResult } from '../types/homework';

/**
 * Converts a HomeworkResult into a WhatsApp-friendly plain-text string.
 * Uses Hebrew section headers and emoji to make it easy to read on mobile.
 */
export function formatHomeworkAsText(result: HomeworkResult): string {
  const { fill_in_the_blank, translation_he_to_ar, situational_story } = result.content;

  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push('📚 שיעורי בית בערבית 📚');
  lines.push('');

  // ── 1. Vocabulary bank ────────────────────────────────────────────────────
  lines.push('✨ מילות השבוע:');
  for (const word of fill_in_the_blank.word_bank) {
    lines.push(`• ${word}`);
  }
  lines.push('');

  // ── 2. Fill in the blank ──────────────────────────────────────────────────
  lines.push('📝 השלם את החסר:');
  fill_in_the_blank.questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.context_sentence}`);
    lines.push(`   (תרגום: ${q.hebrew_translation})`);
    lines.push(`   מילה חסרה: ${q.missing_word}`);
  });
  lines.push('');

  // ── 3. Translation ────────────────────────────────────────────────────────
  lines.push('🗣️ תרגום לערבית:');
  translation_he_to_ar.sentences_to_translate.forEach((sentence, i) => {
    lines.push(`${i + 1}. ${sentence}`);
  });
  lines.push('');

  // ── 4. Situational story ──────────────────────────────────────────────────
  lines.push('🎬 סימולציה:');
  lines.push(situational_story.scenario_prompt_hebrew);
  lines.push('');

  // ── Footer ────────────────────────────────────────────────────────────────
  lines.push('בהצלחה! 💪');

  return lines.join('\n');
}
