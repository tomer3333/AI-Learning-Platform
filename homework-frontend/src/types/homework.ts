// ─── Stage ────────────────────────────────────────────────────────────────────

export type AppStage = 'UPLOAD' | 'VERIFICATION' | 'RESULT';

// ─── Syllabus ─────────────────────────────────────────────────────────────────

export interface SyllabusTopic {
  id: string;
  label: string;
}

export interface SyllabusCategory {
  categoryName: string;
  topics: SyllabusTopic[];
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

/** A single vocabulary pair extracted from a whiteboard image. */
export interface VocabularyItem {
  arabic_phonetic: string;
  hebrew_definition: string;
}

// ─── Homework Package sections ────────────────────────────────────────────────

export interface FillInTheBlankQuestion {
  /** In Arabic/transliteration — never Hebrew */
  context_sentence: string;
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

/**
 * The full generated homework package returned by POST /api/homeworks/generate.
 * Mirrors the backend HomeworkPackage interface exactly.
 * All sections are optional because the teacher may deselect any exercise type.
 */
export interface HomeworkPackage {
  fill_in_the_blank?: FillInTheBlankSection;
  translation_he_to_ar?: TranslationHeToArSection;
  situational_story?: SituationalStorySection;
}

// ─── API response wrappers ────────────────────────────────────────────────────

/**
 * The backend wraps every success response in { success: true, data: T }.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * The saved Homework record as returned from POST /api/homeworks/generate.
 */
export interface HomeworkResult {
  id: string;
  student_id: string;
  status: string;
  content: HomeworkPackage;
  whiteboard_image_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Student ──────────────────────────────────────────────────────────────────

export type ScriptPreference = 'hebrew_transliteration' | 'arabic_letters';

export interface Student {
  id: string;
  name: string;
  syllabus_stage_index: number;
  script_preference: ScriptPreference;
  general_notes?: string | null;
  phone_number?: string | null;
  /** DB-persisted payment flag, default false. */
  payment_paid: boolean;
  created_at: string;
  homeworks: HomeworkResult[];
}

/**
 * Alias — the backend's GET /api/students/:id response includes the full
 * homeworks array already (via TypeORM relation), so the shape is identical.
 */
export type StudentWithHistory = Student;

// ─── Lesson Summary ───────────────────────────────────────────────────────────

/** A lesson summary record as returned by GET/POST /api/students/:id/lessons. */
export interface LessonSummary {
  id: string;
  student_id: string;
  /** Array of syllabus topic IDs covered in this lesson. */
  topicsCovered: string[];
  topics_covered?: string[];
  /** Free-form teacher note (in Hebrew). */
  teacherNote?: string | null;
  teacher_note?: string | null;
  /** Creation timestamp */
  date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLessonSummaryPayload {
  topicsCovered: string[];
  teacherNote: string;
}

// ─── Create Student ───────────────────────────────────────────────────────────

export interface CreateStudentPayload {
  name: string;
  syllabus_stage_index: number;
  script_preference?: ScriptPreference;
  general_notes?: string | null;
  phone_number?: string | null;
}
