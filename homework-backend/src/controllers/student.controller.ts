import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { AppDataSource } from '../config/data-source';
import { LessonSummary } from '../entities/LessonSummary';
import { SYLLABUS_TOPIC_IDS } from '../config/syllabus';

const studentService = new StudentService();

// Simple UUID v4 regex validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class StudentController {
  async getAllStudents(_req: Request, res: Response): Promise<void> {
    const students = await studentService.findAll();
    res.json({ success: true, data: students });
  }

  async getStudentById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError(`Invalid UUID format: "${id}"`);
    }

    const student = await studentService.findById(id);
    if (!student) {
      throw new NotFoundError(`Student with ID "${id}" not found`);
    }

    res.json({ success: true, data: student });
  }

  async createStudent(req: Request, res: Response): Promise<void> {
    const { name, syllabus_stage_index, script_preference, general_notes } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new BadRequestError('Field "name" is required and must be a non-empty string');
    }

    if (syllabus_stage_index === undefined || isNaN(Number(syllabus_stage_index))) {
      throw new BadRequestError('Field "syllabus_stage_index" is required and must be a valid integer');
    }

    if (
      script_preference &&
      !['hebrew_transliteration', 'arabic_letters'].includes(script_preference)
    ) {
      throw new BadRequestError(
        'Field "script_preference" must be either "hebrew_transliteration" or "arabic_letters"'
      );
    }

    const student = await studentService.create({
      name: name.trim(),
      syllabus_stage_index: parseInt(syllabus_stage_index, 10),
      script_preference: script_preference || 'hebrew_transliteration',
      general_notes: general_notes || null,
    });

    res.status(201).json({ success: true, data: student });
  }

  async updateStudent(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError(`Invalid UUID format: "${id}"`);
    }

    if (
      req.body.script_preference &&
      !['hebrew_transliteration', 'arabic_letters'].includes(req.body.script_preference)
    ) {
      throw new BadRequestError(
        'Field "script_preference" must be either "hebrew_transliteration" or "arabic_letters"'
      );
    }

    if (
      req.body.payment_paid !== undefined &&
      typeof req.body.payment_paid !== 'boolean'
    ) {
      throw new BadRequestError('Field "payment_paid" must be a boolean');
    }

    const student = await studentService.update(id, req.body);
    if (!student) {
      throw new NotFoundError(`Student with ID "${id}" not found`);
    }

    res.json({ success: true, data: student });
  }

  async deleteStudent(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError(`Invalid UUID format: "${id}"`);
    }

    const deleted = await studentService.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Student with ID "${id}" not found`);
    }

    res.json({ success: true, message: 'Student deleted successfully' });
  }

  // ── Lesson Summaries ──────────────────────────────────────────────────────

  /**
   * POST /api/students/:id/lessons
   * Body: { topicsCovered: string[], teacherNote?: string }
   * Creates a new LessonSummary for the given student.
   */
  async createLessonSummary(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError(`Invalid UUID format: "${id}"`);
    }

    const student = await studentService.findById(id);
    if (!student) {
      throw new NotFoundError(`Student with ID "${id}" not found`);
    }

    const { topicsCovered, teacherNote } = req.body;

    if (!Array.isArray(topicsCovered) || topicsCovered.length === 0) {
      throw new BadRequestError(
        'Field "topicsCovered" is required and must be a non-empty array of topic IDs'
      );
    }

    // Validate each topic ID against the known syllabus
    const invalidTopics = (topicsCovered as any[]).filter(
      (t) => typeof t !== 'string' || !SYLLABUS_TOPIC_IDS.includes(t)
    );
    if (invalidTopics.length > 0) {
      throw new BadRequestError(
        `Unknown topic IDs: ${invalidTopics.map(String).join(', ')}. ` +
        'Each ID must exist in the ARABIC_SYLLABUS.'
      );
    }

    if (teacherNote !== undefined && typeof teacherNote !== 'string') {
      throw new BadRequestError('Field "teacherNote" must be a string if provided');
    }

    const repo = AppDataSource.getRepository(LessonSummary);
    const lesson = repo.create({
      student_id: id,
      topicsCovered: topicsCovered as string[],
      teacherNote: typeof teacherNote === 'string' ? teacherNote.trim() || null : null,
    });

    const saved = await repo.save(lesson);
    res.status(201).json({ success: true, data: saved });
  }

  /**
   * GET /api/students/:id/lessons
   * Returns all lesson summaries for the student, newest first.
   */
  async getLessonSummaries(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError(`Invalid UUID format: "${id}"`);
    }

    const student = await studentService.findById(id);
    if (!student) {
      throw new NotFoundError(`Student with ID "${id}" not found`);
    }

    const repo = AppDataSource.getRepository(LessonSummary);
    const lessons = await repo.find({
      where: { student_id: id },
      order: { date: 'DESC' },
    });

    res.json({ success: true, data: lessons });
  }
}

export const studentController = new StudentController();
