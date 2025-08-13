# AI Infrastructure Management Platform

A comprehensive platform that allows businesses to deploy and manage AI models on cloud providers with minimal technical knowledge.

## 🎯 Project Overview

This platform enables users to:
- **Deploy AI Models**: Simple wizard-based deployment of GPT-4, Claude, Llama, and custom models
- **Monitor Performance**: Real-time metrics, cost tracking, and usage analytics
- **Manage Infrastructure**: Start/stop instances, scale resources, view logs, and troubleshoot
- **Multi-Cloud Support**: Deploy to AWS, Google Cloud, or Azure

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   React + TS    │◄──►│  Node.js/Express│◄──►│   PostgreSQL    │
│   (Vercel)      │    │   (Railway)     │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Cloud Provider │
                       │   AWS/GCP/Azure │
                       └─────────────────┘
```

## 📁 Project Structure

```
Ancor/
├── UI_Components/          # Frontend React application
│   ├── src/
│   │   ├── components/ui/  # shadcn/ui component library
│   │   ├── pages/          # Application pages
│   │   └── ...
│   └── package.json
├── backend/                # Backend API server
│   ├── src/
│   │   ├── controllers/    # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models & types
│   │   └── config/         # Configuration & database
│   └── package.json
├── TODO.md                 # Project progress tracking
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- AWS account (for cloud deployments)
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd Ancor
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../UI_Components
npm install

# Start development server
npm run dev
```

### 4. Database Setup

1. Create a Supabase project
2. Run the SQL schema: `backend/src/config/database.sql`
3. Update environment variables with Supabase credentials

## 🔧 Configuration

### Environment Variables

Create `.env` file in the backend directory:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Encryption (32 chars)
ENCRYPTION_KEY=your_32_character_encryption_key

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### Database Schema

The platform includes comprehensive database schema with:
- User management and authentication
- AI model configurations
- Cloud provider settings
- Deployment tracking
- Real-time metrics storage
- Usage analytics
- System logging

## 🎨 Frontend Components

Built with a comprehensive UI component library including:

- **30+ shadcn/ui components**: Buttons, cards, forms, dialogs, tables
- **Responsive design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: WCAG compliant components
- **Theme support**: Built-in dark/light mode capability
- **Form validation**: Integrated with React Hook Form

### Key Pages (Planned)
- **Dashboard**: Overview of all deployments and metrics
- **Deployment Wizard**: Step-by-step AI model deployment
- **Monitoring**: Real-time performance and cost analytics
- **Management**: Instance control and troubleshooting tools

## 🔐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh

### Deployments
- `GET /api/v1/deployments/models` - Available AI models
- `POST /api/v1/deployments` - Create deployment
- `POST /api/v1/deployments/:id/deploy` - Deploy to cloud
- `GET /api/v1/deployments/:id/status` - Deployment status

### Monitoring
- `GET /api/v1/monitoring/deployments/:id/metrics` - Performance metrics
- `GET /api/v1/monitoring/analytics/usage` - Usage analytics
- `GET /api/v1/monitoring/analytics/costs` - Cost analytics

### Management
- `POST /api/v1/management/deployments/:id/start` - Start instance
- `POST /api/v1/management/deployments/:id/stop` - Stop instance
- `GET /api/v1/management/deployments/:id/logs` - View logs

## 🎯 MVP Features Status

### ✅ Completed
- [x] Project structure and documentation
- [x] Backend API with Express.js and TypeScript
- [x] PostgreSQL database schema
- [x] Authentication system with JWT
- [x] AWS cloud integration service
- [x] Deployment management controllers
- [x] Real-time monitoring endpoints
- [x] Instance management APIs
- [x] Comprehensive logging system
- [x] Input validation and security
- [x] Frontend UI component library (30+ components)

### 🔄 In Progress
- [ ] Frontend-backend integration
- [ ] Deployment wizard UI
- [ ] Dashboard with real-time metrics
- [ ] User management interface

### 📋 Next Phase
- [ ] WebSocket for real-time updates
- [ ] Advanced alerting system
- [ ] Cost optimization recommendations
- [ ] Multi-region deployment support
- [ ] Enhanced security features
- [ ] Automated testing suite

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd UI_Components
npm test

# Lint all code
npm run lint
```

## 🚀 Deployment

### Backend (Railway)
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Configure build settings for React
3. Deploy automatically on push to main

### Database (Supabase)
1. Create Supabase project
2. Run provided SQL schema
3. Configure Row Level Security (RLS)

## 📊 Monitoring & Analytics

- **Real-time metrics**: Response times, request volumes, error rates
- **Cost tracking**: Detailed cost analysis and projections
- **Usage analytics**: Token usage, API call patterns
- **Performance monitoring**: Instance health and resource utilization
- **Alert system**: Configurable alerts for issues and thresholds

## 🔒 Security Features

- **JWT Authentication**: Secure token-based user authentication
- **API Key Encryption**: AES-256 encryption for cloud provider keys
- **Rate Limiting**: Configurable request rate limits
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable CORS policies
- **Security Headers**: Helmet.js for security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

Please see individual README files in `/backend` and `/UI_Components` for specific contribution guidelines.

## 📝 Documentation

- **Backend API**: See `/backend/README.md`
- **Frontend Components**: See `/UI_Components/README.md`
- **Database Schema**: See `/backend/src/config/database.sql`
- **Progress Tracking**: See `/TODO.md`

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure Supabase credentials are correct
2. **AWS Permissions**: Verify IAM user has EC2 and CloudWatch permissions
3. **Environment Variables**: Double-check all required variables are set
4. **Port Conflicts**: Ensure ports 3000 (backend) and 5173 (frontend) are available

### Support

For issues and support:
1. Check the documentation in each component's README
2. Review the TODO.md file for known issues
3. Check environment variable configuration
4. Verify database schema is properly applied

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for simplifying AI infrastructure management**