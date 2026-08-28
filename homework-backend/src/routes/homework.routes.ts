import { Router } from 'express';
import { homeworkController } from '../controllers/homework.controller';
import { whiteboardUpload } from '../middlewares/upload.middleware';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

// ── Step 1: Extract vocabulary from 1–5 whiteboard images ──────────────────
// POST /api/homeworks/extract-vocabulary
// Content-Type: multipart/form-data, field: "whiteboards"
router.post(
  '/extract-vocabulary',
  whiteboardUpload.array('whiteboards', 5),
  asyncHandler((req, res) => homeworkController.extractVocabulary(req, res))
);

// ── Step 2: Generate homework from verified vocabulary ──────────────────────
// POST /api/homeworks/generate
// Content-Type: application/json, body: { student_id, verified_vocabulary }
router.post(
  '/generate',
  asyncHandler((req, res) => homeworkController.generateHomework(req, res))
);

// ── Standard CRUD routes ────────────────────────────────────────────────────
router.get('/', asyncHandler((req, res) => homeworkController.getAllHomeworks(req, res)));
router.get('/:id', asyncHandler((req, res) => homeworkController.getHomeworkById(req, res)));
router.post('/', asyncHandler((req, res) => homeworkController.createHomework(req, res)));
router.put('/:id', asyncHandler((req, res) => homeworkController.updateHomework(req, res)));
router.delete('/:id', asyncHandler((req, res) => homeworkController.deleteHomework(req, res)));

export default router;
