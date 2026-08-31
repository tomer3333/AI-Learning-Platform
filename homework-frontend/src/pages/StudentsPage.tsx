import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronLeft, BookOpen, Languages, UserPlus, AlertCircle, PlusCircle, Search } from 'lucide-react';
import { useStudents } from '../hooks/useHomeworkAPI';
import type { Student, ScriptPreference } from '../types/homework';

// ── Helpers ───────────────────────────────────────────────────────────────────

function stageBadge(index: number) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
      <BookOpen size={11} />
      שלב {index}
    </span>
  );
}

function scriptBadge(pref: ScriptPreference) {
  const label = pref === 'arabic_letters' ? 'אותיות ערביות' : 'תעתיק עברי';
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
      <Languages size={11} />
      {label}
    </span>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 rounded-md bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-gray-200" />
            <div className="h-5 w-28 rounded-full bg-gray-200" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

// ── Student card ──────────────────────────────────────────────────────────────

interface StudentCardProps {
  student: Student;
  onView: (id: string) => void;
}

function StudentCard({ student, onView }: StudentCardProps) {
  const homeworkCount = student.homeworks?.length ?? 0;

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            {/* Avatar initial */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 leading-tight">{student.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {homeworkCount} {homeworkCount === 1 ? 'מטלה' : 'מטלות'} נוצרו
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stageBadge(student.syllabus_stage_index)}
            {scriptBadge(student.script_preference)}
            {student.payment_paid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                ✓ שולם
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-200">
                לא שולם
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        <button
          id={`view-student-${student.id}`}
          onClick={() => onView(student.id)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 group-hover:shadow-md"
        >
          פרופיל
          <ChevronLeft size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const navigate = useNavigate();
  const { data: students, isLoading, isError, error } = useStudents();
  const [search, setSearch] = useState('');

  const filtered = students?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10" dir="rtl">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 text-indigo-600 mb-1">
            <Users size={20} />
            <span className="text-xs font-semibold uppercase tracking-widest">ניהול תלמידים</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">תלמידים</h1>
          <p className="mt-1 text-sm text-gray-500">
            בחר תלמיד להצגת הפרופיל, תיעוד שיעור וייצור שיעורי בית.
          </p>
        </div>
        {/* Add student */}
        <button
          id="add-student-btn"
          onClick={() => navigate('/students/new')}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
        >
          <PlusCircle size={16} />
          הוסף תלמיד
        </button>
      </div>

      {/* Search bar */}
      {!isLoading && !isError && (students?.length ?? 0) > 0 && (
        <div className="relative mb-5">
          <Search size={15} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="search-students"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש תלמידים..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pe-10 ps-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            dir="rtl"
          />
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">שגיאה בטעינת התלמידים</p>
            <p className="mt-0.5 text-red-600/80">{error?.message ?? 'שגיאה לא ידועה'}</p>
          </div>
        </div>
      )}

      {/* Empty state — no students at all */}
      {!isLoading && !isError && students?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <UserPlus size={32} className="mb-4 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">אין תלמידים עדיין</p>
          <p className="mt-1 text-xs text-gray-400">
            לחץ על “הוסף תלמיד” כדי להתחיל.
          </p>
        </div>
      )}

      {/* Empty search result */}
      {!isLoading && !isError && students && students.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <Search size={28} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">לא נמצאו תלמידים עבור "{search}"</p>
        </div>
      )}

      {/* Student list */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onView={(id) => navigate(`/students/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
