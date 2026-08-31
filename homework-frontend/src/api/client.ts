import axios, { AxiosError } from 'axios';
import type {
  VocabularyItem,
  HomeworkResult,
  ApiSuccessResponse,
  Student,
  StudentWithHistory,
  LessonSummary,
  CreateLessonSummaryPayload,
  SyllabusCategory,
  CreateStudentPayload,
} from '../types/homework';

// ─── Axios instance ───────────────────────────────────────────────────────────

export const apiClient = axios.create({
  // Use a relative base so Vite's dev-server proxy handles CORS-free forwarding.
  // In production, swap this for the absolute backend URL via an env variable.
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Response interceptor: extract backend error messages ────────────────────
// Without this, Axios surfaces "Request failed with status code 400" instead
// of the actual validation/error message from the backend JSON body.

apiClient.interceptors.response.use(
  // Pass-through on success
  (response) => response,
  // Transform errors to always carry the backend `message` field
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const backendMessage = error.response?.data?.message;
    if (backendMessage) {
      // Replace the generic Axios message with the human-readable backend message
      error.message = backendMessage;
    }
    return Promise.reject(error);
  }
);

// ─── Step 1: Extract vocabulary from whiteboard images ───────────────────────

/**
 * Sends 1–5 whiteboard images as multipart/form-data under the key "whiteboards".
 * Maps to: POST /api/homeworks/extract-vocabulary
 */
export async function extractVocabulary(
  files: FileList | File[]
): Promise<VocabularyItem[]> {
  const form = new FormData();
  const fileArray = Array.from(files);

  if (fileArray.length === 0) {
    throw new Error('At least one whiteboard image is required.');
  }
  if (fileArray.length > 5) {
    throw new Error('A maximum of 5 whiteboard images are allowed.');
  }

  fileArray.forEach((file) => {
    form.append('whiteboards', file);
  });

  const { data } = await apiClient.post<ApiSuccessResponse<VocabularyItem[]>>(
    '/homeworks/extract-vocabulary',
    form,
    {
      // Let the browser set the correct multipart boundary automatically.
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );

  return data.data;
}

// ─── Step 2: Generate homework from verified vocabulary ───────────────────────

/**
 * Sends the teacher-verified vocabulary list along with the student ID.
 * Maps to: POST /api/homeworks/generate
 */
export async function generateHomework(
  studentId: string,
  verifiedVocabulary: VocabularyItem[],
  selectedTypes: string[] = []
): Promise<HomeworkResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<HomeworkResult>>(
    '/homeworks/generate',
    {
      student_id: studentId,
      verified_vocabulary: verifiedVocabulary,
      selected_types: selectedTypes,
    }
  );

  return data.data;
}

// ─── CRM: Students ────────────────────────────────────────────────────────────

/**
 * Fetches all students (each includes their embedded homeworks array).
 * Maps to: GET /api/students
 */
export async function getStudents(): Promise<Student[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Student[]>>('/students');
  return data.data;
}

/**
 * Fetches a single student with full homework history (newest-first).
 * Maps to: GET /api/students/:id
 */
export async function getStudentById(id: string): Promise<StudentWithHistory> {
  const { data } = await apiClient.get<ApiSuccessResponse<StudentWithHistory>>(
    `/students/${id}`
  );
  return data.data;
}

/**
 * Toggles the DB-persisted payment status for a student.
 * Maps to: PUT /api/students/:id  { payment_paid: boolean }
 */
export async function updatePaymentStatus(
  id: string,
  paid: boolean
): Promise<Student> {
  const { data } = await apiClient.put<ApiSuccessResponse<Student>>(
    `/students/${id}`,
    { payment_paid: paid }
  );
  return data.data;
}

// ─── Lesson Summaries ────────────────────────────────────────────────────────────────

/**
 * Creates a new lesson summary for a student.
 * Maps to: POST /api/students/:id/lessons
 */
export async function createLessonSummary(
  studentId: string,
  payload: CreateLessonSummaryPayload
): Promise<LessonSummary> {
  const { data } = await apiClient.post<ApiSuccessResponse<LessonSummary>>(
    `/students/${studentId}/lessons`,
    payload
  );
  return data.data;
}

/**
 * Fetches all lesson summaries for a student (newest-first).
 * Maps to: GET /api/students/:id/lessons
 */
export async function getLessonSummaries(
  studentId: string
): Promise<LessonSummary[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<LessonSummary[]>>(
    `/students/${studentId}/lessons`
  );
  return data.data;
}

// ─── Syllabus ─────────────────────────────────────────────────────────────────

/**
 * Returns the authoritative ARABIC_SYLLABUS (categories + topics) from the backend.
 * Maps to: GET /api/syllabus
 */
export async function getSyllabus(): Promise<SyllabusCategory[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<SyllabusCategory[]>>('/syllabus');
  return data.data;
}

// ─── Create student ───────────────────────────────────────────────────────────

/**
 * Creates a new student.
 * Maps to: POST /api/students
 */
export async function createStudent(payload: CreateStudentPayload): Promise<Student> {
  const { data } = await apiClient.post<ApiSuccessResponse<Student>>('/students', payload);
  return data.data;
}
