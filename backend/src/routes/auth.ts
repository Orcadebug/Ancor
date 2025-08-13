import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { validateAuth } from '@/middleware/validation';
import { authenticateToken } from '@/middleware/auth';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', validateAuth.register, authController.register);
router.post('/login', validateAuth.login, authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, validateAuth.updateProfile, authController.updateProfile);
router.post('/logout', authenticateToken, authController.logout);

export default router;