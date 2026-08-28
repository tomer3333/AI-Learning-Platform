import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  extractVocabulary,
  generateHomework,
  getStudents,
  getStudentById,
  updatePaymentStatus,
  createLessonSummary,
  getLessonSummaries,
} from '../api/client';
import type { VocabularyItem, HomeworkResult, Student, StudentWithHistory, LessonSummary, CreateLessonSummaryPayload } from '../types/homework';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  students: ['students'] as const,
  student: (id: string) => ['students', id] as const,
  lessonSummaries: (id: string) => ['students', id, 'lessons'] as const,
};

// ─── Hook: Extract vocabulary ─────────────────────────────────────────────────

/**
 * Wraps extractVocabulary() in a TanStack Query useMutation.
 *
 * Usage:
 *   const { mutate, isPending, isError, error, data } = useExtractMutation();
 *   mutate(fileList);
 */
export function useExtractMutation() {
  return useMutation<VocabularyItem[], Error, FileList | File[]>({
    mutationFn: (files) => extractVocabulary(files),
  });
}

// ─── Hook: Generate homework ──────────────────────────────────────────────────

interface GeneratePayload {
  studentId: string;
  verifiedVocabulary: VocabularyItem[];
}

/**
 * Wraps generateHomework() in a TanStack Query useMutation.
 * Invalidates the student query on success so the profile history refreshes.
 *
 * Usage:
 *   const { mutate, isPending, isError, error, data } = useGenerateMutation();
 *   mutate({ studentId, verifiedVocabulary });
 */
export function useGenerateMutation() {
  const queryClient = useQueryClient();
  return useMutation<HomeworkResult, Error, GeneratePayload>({
    mutationFn: ({ studentId, verifiedVocabulary }) =>
      generateHomework(studentId, verifiedVocabulary),
    onSuccess: (_result, { studentId }) => {
      // Refresh the student profile so the new homework appears in history.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student(studentId) });
    },
  });
}

// ─── Hook: All students list ──────────────────────────────────────────────────

/**
 * Fetches the full student roster for the dashboard home page.
 */
export function useStudents() {
  return useQuery<Student[], Error>({
    queryKey: QUERY_KEYS.students,
    queryFn: getStudents,
  });
}

// ─── Hook: Single student with homework history ───────────────────────────────

/**
 * Fetches one student (with embedded homeworks) for the profile page.
 */
export function useStudent(id: string) {
  return useQuery<StudentWithHistory, Error>({
    queryKey: QUERY_KEYS.student(id),
    queryFn: () => getStudentById(id),
    enabled: Boolean(id),
  });
}

// ─── Hook: Update payment status ──────────────────────────────────────────────

/**
 * Flips payment_paid in the DB via PUT /api/students/:id.
 * Uses optimistic updates: the cache is updated immediately and rolled back
 * on error, so the toggle feels instant with no loading spinner.
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation<Student, Error, { id: string; paid: boolean }>({
    mutationFn: ({ id, paid }) => updatePaymentStatus(id, paid),

    onMutate: async ({ id, paid }) => {
      // Cancel any in-flight refetches to avoid race conditions.
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.student(id) });

      // Snapshot the current value for potential rollback.
      const previous = queryClient.getQueryData<StudentWithHistory>(
        QUERY_KEYS.student(id)
      );

      // Optimistically update the cache.
      if (previous) {
        queryClient.setQueryData<StudentWithHistory>(QUERY_KEYS.student(id), {
          ...previous,
          payment_paid: paid,
        });
      }

      return { previous };
    },

    onError: (_err, { id }, context) => {
      // Roll back to the snapshot on error.
      const ctx = context as { previous?: StudentWithHistory } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(QUERY_KEYS.student(id), ctx.previous);
      }
    },

    onSettled: (_data, _err, { id }) => {
      // Always refetch after mutation to ensure consistency.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student(id) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students });
    },
  });
}

// ─── Hook: Lesson Summaries ────────────────────────────────────────────────────────────────

/**
 * Fetches the lesson summary history for a student.
 */
export function useLessonSummaries(studentId: string) {
  return useQuery<LessonSummary[], Error>({
    queryKey: QUERY_KEYS.lessonSummaries(studentId),
    queryFn: () => getLessonSummaries(studentId),
    enabled: Boolean(studentId),
  });
}

interface CreateLessonSummaryVars {
  studentId: string;
  payload: CreateLessonSummaryPayload;
}

/**
 * Creates a new lesson summary and invalidates the lesson summaries cache on success.
 */
export function useCreateLessonSummary() {
  const queryClient = useQueryClient();
  return useMutation<LessonSummary, Error, CreateLessonSummaryVars>({
    mutationFn: ({ studentId, payload }) => createLessonSummary(studentId, payload),
    onSuccess: (_result, { studentId }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lessonSummaries(studentId) });
    },
  });
}
