// ─── Syllabus Configuration ───────────────────────────────────────────────────
// Single source of truth for the Arabic spoken-language syllabus.
// - `id`           : English key used internally (stable identifier for DB storage).
// - `label`        : Hebrew display string shown in the frontend UI.
// - `categoryName` : Hebrew category name grouping related topics.

export interface SyllabusTopic {
  id: string;
  label: string;
}

export interface SyllabusCategory {
  categoryName: string;
  topics: SyllabusTopic[];
}

export const ARABIC_SYLLABUS: SyllabusCategory[] = [
  {
    categoryName: "יסודות, קריאה וכתיבה",
    topics: [
      { id: "letters_vowels", label: "האותיות והתנועות בערבית, חוקי הכתיבה" },
      { id: "pronunciation", label: "דגש על הגייה נכונה של האותיות" },
      { id: "banat_rule", label: "חוק בנת (רצף שני שוואים)" },
      { id: "al_yedia", label: "'אל' הידיעה, אותיות שמש וירח" },
    ],
  },
  {
    categoryName: "ברכות, שייכות ורמז",
    topics: [
      { id: "greetings", label: "ברכות בסיסיות (אהלן וסהלן, כיפ אלחאל וכו')" },
      { id: "pronouns", label: "כינויי הגוף" },
      { id: "possessive", label: "כינויי השייכות (חבור + פרוד, כולל נקבה)" },
      { id: "demonstrative", label: "כינויי הרמז הקרובים + 'האל'" },
    ],
  },
  {
    categoryName: "שאלות, מילות יחס ושלילה",
    topics: [
      { id: "question_words", label: "מילות שאלה בסיסיות" },
      { id: "prepositions", label: "השימוש במיליות 'ענד, פיה, בדי' והטייתם" },
      { id: "negation_prepositions", label: "שלילת המיליות 'ענד, פיה, בדי'" },
      { id: "negation_words", label: "שימושי מיליות השלילה (לא, מש, מא/ש)" },
    ],
  },
  {
    categoryName: "מערכת הפועל - בסיס ועבר",
    topics: [
      { id: "verb_intro", label: "חשיפה למערכת הפועל (דגש על דמיון לעברית)" },
      { id: "past_b1", label: "הפועל בעבר בניין 1 (משקלים פעל ופיעל)" },
      { id: "verb_suffix", label: "כינוי חבור לפועל" },
      { id: "elli_enno", label: "המיליות 'אללי' ו-'אנה' כולל הטיות" },
    ],
  },
];

/**
 * Flat array of topic IDs in syllabus order.
 * Preserves backward compatibility with `syllabus_stage_index` (0-based index).
 */
export const SYLLABUS_TOPIC_IDS: string[] = ARABIC_SYLLABUS.flatMap((category) =>
  category.topics.map((t) => t.id)
);

/**
 * Flat array of Hebrew topic labels in syllabus order.
 * Drop-in replacement for the old SYLLABUS_TOPICS string array.
 */
export const SYLLABUS_TOPIC_LABELS: string[] = ARABIC_SYLLABUS.flatMap((category) =>
  category.topics.map((t) => t.label)
);
