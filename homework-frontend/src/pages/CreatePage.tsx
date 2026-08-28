import { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UploadCloud, X, Loader2, FileImage, AlertCircle,
  CheckSquare, BookOpen, Camera, Settings2, Rocket,
  Trash2, Plus, ChevronRight, Eye,
} from 'lucide-react';
import { ARABIC_SYLLABUS } from '../config/syllabus';
import { ResultView } from '../components/ResultView';
import { useCreateLessonSummary } from '../hooks/useHomeworkAPI';
import { generateHomework, extractVocabulary } from '../api/client';
import type { HomeworkResult, VocabularyItem } from '../types/homework';

// ── Wizard step type ───────────────────────────────────────────────────────────
type WizardStep = 'input' | 'verify' | 'result';

// ── Homework type options (dummy — wired to backend in a future phase) ─────────
const HOMEWORK_TYPES = [
  { id: 'fill_blank',         label: 'השלם את החסר' },
  { id: 'sentence_translate', label: 'תרגום משפטים' },
  { id: 'story_simulation',   label: 'סיפור סימולציה' },
];

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: WizardStep }) {
  const steps: { id: WizardStep; label: string }[] = [
    { id: 'input',  label: 'פרטי השיעור' },
    { id: 'verify', label: 'אימות מילים' },
    { id: 'result', label: 'מטלה מוכנה' },
  ];
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <nav aria-label="שלבי האשף" className="mb-8 flex items-center gap-0">
      {steps.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={s.id} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                  done   ? 'bg-indigo-600 text-white'                        : '',
                  active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : '',
                  !done && !active ? 'border-2 border-gray-300 bg-white text-gray-400' : '',
                ].join(' ')}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-indigo-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mb-5 h-0.5 flex-1 transition-colors ${i < idx ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({
  icon, number, title, subtitle,
}: {
  icon: React.ReactNode;
  number: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-sm">
        {number}
      </div>
      <div className="flex items-start gap-2 flex-1">
        <span className="mt-0.5 text-indigo-500 shrink-0">{icon}</span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CreatePage() {
  // ── Router ────────────────────────────────────────────────────────────────────
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentId = searchParams.get('studentId') ?? '';

  // ── Wizard state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>('input');

  // ── Step 1 state: syllabus, teacher note, images, hw types ───────────────────
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [teacherNote,    setTeacherNote]    = useState('');
  const [selectedFiles,  setSelectedFiles]  = useState<File[]>([]);
  const [isDragging,     setIsDragging]     = useState(false);
  const [selectedTypes,  setSelectedTypes]  = useState<Set<string>>(
    new Set(HOMEWORK_TYPES.map((t) => t.id))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 2 state: editable vocabulary list ────────────────────────────────────
  const [vocab, setVocab] = useState<VocabularyItem[]>([]);

  // ── Shared async state ────────────────────────────────────────────────────────
  const [isWorking, setIsWorking]   = useState(false);
  const [workError, setWorkError]   = useState<string | null>(null);
  const [result,    setResult]      = useState<HomeworkResult | null>(null);

  // ── TanStack Query mutation (must be called unconditionally — Rules of Hooks) ─
  const { mutateAsync: createLesson } = useCreateLessonSummary();

  // addFiles defined before any early return to stay unconditional
  function addFiles(incoming: FileList | File[]) {
    const newFiles = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, 5));
  }

  // ── Guard: no studentId ───────────────────────────────────────────────────────
  if (!studentId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10" dir="rtl">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">לא נבחר תלמיד</p>
            <p className="mt-1 text-red-600/80">
              יש להגיע לדף זה דרך פרופיל תלמיד.{' '}
              <button onClick={() => navigate('/')} className="underline hover:text-red-800">
                חזרה לרשימה
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const canExtract = selectedTopics.size > 0 && selectedFiles.length > 0;

  // ── Step 1 handlers ───────────────────────────────────────────────────────────

  function toggleTopic(id: string) {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleType(id: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files);
  };

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (!canExtract) return;
    setWorkError(null);
    setIsWorking(true);
    try {
      // 1. Save lesson summary
      await createLesson({
        studentId,
        payload: {
          topicsCovered: Array.from(selectedTopics),
          teacherNote: teacherNote.trim(),
        },
      });
      // 2. OCR — extract vocabulary from whiteboard images
      const extracted = await extractVocabulary(selectedFiles);
      setVocab(extracted);
      setStep('verify');
    } catch (err: unknown) {
      setWorkError(err instanceof Error ? err.message : 'שגיאה לא ידועה. נסה שוב.');
    } finally {
      setIsWorking(false);
    }
  }

  // ── Step 2 handlers ───────────────────────────────────────────────────────────

  function updateVocabRow(index: number, field: keyof VocabularyItem, value: string) {
    setVocab((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function removeVocabRow(index: number) {
    setVocab((prev) => prev.filter((_, i) => i !== index));
  }

  function addVocabRow() {
    setVocab((prev) => [...prev, { arabic_phonetic: '', hebrew_definition: '' }]);
  }

  async function handleGenerate() {
    const cleaned = vocab.filter(
      (v) => v.arabic_phonetic.trim() !== '' || v.hebrew_definition.trim() !== ''
    );
    if (cleaned.length === 0) {
      setWorkError('יש לוודא שקיימת לפחות מילה אחת ברשימה לפני היצירה.');
      return;
    }
    setWorkError(null);
    setIsWorking(true);
    try {
      const hw = await generateHomework(studentId, cleaned);
      setResult(hw);
      setStep('result');
    } catch (err: unknown) {
      setWorkError(err instanceof Error ? err.message : 'שגיאה לא ידועה. נסה שוב.');
    } finally {
      setIsWorking(false);
    }
  }

  function resetWizard() {
    setStep('input');
    setSelectedTopics(new Set());
    setTeacherNote('');
    setSelectedFiles([]);
    setVocab([]);
    setResult(null);
    setWorkError(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-6 py-10" dir="rtl">

      {/* Page heading */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">📚 תיעוד שיעור ויצירת מטלה</h1>
        <p className="mt-1 text-sm text-gray-500">
          שלב 1: תאר את השיעור → שלב 2: אמת את המילים שחולצו → שלב 3: קבל מטלה.
        </p>
      </div>

      <StepIndicator step={step} />

      {/* ════════════════════════════════════════════════════════════════════════
          STEP 1 — Input: syllabus + images + settings
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'input' && (
        <form onSubmit={handleExtract} className="space-y-0">

          {/* Card 1: Syllabus */}
          <div className="rounded-t-2xl border border-b-0 border-gray-200 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<BookOpen size={18} />}
              number={1}
              title="מה למדנו היום?"
              subtitle="סמן את הנושאים שנלמדו בשיעור זה"
            />

            <div className="space-y-5">
              {ARABIC_SYLLABUS.map((category) => (
                <div key={category.categoryName}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    {category.categoryName}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {category.topics.map((topic) => {
                      const checked = selectedTopics.has(topic.id);
                      return (
                        <label
                          key={topic.id}
                          className={[
                            'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-all',
                            checked
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/40',
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={() => toggleTopic(topic.id)}
                            id={`topic-${topic.id}`}
                          />
                          <span
                            className={[
                              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                              checked
                                ? 'border-indigo-500 bg-indigo-500 text-white'
                                : 'border-gray-300 bg-white',
                            ].join(' ')}
                            aria-hidden="true"
                          >
                            {checked && (
                              <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-current">
                                <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span className="leading-snug">{topic.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="my-6 border-t border-gray-100" />

            {/* Teacher note */}
            <div>
              <label htmlFor="teacher-note" className="mb-2 block text-sm font-semibold text-gray-700">
                הערות והנחיות לשיעורי הבית
                <span className="ms-1 font-normal text-gray-400">(רשות)</span>
              </label>
              <textarea
                id="teacher-note"
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                rows={3}
                placeholder="לדוגמה: התלמיד מתקשה עם הטיית כינויי השייכות — להדגיש במטלה..."
                className="block w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 placeholder-gray-400 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                dir="rtl"
              />
            </div>
          </div>

          {/* Card 2: Whiteboard images */}
          <div className="border-x border-gray-200 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<Camera size={18} />}
              number={2}
              title="תמונות הלוח"
              subtitle="העלה עד 5 תמונות של הלוח — ממנן תחולץ רשימת המילים"
            />

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label="העלאת תמונות לוח"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={[
                'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed',
                'cursor-pointer p-10 text-center transition-all duration-200 select-none',
                isDragging
                  ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
                  : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50',
              ].join(' ')}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">גרור תמונות לכאן</p>
                <p className="mt-1 text-xs text-gray-500">
                  או <span className="text-indigo-600 underline">עיין בקבצים</span> — עד 5 תמונות
                </p>
              </div>
              <input
                ref={fileInputRef}
                id="whiteboard-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
              />
            </div>

            {/* File list */}
            {selectedFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {selectedFiles.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm"
                  >
                    <FileImage size={16} className="shrink-0 text-indigo-500" />
                    <span className="flex-1 truncate text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      aria-label={`הסר ${file.name}`}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Card 3: Homework settings */}
          <div className="rounded-b-2xl border border-t-0 border-gray-200 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<Settings2 size={18} />}
              number={3}
              title="הגדרות המטלה"
              subtitle="בחר את סוגי התרגולים שיופיעו בשיעורי הבית"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {HOMEWORK_TYPES.map((type) => {
                const checked = selectedTypes.has(type.id);
                return (
                  <label
                    key={type.id}
                    className={[
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                      checked
                        ? 'border-violet-300 bg-violet-50 text-violet-800 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:bg-violet-50/40',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleType(type.id)}
                      id={`type-${type.id}`}
                    />
                    <span
                      className={[
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked
                          ? 'border-violet-500 bg-violet-500 text-white'
                          : 'border-gray-300 bg-white',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {checked && <CheckSquare size={10} className="fill-white" />}
                    </span>
                    {type.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {workError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{workError}</span>
            </div>
          )}

          {/* Validation hints + submit */}
          <div className="mt-6 space-y-3">
            {!canExtract && !isWorking && (
              <div className="flex flex-col gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                {selectedTopics.size === 0 && (
                  <p>⚠️ יש לסמן לפחות נושא אחד מהסילבוס.</p>
                )}
                {selectedFiles.length === 0 && (
                  <p>📷 יש להעלות לפחות תמונה אחת של הלוח — מילות המטלה נחלצות ממנה.</p>
                )}
              </div>
            )}
            <button
              type="submit"
              id="extract-btn"
              disabled={isWorking || !canExtract}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWorking ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  שומר סיכום וחולץ מילים...
                </>
              ) : (
                <>
                  <Eye size={18} />
                  שמור סיכום וחלץ מילים
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STEP 2 — Verify: human-in-the-loop vocabulary review
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'verify' && (
        <div className="space-y-4">

          {/* Header card */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <h2 className="text-base font-bold text-indigo-900">🔍 אמת את המילים שחולצו מהלוח</h2>
            <p className="mt-1 text-sm text-indigo-700">
              בדוק שה-OCR זיהה נכון. תקן שגיאות, הוסף מילים שהוחמצו, או מחק מילים לא רצויות.
              לאחר מכן לחץ "אשר מילים וייצר מטלה".
            </p>
          </div>

          {/* Vocabulary editor */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">ערבית / פונטיקה</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">עברית</span>
              <span className="w-8" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100 px-3 py-2">
              {vocab.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  לא חולצו מילים — הוסף מילים ידנית למטה.
                </p>
              ) : (
                vocab.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 py-2.5"
                  >
                    {/* Arabic / phonetic */}
                    <input
                      id={`vocab-arabic-${idx}`}
                      type="text"
                      value={item.arabic_phonetic}
                      onChange={(e) => updateVocabRow(idx, 'arabic_phonetic', e.target.value)}
                      placeholder="مثلاً كِتَاب"
                      dir="auto"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    {/* Hebrew definition */}
                    <input
                      id={`vocab-hebrew-${idx}`}
                      type="text"
                      value={item.hebrew_definition}
                      onChange={(e) => updateVocabRow(idx, 'hebrew_definition', e.target.value)}
                      placeholder="לדוגמה: ספר"
                      dir="rtl"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    {/* Delete row */}
                    <button
                      type="button"
                      onClick={() => removeVocabRow(idx)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      aria-label={`מחק שורה ${idx + 1}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add row */}
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                type="button"
                id="add-vocab-row-btn"
                onClick={addVocabRow}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-4 py-2 text-sm font-medium text-indigo-600 transition-all hover:border-indigo-500 hover:bg-indigo-50"
              >
                <Plus size={15} />
                הוסף מילה ידנית
              </button>
            </div>
          </div>

          {/* Word count badge */}
          <p className="text-xs text-gray-400 text-center">
            {vocab.filter((v) => v.arabic_phonetic.trim() || v.hebrew_definition.trim()).length} מילים ברשימה
          </p>

          {/* Error */}
          {workError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{workError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              id="back-to-input-btn"
              onClick={() => { setStep('input'); setWorkError(null); }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              <ChevronRight size={15} />
              חזור
            </button>
            <button
              type="button"
              id="generate-btn"
              onClick={handleGenerate}
              disabled={isWorking}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWorking ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  מייצר מטלה...
                </>
              ) : (
                <>
                  <Rocket size={16} />
                  אשר מילים וייצר מטלה
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          STEP 3 — Result
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 'result' && result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-base font-bold text-emerald-900">✅ שיעורי הבית מוכנים!</h2>
            <p className="mt-1 text-sm text-emerald-700">המטלה נשמרה ומוכנה לשליחה לתלמיד.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <ResultView result={result} />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/students/${studentId}`)}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              ← חזרה לפרופיל
            </button>
            <button
              type="button"
              onClick={resetWizard}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              🔄 שיעור חדש
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
