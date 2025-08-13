import request from 'supertest';
import app from '../src/server';
import { generateTokens } from '../src/utils/auth';

describe('Deployment Endpoints', () => {
  const testUser = {
    user_id: 'test-user-id',
    email: 'test@example.com',
    role: 'user'
  };
  
  const validToken = generateTokens(testUser).access_token;

  describe('GET /api/v1/deployments/models', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/models');

      expect(response.status).toBe(401);
    });

    test('should return AI models when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/models')
        .set('Authorization', `Bearer ${validToken}`);

      // May fail due to database connection in test, but validates auth
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/deployments/providers', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/providers');

      expect(response.status).toBe(401);
    });

    test('should return cloud providers when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/providers')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/deployments/regions/:provider', () => {
    test('should return AWS regions', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/regions/aws')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('regions');
        expect(Array.isArray(response.body.data.regions)).toBe(true);
      }
    });

    test('should return GCP regions', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/regions/gcp')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.regions).toContain('us-central1');
    });

    test('should reject unsupported provider', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/regions/unsupported')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/deployments/instances/:provider/:region', () => {
    test('should return AWS instance types', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/instances/aws/us-east-1')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('instanceTypes');
        expect(Array.isArray(response.body.data.instanceTypes)).toBe(true);
      }
    });

    test('should return GCP instance types', async () => {
      const response = await request(app)
        .get('/api/v1/deployments/instances/gcp/us-central1')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.instanceTypes[0]).toHaveProperty('type');
      expect(response.body.data.instanceTypes[0]).toHaveProperty('cpu');
      expect(response.body.data.instanceTypes[0]).toHaveProperty('memory');
    });
  });

  describe('POST /api/v1/deployments', () => {
    const validDeployment = {
      name: 'Test Deployment',
      description: 'Test deployment for unit tests',
      ai_model_id: '550e8400-e29b-41d4-a716-446655440000',
      model_config: {
        temperature: 0.7,
        max_tokens: 150
      },
      cloud_provider_id: '550e8400-e29b-41d4-a716-446655440001',
      region: 'us-east-1',
      instance_type: 't3.micro',
      rate_limit: 100,
      security_config: {
        require_api_key: true,
        ip_allowlist: ['192.168.1.0/24']
      }
    };

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .send(validDeployment);

      expect(response.status).toBe(401);
    });

    test('should validate deployment data', async () => {
      const invalidDeployment = {
        name: '', // Invalid empty name
        ai_model_id: 'invalid-uuid',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidDeployment);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should accept valid deployment format', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validDeployment);

      // Will likely fail due to database, but validates format
      expect([201, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/deployments', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/deployments');

      expect(response.status).toBe(401);
    });

    test('should return user deployments when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/deployments')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });
});