import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Languages, Rocket, FolderOpen, Copy, Check,
  AlertCircle, Loader2, CreditCard, CheckCircle2, XCircle,
  ClipboardList,
} from 'lucide-react';
import { useStudent, useUpdatePayment, useLessonSummaries } from '../hooks/useHomeworkAPI';
import { formatHomeworkAsText } from '../utils/formatHomework';
import { TOPIC_LABEL_MAP } from '../config/syllabus';
import type { HomeworkResult, ScriptPreference, LessonSummary } from '../types/homework';

// ── Helpers ───────────────────────────────────────────────────────────────────

function stageBadge(index: number) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
      <BookOpen size={12} />
      שלב {index}
    </span>
  );
}

function scriptBadge(pref: ScriptPreference) {
  const label = pref === 'arabic_letters' ? 'אותיות ערביות' : 'תעתיק עברי';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
      <Languages size={12} />
      {label}
    </span>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

// ── Lesson summary row ────────────────────────────────────────────────────────

function LessonSummaryRow({ summary, index }: { summary: LessonSummary; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const rawTopics = summary.topicsCovered ?? summary.topics_covered ?? [];
  const topicList = Array.isArray(rawTopics) ? rawTopics : [];
  const topicLabels = topicList
    .map((id) => TOPIC_LABEL_MAP[id] ?? id)
    .filter(Boolean);
  const note = summary.teacherNote ?? summary.teacher_note ?? '';
  const dateStr = summary.date ?? summary.created_at ?? '';

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {/* Index badge */}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-600">
            #{index}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">
              {topicLabels.length} נושא{topicLabels.length !== 1 ? 'ים' : ''} נלמד{topicLabels.length !== 1 ? 'ו' : ''}
            </p>
            {dateStr && (
              <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{formatDate(dateStr)}</p>
            )}
          </div>
        </div>
        {topicLabels.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
            aria-label="הצג נושאים"
          >
            {expanded ? 'הסתר ▲' : 'פרט ▼'}
          </button>
        )}
      </div>

      {/* Topics chip list */}
      {expanded && topicLabels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" dir="rtl">
          {topicLabels.map((label, i) => (
            <span
              key={i}
              className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Teacher note */}
      {note && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-800 leading-relaxed" dir="rtl">
          <span className="font-semibold">הערה: </span>{note}
        </div>
      )}
    </div>
  );
}

// ── Homework history row ──────────────────────────────────────────────────────

function HomeworkRow({ hw, index }: { hw: HomeworkResult; index: number }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = formatHomeworkAsText(hw);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 min-w-0">
        {/* Index badge */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
          #{index}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            חבילת שיעורי בית
          </p>
          <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{formatDate(hw.created_at)}</p>
        </div>
        {/* Status chip */}
        <span
          className={[
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
            hw.status === 'completed'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-gray-50 text-gray-500 ring-gray-200',
          ].join(' ')}
        >
          {hw.status === 'completed' ? 'הושלם' : hw.status}
        </span>
      </div>

      <button
        id={`copy-hw-${hw.id}`}
        onClick={handleCopy}
        className={[
          'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
          copied
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-[#25D366]/50 hover:bg-[#25D366]/10 hover:text-[#128C7E]',
        ].join(' ')}
        aria-label="העתק טקסט לווטסאפ"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'הועתק!' : 'העתק לווטסאפ'}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, isError, error } = useStudent(id);
  const { mutate: togglePayment, isPending: isUpdatingPayment } = useUpdatePayment();
  const { data: lessonSummaries = [], isLoading: isLoadingSummaries } = useLessonSummaries(id);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="h-6 w-32 rounded-full bg-gray-200" />
          </div>
          <div className="h-40 w-full rounded-2xl bg-gray-200" />
          <div className="h-64 w-full rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !student) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10" dir="rtl">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">התלמיד לא נמצא</p>
            <p className="mt-0.5 text-red-600/80">{error?.message ?? 'שגיאה לא ידועה'}</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedHomeworks = [...(student.homeworks ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  function handlePaymentToggle() {
    togglePayment({ id: student!.id, paid: !student!.payment_paid });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6" dir="rtl">

      {/* ── Profile header card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          {/* Left — identity */}
          <div>
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
                <p className="text-xs text-gray-400 mt-0.5">ID: {student.id.slice(0, 8)}…</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {stageBadge(student.syllabus_stage_index)}
              {scriptBadge(student.script_preference)}
              <a
                href="#"
                id="google-drive-link"
                onClick={(e) => e.preventDefault()}
                title="Google Drive — link not configured"
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-200 hover:bg-gray-100 transition-colors cursor-not-allowed"
                aria-disabled="true"
              >
                <FolderOpen size={12} />
                📁 Google Drive
              </a>
            </div>
          </div>

          {/* Right — CTA */}
          <div className="flex flex-col gap-2 self-start">
            <button
              id="document-lesson-btn"
              onClick={() => navigate(`/create?studentId=${student.id}`)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
            >
              <Rocket size={15} />
              📚 תיעוד שיעור ויצירת מטלה
            </button>
          </div>
        </div>

        {/* Optional notes */}
        {student.general_notes && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-800" dir="rtl">
            <span className="font-semibold">הערות: </span>{student.general_notes}
          </div>
        )}
      </div>

      {/* ── Payment tracker card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={16} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">סטטוס תשלום</h2>
            </div>
            <p className="text-xs text-gray-400">מתעדכן מיידית במסד הנתונים.</p>
          </div>

          <button
            id="payment-toggle-btn"
            onClick={handlePaymentToggle}
            disabled={isUpdatingPayment}
            className={[
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60',
              student.payment_paid
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-100',
            ].join(' ')}
            aria-label={student.payment_paid ? 'סמן כלא שולם' : 'סמן כשולם'}
          >
            {isUpdatingPayment ? (
              <Loader2 size={14} className="animate-spin" />
            ) : student.payment_paid ? (
              <CheckCircle2 size={14} />
            ) : (
              <XCircle size={14} />
            )}
            {student.payment_paid ? 'שולם ✓' : 'לא שולם — לחץ לסימון'}
          </button>
        </div>
      </div>

      {/* ── Lesson Summaries card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={15} className="text-violet-500" />
            <h2 className="text-sm font-semibold text-gray-900">סיכומי שיעורים</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {lessonSummaries.length} שיעור{lessonSummaries.length !== 1 ? 'ים' : ''} מסוכמ{lessonSummaries.length !== 1 ? 'ים' : ''}
          </p>
        </div>

        <div className="p-4">
          {isLoadingSummaries ? (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              טוען סיכומים...
            </div>
          ) : lessonSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ClipboardList size={28} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">אין סיכומי שיעורים עדיין</p>
              <p className="mt-1 text-xs text-gray-400">לחץ על "תיעוד שיעור ויצירת מטלה" כדי להוסיף ראשון.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {[...lessonSummaries]
                .sort((a, b) => new Date(b.date ?? b.created_at ?? 0).getTime() - new Date(a.date ?? a.created_at ?? 0).getTime())
                .map((s, i) => (
                  <LessonSummaryRow
                    key={s.id}
                    summary={s}
                    index={lessonSummaries.length - i}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Homework history card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">היסטוריית שיעורי בית</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {sortedHomeworks.length} חבילה{sortedHomeworks.length !== 1 ? 'ות' : ''} נוצר{sortedHomeworks.length !== 1 ? 'ו' : 'ה'}
          </p>
        </div>

        <div className="p-4">
          {sortedHomeworks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen size={28} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">אין שיעורי בית עדיין</p>
              <p className="mt-1 text-xs text-gray-400">
                לחץ על "תיעוד שיעור ויצירת מטלה" כדי ליצור את הראשון.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedHomeworks.map((hw, i) => (
                <HomeworkRow key={hw.id} hw={hw} index={sortedHomeworks.length - i} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
