import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  ChevronRight,
  Phone,
  BookOpen,
  StickyNote,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useSyllabus, useCreateStudent } from '../hooks/useHomeworkAPI';
import type { ScriptPreference } from '../types/homework';

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  error,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

// ── Script toggle ──────────────────────────────────────────────────────────────

function ScriptToggle({
  value,
  onChange,
}: {
  value: ScriptPreference;
  onChange: (v: ScriptPreference) => void;
}) {
  const options: { value: ScriptPreference; label: string }[] = [
    { value: 'hebrew_transliteration', label: 'תעתיק עברי' },
    { value: 'arabic_letters', label: 'אותיות ערביות' },
  ];

  return (
    <div
      className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1"
      role="group"
      aria-label="העדפת כתב"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          id={`script-${opt.value}`}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Form state / validation ────────────────────────────────────────────────────

interface FormState {
  name: string;
  phone_number: string;
  syllabus_stage_index: string;
  script_preference: ScriptPreference;
  general_notes: string;
}

interface FormErrors {
  name?: string;
  syllabus_stage_index?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) {
    errors.name = 'שם התלמיד הוא שדה חובה';
  }
  if (form.syllabus_stage_index === '') {
    errors.syllabus_stage_index = 'יש לבחור שלב בסילבוס';
  }
  return errors;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AddStudentPage() {
  const navigate = useNavigate();
  const { data: syllabus, isLoading: syllabusLoading } = useSyllabus();
  const { mutate: createStudent, isPending, error: apiError } = useCreateStudent();

  const [form, setForm] = useState<FormState>({
    name: '',
    phone_number: '',
    syllabus_stage_index: '',
    script_preference: 'hebrew_transliteration',
    general_notes: '',
  });

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Build flat list of topics for the select: [{globalIndex, label, categoryName}]
  const stageOptions = syllabus
    ? syllabus.flatMap((cat) =>
        cat.topics.map((topic, _ti) => topic)
      ).map((topic, idx) => ({ idx, topic }))
    : [];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (submitted) {
      // Re-validate on change after first submit attempt
      setFieldErrors(validate({ ...form, [key]: value }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    createStudent(
      {
        name: form.name.trim(),
        syllabus_stage_index: parseInt(form.syllabus_stage_index, 10),
        script_preference: form.script_preference,
        general_notes: form.general_notes.trim() || null,
        phone_number: form.phone_number.trim() || null,
      },
      {
        onSuccess: (newStudent) => {
          navigate(`/students/${newStudent.id}`);
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10" dir="rtl">

      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          id="back-to-students"
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <ChevronRight size={15} />
          חזרה לרשימת התלמידים
        </button>

        <div className="flex items-center gap-2.5 text-indigo-600 mb-1">
          <UserPlus size={20} />
          <span className="text-xs font-semibold uppercase tracking-widest">
            ניהול תלמידים
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">הוספת תלמיד חדש</h1>
        <p className="mt-1 text-sm text-gray-500">
          מלא את הפרטים הבאים כדי להוסיף תלמיד למערכת.
        </p>
      </div>

      {/* API error banner */}
      {apiError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">שגיאה בשמירת התלמיד</p>
            <p className="mt-0.5 text-red-600/80">{apiError.message}</p>
          </div>
        </div>
      )}

      {/* Form card */}
      <form
        id="add-student-form"
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm space-y-6"
      >

        {/* Name */}
        <Field
          label="שם התלמיד"
          htmlFor="field-name"
          error={fieldErrors.name}
        >
          <input
            id="field-name"
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="לדוגמה: יעקב כהן"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 transition-all ${
              fieldErrors.name
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-100'
            }`}
          />
        </Field>

        {/* Phone number */}
        <Field
          label="מספר טלפון"
          htmlFor="field-phone"
          hint="אופציונלי — ישמש בעתיד לשליחת שיעורי בית בוואטסאפ"
        >
          <div className="relative">
            <Phone
              size={15}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              id="field-phone"
              type="tel"
              value={form.phone_number}
              onChange={(e) => set('phone_number', e.target.value)}
              placeholder="050-0000000"
              dir="ltr"
              className="w-full rounded-xl border border-gray-200 px-4 pe-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-right"
            />
          </div>
        </Field>

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Syllabus stage */}
        <Field
          label="שלב בסילבוס"
          htmlFor="field-stage"
          error={fieldErrors.syllabus_stage_index}
        >
          <div className="relative">
            <BookOpen
              size={15}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            {syllabusLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                טוען שלבים...
              </div>
            ) : (
              <select
                id="field-stage"
                value={form.syllabus_stage_index}
                onChange={(e) => set('syllabus_stage_index', e.target.value)}
                className={`w-full appearance-none rounded-xl border px-4 pe-9 py-2.5 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 transition-all bg-white ${
                  fieldErrors.syllabus_stage_index
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-100'
                }`}
              >
                <option value="">בחר שלב...</option>
                {stageOptions.map(({ idx, topic }) => (
                  <option key={topic.id} value={idx}>
                    שלב {idx + 1} — {topic.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </Field>

        {/* Script preference */}
        <Field label="העדפת כתב" htmlFor="script-hebrew_transliteration">
          <div>
            <ScriptToggle
              value={form.script_preference}
              onChange={(v) => set('script_preference', v)}
            />
          </div>
        </Field>

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* General notes */}
        <Field
          label="הערות כלליות"
          htmlFor="field-notes"
          hint="אופציונלי — קשיים, מטרות, מידע רקע וכו'."
        >
          <div className="relative">
            <StickyNote
              size={15}
              className="absolute end-3 top-3.5 text-gray-400 pointer-events-none"
            />
            <textarea
              id="field-notes"
              value={form.general_notes}
              onChange={(e) => set('general_notes', e.target.value)}
              rows={3}
              placeholder="לדוגמה: קושי עם אותיות גרוניות, מעוניין בדגש על שיחה יומיומית..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 pe-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </Field>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            id="cancel-add-student"
            onClick={() => navigate('/')}
            disabled={isPending}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            ביטול
          </button>

          <button
            type="submit"
            id="submit-add-student"
            disabled={isPending || syllabusLoading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <UserPlus size={15} />
                הוסף תלמיד
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
