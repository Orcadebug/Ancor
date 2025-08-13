import { Router } from 'express';
import { ManagementController } from '@/controllers/ManagementController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();
const managementController = new ManagementController();

// All management routes require authentication
router.use(authenticateToken);

// Instance control
router.post('/deployments/:id/start', managementController.startInstance);
router.post('/deployments/:id/stop', managementController.stopInstance);
router.post('/deployments/:id/restart', managementController.restartInstance);
router.post('/deployments/:id/scale', managementController.scaleInstance);

// Logs
router.get('/deployments/:id/logs', managementController.getInstanceLogs);
router.get('/deployments/:id/logs/download', managementController.downloadLogs);

// Backup & Restore
router.post('/deployments/:id/backup', managementController.createBackup);
router.get('/deployments/:id/backups', managementController.listBackups);
router.post('/deployments/:id/restore/:backupId', managementController.restoreFromBackup);

// Troubleshooting
router.post('/deployments/:id/troubleshoot', managementController.runDiagnostics);
router.post('/deployments/:id/clear-cache', managementController.clearCache);

export default router;