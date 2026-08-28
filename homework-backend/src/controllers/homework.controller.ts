import { Request, Response } from 'express';
import { HomeworkService } from '../services/homework.service';
import { StudentService } from '../services/student.service';
import {
  extractVocabularyFromImages,
  generateHomeworkFromVocabulary,
  ExtractedVocabularyItem,
} from '../services/ai.service';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { AppDataSource } from '../config/data-source';
import { LessonSummary } from '../entities/LessonSummary';
import { ARABIC_SYLLABUS } from '../config/syllabus';

const homeworkService = new HomeworkService();
const studentService = new StudentService();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class HomeworkController {
  async getAllHomeworks(req: Request, res: Response): Promise<void> {
    const studentId = req.query.student_id as string | undefined;
    if (studentId && !UUID_REGEX.test(studentId)) {
      throw new BadRequestError(`Invalid student_id query parameter UUID: "${studentId}"`);
    }

    const homeworks = await homeworkService.findAll(studentId);
    res.json({ success: true, data: homeworks });
  }

  async getHomeworkById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError(`Invalid UUID format: "${id}"`);
    }

    const homework = await homeworkService.findById(id);
    if (!homework) {
      throw new NotFoundError(`Homework with ID "${id}" not found`);
    }

    res.json({ success: true, data: homework });
  }

  async createHomework(req: Request, res: Response): Promise<void> {
    const { student_id, status, content, whiteboard_image_url } = req.body;

    if (!student_id || !UUID_REGEX.test(student_id)) {
      throw new BadRequestError('Field "student_id" is required and must be a valid UUID');
    }

    // Verify parent student exists to avoid unhandled foreign key constraints
    const student = await studentService.findById(student_id);
    if (!student) {
      throw new NotFoundError(`Referenced student with ID "${student_id}" does not exist`);
    }

    const homework = await homeworkService.create({
      student_id,
      status: status || 'draft',
      content: typeof content === 'object' && content !== null ? content : {},
      whiteboard_image_url: whiteboard_image_url || null,
    });

    res.status(201).json({ success: true, data: homework });
  }

  async updateHomework(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError(`Invalid UUID format: "${id}"`);
    }

    if (req.body.student_id) {
      if (!UUID_REGEX.test(req.body.student_id)) {
        throw new BadRequestError('Field "student_id" must be a valid UUID');
      }
      const student = await studentService.findById(req.body.student_id);
      if (!student) {
        throw new NotFoundError(`Referenced student with ID "${req.body.student_id}" does not exist`);
      }
    }

    const homework = await homeworkService.update(id, req.body);
    if (!homework) {
      throw new NotFoundError(`Homework with ID "${id}" not found`);
    }

    res.json({ success: true, data: homework });
  }

  async deleteHomework(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestError(`Invalid UUID format: "${id}"`);
    }

    const deleted = await homeworkService.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Homework with ID "${id}" not found`);
    }

    res.json({ success: true, message: 'Homework deleted successfully' });
  }

  /**
   * Step 1 — Extraction: Images → Vocabulary
   * POST /api/homeworks/extract-vocabulary
   * Body: multipart/form-data with field name "whiteboards" (1–5 images)
   * Returns: JSON array of { arabic_phonetic, hebrew_definition }
   */
  async extractVocabulary(req: Request, res: Response): Promise<void> {
    // Explicit typed cast: multer .array() populates req.files as Express.Multer.File[]
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      throw new BadRequestError(
        'At least one whiteboard image is required in the "whiteboards" field'
      );
    }

    // Re-assign as definite type — guards above have already ruled out undefined/empty
    const typedFiles: Express.Multer.File[] = files;

    const vocabulary = await extractVocabularyFromImages(typedFiles);

    res.status(200).json({
      success: true,
      data: vocabulary,
    });
  }

  /**
   * Step 2 — Generation: Verified Vocabulary → Homework Package
   * POST /api/homeworks/generate
   * Body JSON: { student_id: string, verified_vocabulary: ExtractedVocabularyItem[] }
   * Returns: Saved Homework record with generated homework_package in content column
   */
  async generateHomework(req: Request, res: Response): Promise<void> {
    const { student_id, verified_vocabulary } = req.body;

    if (!student_id || !UUID_REGEX.test(student_id)) {
      throw new BadRequestError('Field "student_id" is required and must be a valid UUID');
    }

    if (!Array.isArray(verified_vocabulary) || verified_vocabulary.length === 0) {
      throw new BadRequestError(
        'Field "verified_vocabulary" is required and must be a non-empty array'
      );
    }

    // Single-pass structural validation: short-circuit on first malformed item
    const malformedItem = (verified_vocabulary as any[]).find(
      (item) =>
        item === null ||
        typeof item !== 'object' ||
        typeof item.arabic_phonetic !== 'string' ||
        item.arabic_phonetic.trim() === '' ||
        typeof item.hebrew_definition !== 'string' ||
        item.hebrew_definition.trim() === ''
    );
    if (malformedItem !== undefined) {
      throw new BadRequestError(
        'Each item in "verified_vocabulary" must be an object with non-empty ' +
        '"arabic_phonetic" (string) and "hebrew_definition" (string)'
      );
    }

    const student = await studentService.findById(student_id);
    if (!student) {
      throw new NotFoundError(`Student with ID "${student_id}" not found`);
    }

    // ── Fetch lesson context (most recent lesson summary) ──────────────────
    // Build a flat map from topic ID → Hebrew label for quick lookup
    const topicLabelMap = new Map<string, string>();
    for (const category of ARABIC_SYLLABUS) {
      for (const topic of category.topics) {
        topicLabelMap.set(topic.id, topic.label);
      }
    }

    const lessonRepo = AppDataSource.getRepository(LessonSummary);
    const latestLesson = await lessonRepo.findOne({
      where: { student_id: student.id },
      order: { date: 'DESC' },
    });

    // Map topic IDs → Hebrew labels; silently skip any unknown IDs
    const topicsLabels: string[] = latestLesson
      ? latestLesson.topicsCovered
          .map((id) => topicLabelMap.get(id))
          .filter((label): label is string => label !== undefined)
      : [];

    const teacherNote: string | null = latestLesson?.teacherNote ?? null;

    if (latestLesson) {
      console.log(
        `[HomeworkController] Using lesson context from ${latestLesson.date.toISOString()} ` +
        `(${topicsLabels.length} topics, teacherNote: ${teacherNote !== null ? 'yes' : 'no'})`
      );
    } else {
      console.log(
        '[HomeworkController] No lesson summary found for student — using fallback (stage-based) prompt'
      );
    }
    // ──────────────────────────────────────────────────────────────────────────

    const homeworkPackage = await generateHomeworkFromVocabulary(
      student.syllabus_stage_index,
      student.script_preference,
      verified_vocabulary as ExtractedVocabularyItem[],
      topicsLabels,
      teacherNote
    );

    const homework = await homeworkService.create({
      student_id: student.id,
      status: 'draft',
      content: homeworkPackage,
    });

    res.status(201).json({
      success: true,
      data: homework,
    });
  }
}

export const homeworkController = new HomeworkController();
