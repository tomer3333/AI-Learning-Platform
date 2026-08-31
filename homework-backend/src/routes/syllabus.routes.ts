import { Router } from 'express';
import { ARABIC_SYLLABUS } from '../config/syllabus';

const router = Router();

/**
 * GET /api/syllabus
 * Returns the full ARABIC_SYLLABUS structure — categories and topics with IDs and Hebrew labels.
 * Used by the frontend to populate the stage picker without duplicating the config.
 */
router.get('/', (_req, res) => {
  res.json({ success: true, data: ARABIC_SYLLABUS });
});

export default router;
