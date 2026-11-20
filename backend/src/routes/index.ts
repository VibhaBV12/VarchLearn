import { Router } from 'express';
import { authenticate, requireRole, requireSelfOrAdmin } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { pdfUpload } from '../middleware/upload';
import { authController } from '../controllers/authController';
import { studentController } from '../controllers/studentController';
import { classController } from '../controllers/classController';
import { textbookController } from '../controllers/textbookController';
import { activityController } from '../controllers/activityController';
import { assessmentController } from '../controllers/assessmentController';
import { assignmentController } from '../controllers/assignmentController';
import { analyticsController } from '../controllers/analyticsController';
import { aiController } from '../controllers/aiController';

const router = Router();

// /auth
router.post('/auth/student/register', authRateLimiter, authController.registerStudent);
router.post('/auth/student/login', authRateLimiter, authController.loginStudent);
router.post('/auth/admin/login', authRateLimiter, authController.loginAdmin);
router.post('/auth/student/verify-pin', authRateLimiter, authController.verifyRecoveryPin);
router.post('/auth/student/reset-password', authRateLimiter, authController.resetPassword);
router.post('/auth/student/change-password', authenticate, requireRole('student'), authController.changePassword);
router.post('/auth/student/change-pin', authenticate, requireRole('student'), authController.changeRecoveryPin);
router.get('/auth/me', authenticate, authController.me);

// /admins
router.get('/admins/me', authenticate, requireRole('admin'), authController.me);

// /students
router.get('/students', authenticate, requireRole('admin'), studentController.listStudents);
router.post('/students', authenticate, requireRole('admin'), studentController.createStudent);
router.get('/students/:id', authenticate, requireSelfOrAdmin('id'), studentController.getStudent);
router.patch('/students/:id', authenticate, requireSelfOrAdmin('id'), studentController.updateStudent);
router.patch('/students/:id/toggle-status', authenticate, requireRole('admin'), studentController.toggleStatus);
router.delete('/students/:id', authenticate, requireRole('admin'), studentController.removeStudent);

// /classes
router.get('/classes', classController.listClasses); // Publicly readable for student registration dropdown
router.post('/classes', authenticate, requireRole('admin'), classController.createClass);
router.patch('/classes/:id', authenticate, requireRole('admin'), classController.updateClass);

// /textbooks & /chapters
router.get('/textbooks', authenticate, requireRole('admin'), textbookController.listTextbooks);
router.post('/textbooks/upload', authenticate, requireRole('admin'), pdfUpload.single('file'), textbookController.uploadAndExtractPdf);
router.get('/chapters', authenticate, requireRole('admin'), textbookController.listChapters);

// /activities
router.get('/activities', authenticate, activityController.listActivities);
router.post('/activities', authenticate, requireRole('admin'), activityController.createManualActivity);
router.post('/activities/generate', authenticate, requireRole('admin'), activityController.generateAiActivity);
router.patch('/activities/:id', authenticate, requireRole('admin'), activityController.updateActivity);
router.patch('/activities/:id/approval', authenticate, requireRole('admin'), activityController.updateApprovalStatus);

// /ai - Central Production-Quality AI Generation Engine
router.post('/ai/concept/extract', authenticate, requireRole('admin'), aiController.extractConcepts);
router.post('/ai/concept/generate', authenticate, requireRole('admin'), aiController.generateConceptExplanation);
router.post('/ai/modalities/generate', authenticate, requireRole('admin'), aiController.generateModalities);
router.post('/ai/activities/generate-batch', authenticate, requireRole('admin'), aiController.generateBatchActivities);
router.post('/ai/activities/generate-custom', authenticate, requireRole('admin'), aiController.generateCustomActivity);
router.post('/ai/activities/save', authenticate, requireRole('admin'), aiController.saveCustomActivity);
router.post('/ai/assessments/generate', authenticate, requireRole('admin'), aiController.generateAssessment);
router.post('/ai/assessments/save', authenticate, requireRole('admin'), aiController.saveGeneratedAssessment);
router.get('/ai/stats', authenticate, requireRole('admin'), aiController.getAiStats);

// /assessments
router.get('/assessments', authenticate, assessmentController.listAssessments);
router.get('/assessments/initial/status', authenticate, requireRole('student'), assessmentController.getInitialAssessmentStatus);
router.post('/assessments', authenticate, requireRole('admin'), assessmentController.createAssessment);
router.patch('/assessments/:id/publish', authenticate, requireRole('admin'), assessmentController.publishAssessment);
router.get('/assessments/:id/attempt', authenticate, requireRole('student'), assessmentController.getAttempt);
router.put('/assessments/:id/attempt', authenticate, requireRole('student'), assessmentController.saveAttemptProgress);
router.post('/assessments/:id/submit', authenticate, requireRole('student'), assessmentController.submitAssessment);

// /assignments
router.get('/assignments/student/:studentId?', authenticate, assignmentController.getStudentDailyPath);
router.get('/assignments/propose/:studentId', authenticate, requireRole('admin'), assignmentController.proposeAllocation);
router.post('/assignments/publish/:studentId', authenticate, requireRole('admin'), assignmentController.publishAllocation);
router.post('/assignments/nodes/:nodeId/complete', authenticate, assignmentController.completeNode);

// /progress, /rewards, /analytics, /settings
router.get('/progress/:studentId?', authenticate, analyticsController.getStudentProgress);
router.get('/rewards/:studentId?', authenticate, analyticsController.getStudentRewards);
router.get('/analytics/dashboard', authenticate, requireRole('admin'), analyticsController.getDashboardStats);
router.get('/settings', authenticate, analyticsController.getSettings);
router.put('/settings', authenticate, requireRole('admin'), analyticsController.updateSettings);

export default router;
