import { Router } from 'express';
import { MonitoringController } from '@/controllers/MonitoringController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();
const monitoringController = new MonitoringController();

// All monitoring routes require authentication
router.use(authenticateToken);

// Real-time metrics
router.get('/deployments/:id/metrics', monitoringController.getDeploymentMetrics);
router.get('/deployments/:id/metrics/realtime', monitoringController.getRealTimeMetrics);

// Usage analytics
router.get('/analytics/usage', monitoringController.getUsageAnalytics);
router.get('/analytics/costs', monitoringController.getCostAnalytics);
router.get('/analytics/performance', monitoringController.getPerformanceAnalytics);

// Alerts
router.get('/alerts', monitoringController.getAlerts);
router.post('/alerts', monitoringController.createAlert);
router.put('/alerts/:id', monitoringController.updateAlert);
router.delete('/alerts/:id', monitoringController.deleteAlert);

// Health checks
router.get('/deployments/:id/health', monitoringController.getDeploymentHealth);

export default router;