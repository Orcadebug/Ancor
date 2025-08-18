import { Router } from 'express';
import { DeploymentController } from '@/controllers/DeploymentController.js';
import { authenticate, requireRole, auditLog } from '@/middleware/auth.js';

const router = Router();
const deploymentController = new DeploymentController();

// Apply authentication to all routes
router.use(authenticate);

// Get available models and regions (no special permissions needed)
router.get('/models', deploymentController.getAvailableModels.bind(deploymentController));
router.get('/regions', deploymentController.getAvailableRegions.bind(deploymentController));

// Deployment CRUD operations
router.get(
  '/',
  auditLog('list_deployments', 'deployment'),
  deploymentController.getDeployments.bind(deploymentController)
);

router.post(
  '/',
  requireRole('EDITOR'),
  auditLog('create_deployment', 'deployment'),
  deploymentController.createDeployment.bind(deploymentController)
);

router.get(
  '/:id',
  auditLog('view_deployment', 'deployment'),
  deploymentController.getDeployment.bind(deploymentController)
);

router.patch(
  '/:id',
  requireRole('EDITOR'),
  auditLog('update_deployment', 'deployment'),
  deploymentController.updateDeployment.bind(deploymentController)
);

router.delete(
  '/:id',
  requireRole('ADMIN'),
  auditLog('delete_deployment', 'deployment'),
  deploymentController.deleteDeployment.bind(deploymentController)
);

// Deployment management operations
router.post(
  '/:id/scale',
  requireRole('EDITOR'),
  auditLog('scale_deployment', 'deployment'),
  deploymentController.scaleDeployment.bind(deploymentController)
);

router.get(
  '/:id/health',
  auditLog('check_deployment_health', 'deployment'),
  deploymentController.getDeploymentHealth.bind(deploymentController)
);

export default router;