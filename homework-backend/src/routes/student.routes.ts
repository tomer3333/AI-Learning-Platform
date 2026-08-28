import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

router.get('/', asyncHandler((req, res) => studentController.getAllStudents(req, res)));
router.post('/', asyncHandler((req, res) => studentController.createStudent(req, res)));
router.get('/:id', asyncHandler((req, res) => studentController.getStudentById(req, res)));
router.put('/:id', asyncHandler((req, res) => studentController.updateStudent(req, res)));
router.delete('/:id', asyncHandler((req, res) => studentController.deleteStudent(req, res)));

// Lesson summary sub-routes
router.post('/:id/lessons', asyncHandler((req, res) => studentController.createLessonSummary(req, res)));
router.get('/:id/lessons', asyncHandler((req, res) => studentController.getLessonSummaries(req, res)));

export default router;
