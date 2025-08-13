# AI Infrastructure Management Platform - Backend API

A comprehensive Node.js/Express backend for managing AI model deployments across cloud providers with minimal technical knowledge required.

## 🚀 Features

- **AI Deployment Wizard**: Step-by-step deployment process for AI models
- **Multi-Cloud Support**: AWS (primary), Google Cloud, Azure integrations
- **Real-time Monitoring**: Performance metrics, costs, and usage analytics
- **Instance Management**: Start, stop, scale, and troubleshoot deployments
- **Authentication & Security**: JWT-based auth with encrypted API key storage
- **Comprehensive Logging**: System logs with different levels and contexts

## 🏗️ Architecture

```
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.sql # PostgreSQL schema
│   │   └── supabase.ts  # Database connection
│   ├── controllers/     # Route handlers
│   │   ├── AuthController.ts
│   │   ├── DeploymentController.ts
│   │   ├── MonitoringController.ts
│   │   └── ManagementController.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication middleware
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/          # TypeScript type definitions
│   │   └── types.ts
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic services
│   │   ├── DatabaseService.ts
│   │   └── CloudService.ts
│   ├── utils/           # Utility functions
│   │   ├── auth.ts      # JWT & encryption utilities
│   │   └── logger.ts    # Winston logger setup
│   └── server.ts        # Express server setup
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Cloud Provider**: AWS SDK (EC2, CloudWatch)
- **Validation**: Joi schema validation
- **Logging**: Winston
- **Language**: TypeScript

## 🔧 Environment Setup

1. **Clone and install dependencies**:
```bash
cd backend
npm install
```

2. **Environment variables** (copy `.env.example` to `.env`):
```bash
# Server Configuration
PORT=3000
NODE_ENV=development
API_VERSION=v1

# Database Configuration (Supabase)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_EXPIRES_IN=24h

# Encryption (32 characters for API keys)
ENCRYPTION_KEY=your_32_character_encryption_key

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Database Setup**:
```bash
# Run the SQL schema in your Supabase database
psql -h your-supabase-host -d postgres -f src/config/database.sql
```

4. **Start Development Server**:
```bash
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/v1/auth/register`
Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "company": "Acme Corp"
}
```

#### POST `/api/v1/auth/login`
Login with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### POST `/api/v1/auth/refresh`
Refresh access token using refresh token.

### Deployment Endpoints

#### GET `/api/v1/deployments/models`
Get available AI models for deployment.

#### GET `/api/v1/deployments/providers`
Get supported cloud providers.

#### GET `/api/v1/deployments/regions/:provider`
Get available regions for a cloud provider.

#### POST `/api/v1/deployments`
Create a new deployment configuration.

**Request Body**:
```json
{
  "name": "My AI Model",
  "description": "GPT-4 deployment for customer support",
  "ai_model_id": "uuid-of-ai-model",
  "model_config": {
    "temperature": 0.7,
    "max_tokens": 150
  },
  "cloud_provider_id": "uuid-of-aws-provider",
  "region": "us-east-1",
  "instance_type": "t3.medium",
  "rate_limit": 100,
  "security_config": {
    "require_api_key": true,
    "ip_allowlist": ["192.168.1.0/24"]
  }
}
```

#### POST `/api/v1/deployments/:id/deploy`
Deploy the configured model to cloud infrastructure.

### Monitoring Endpoints

#### GET `/api/v1/monitoring/deployments/:id/metrics`
Get performance metrics for a deployment.

**Query Parameters**:
- `startDate`: ISO date string (default: 24h ago)
- `endDate`: ISO date string (default: now)
- `interval`: `5m`, `1h`, `1d`

#### GET `/api/v1/monitoring/deployments/:id/metrics/realtime`
Get real-time metrics and status.

#### GET `/api/v1/monitoring/analytics/usage`
Get usage analytics across all deployments.

#### GET `/api/v1/monitoring/analytics/costs`
Get cost breakdown and projections.

### Management Endpoints

#### POST `/api/v1/management/deployments/:id/start`
Start a stopped instance.

#### POST `/api/v1/management/deployments/:id/stop`
Stop a running instance.

#### POST `/api/v1/management/deployments/:id/restart`
Restart an instance.

#### GET `/api/v1/management/deployments/:id/logs`
Get deployment logs.

**Query Parameters**:
- `level`: `INFO`, `WARN`, `ERROR`, `DEBUG`
- `limit`: Number of logs to return (default: 100)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **API Key Encryption**: AES-256-CBC encryption for cloud provider keys
- **Rate Limiting**: Configurable request rate limits
- **Input Validation**: Joi schema validation for all endpoints
- **CORS Protection**: Configurable CORS origins
- **Helmet Security**: Security headers via Helmet.js

## 📊 Database Schema

The PostgreSQL schema includes:

- **users**: User accounts and profiles
- **ai_models**: Available AI models and configurations
- **cloud_providers**: Supported cloud platforms
- **deployments**: User deployment configurations
- **deployment_metrics**: Time-series performance data
- **usage_analytics**: Aggregated daily usage statistics
- **system_logs**: Application and deployment logs
- **alerts**: Monitoring alert configurations
- **backups**: Backup metadata and restore points

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## 🚀 Deployment

### Railway Deployment

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Environment Variables**: Set all required environment variables in Railway dashboard
3. **Database**: Use Railway PostgreSQL add-on or external Supabase
4. **Deploy**: Railway will automatically deploy on git push

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## 📈 Monitoring & Logging

- **Winston Logger**: Structured logging with multiple transports
- **Health Check**: GET `/health` endpoint for monitoring
- **Error Tracking**: Comprehensive error handling and logging
- **Metrics Collection**: CloudWatch integration for AWS instances

## 🔧 Configuration

### Cloud Provider Setup

**AWS Configuration**:
1. Create IAM user with EC2, CloudWatch permissions
2. Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
3. Ensure security groups allow necessary ports (8000 for AI service)

**Supabase Setup**:
1. Create new Supabase project
2. Run the provided SQL schema
3. Set up Row Level Security (RLS) policies
4. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please check:
1. This README for common setup issues
2. Environment variable configuration
3. Database schema and migrations
4. API endpoint documentation

## 🎯 Next Steps (Phase 2)

- WebSocket support for real-time monitoring
- Advanced alerting system with notifications
- Multi-region deployment support
- Auto-scaling policies
- Cost optimization recommendations
- Enhanced security with OAuth providers
- API rate limiting per user/deployment
- Comprehensive test suite
- CI/CD pipeline setup