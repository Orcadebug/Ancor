# AI Infrastructure Management Platform - Production Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Supabase Database Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your Project URL and API Keys

2. **Run Database Schema**:
   ```sql
   -- Copy and paste the contents of database/supabase-schema.sql
   -- into your Supabase SQL Editor and run it
   ```

3. **Configure Authentication**:
   - Go to Authentication > Settings
   - Enable Email provider
   - Set Site URL to your Vercel domain
   - Add Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 2. Railway Backend Deployment

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo
   - Select the `/backend` folder as root directory

2. **Configure Environment Variables**:
   ```bash
   # Copy all variables from .env.production
   # Update with your actual values:
   
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   JWT_SECRET=your-supabase-jwt-secret
   STRIPE_SECRET_KEY=sk_live_your-stripe-key
   COREWEAVE_API_KEY=your-coreweave-key
   AWS_ACCESS_KEY_ID=your-aws-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   GCP_PROJECT_ID=your-gcp-project
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=3001
   ```

3. **Deploy**:
   - Railway will automatically build and deploy
   - Note your Railway service URL: `https://your-service.railway.app`

### 3. Vercel Frontend Deployment

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set Root Directory to `InfraView`

2. **Configure Build Settings**:
   ```bash
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Environment Variables**:
   ```bash
   VITE_API_URL=https://your-backend.railway.app/api
   VITE_SUPABASE_URL=https://[project-ref].supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Deploy**:
   - Vercel will automatically build and deploy
   - Your app will be available at: `https://your-app.vercel.app`

## 🔐 Required API Keys & Services

### Stripe (Billing)
```bash
# Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Webhook endpoint: https://your-backend.railway.app/api/billing/webhook
STRIPE_WEBHOOK_SECRET=whsec_...
```

### CoreWeave (Primary Cloud Provider)
```bash
# Get from CoreWeave dashboard
COREWEAVE_API_KEY=your-coreweave-api-key
```

### AWS (Optional)
```bash
# Get from AWS IAM console
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Google Cloud (Optional)
```bash
# Create service account in GCP console
GCP_PROJECT_ID=your-project-id
GCP_CREDENTIALS={"type":"service_account",...}
```

## 📋 Pre-Deployment Checklist

- [ ] Supabase project created and schema deployed
- [ ] Railway backend service deployed
- [ ] Vercel frontend deployed
- [ ] Stripe account configured with webhook
- [ ] CoreWeave API key obtained
- [ ] Domain configured (optional)
- [ ] SSL certificates configured
- [ ] Environment variables set correctly

## 🎯 Post-Deployment Setup

### 1. Test the Integration
```bash
# Check health endpoints
curl https://your-backend.railway.app/health
curl https://your-app.vercel.app/health
```

### 2. Create First Organization
1. Visit your Vercel app
2. Register a new account
3. Create your organization
4. Add cloud provider credentials

### 3. Configure Stripe Webhooks
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-backend.railway.app/api/billing/webhook`
3. Select events: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`

### 4. Test First Deployment
1. Use the deployment wizard
2. Select CoreWeave as provider
3. Choose LLaMA 3 70B model
4. Deploy and monitor

## 🔧 Troubleshooting

### Backend Issues
```bash
# Check Railway logs
railway logs

# Common issues:
# - Database connection: Verify DATABASE_URL
# - CORS errors: Check FRONTEND_URL matches Vercel domain
# - Authentication: Verify JWT_SECRET matches Supabase
```

### Frontend Issues
```bash
# Check Vercel build logs
# Common issues:
# - API calls failing: Verify VITE_API_URL
# - Build errors: Check TypeScript compilation
# - Auth issues: Verify Supabase configuration
```

### Database Issues
```bash
# Check Supabase logs
# Common issues:
# - RLS policies: Ensure proper permissions
# - Schema errors: Re-run migration script
# - Connection limits: Check connection pooling
```

## 📈 Monitoring & Analytics

### Railway Backend Monitoring
- CPU/Memory usage in Railway dashboard
- Error rates and response times
- Database connection health

### Vercel Frontend Monitoring
- Build and deployment status
- Core Web Vitals
- Function execution metrics

### Supabase Database Monitoring
- Query performance
- Connection count
- Storage usage

## 💰 Cost Optimization

### Railway Backend
- Use smallest instance that handles your load
- Monitor CPU/memory usage
- Scale up only when needed

### Vercel Frontend
- Optimize bundle size
- Use edge functions sparingly
- Monitor bandwidth usage

### Supabase Database
- Monitor database size
- Optimize queries with indexes
- Use connection pooling

## 🔄 CI/CD Pipeline

The setup includes automatic deployments:

1. **Push to `main`** → Railway redeploys backend
2. **Push to `main`** → Vercel redeploys frontend
3. **Database changes** → Run migration manually in Supabase

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs (Railway, Vercel, Supabase)
3. Verify all environment variables are set correctly
4. Test API endpoints individually

---

## 🎉 You're Ready!

Your AI Infrastructure Management Platform is now deployed and ready to:

- ✅ Accept customer registrations
- ✅ Deploy AI infrastructure with 7% markup
- ✅ Process payments via Stripe
- ✅ Scale automatically with demand

**Target: $84K/month revenue at 1,000 customers** 🚀