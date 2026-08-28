import { Router } from 'express';
import studentRoutes from './student.routes';
import homeworkRoutes from './homework.routes';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Resource routes
router.use('/students', studentRoutes);
router.use('/homeworks', homeworkRoutes);

export default router;
