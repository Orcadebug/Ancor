import { Router } from 'express';
import { DeploymentController } from '@/controllers/DeploymentController';
import { authenticateToken } from '@/middleware/auth';
import { validateDeployment } from '@/middleware/validation';

const router = Router();
const deploymentController = new DeploymentController();

// All deployment routes require authentication
router.use(authenticateToken);

// Deployment Wizard endpoints
router.get('/models', deploymentController.getAvailableModels);
router.get('/providers', deploymentController.getCloudProviders);
router.get('/regions/:provider', deploymentController.getRegions);
router.get('/instances/:provider/:region', deploymentController.getInstanceTypes);

// Deployment CRUD
router.post('/', validateDeployment.create, deploymentController.createDeployment);
router.get('/', deploymentController.getUserDeployments);
router.get('/:id', deploymentController.getDeployment);
router.put('/:id', validateDeployment.update, deploymentController.updateDeployment);
router.delete('/:id', deploymentController.deleteDeployment);

// Deployment actions
router.post('/:id/deploy', deploymentController.deployInstance);
router.get('/:id/status', deploymentController.getDeploymentStatus);

export default router;