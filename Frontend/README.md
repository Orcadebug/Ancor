# AIM Platform Frontend

AI Infrastructure Management Platform - Deploy AI document processing systems with one click.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ancor)

## 🛠️ Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
Frontend/
├── client/                 # React application source
│   ├── components/        # UI components
│   ├── pages/            # Route components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities
├── public/               # Static assets
├── dist/                 # Build output
└── vercel.json          # Vercel deployment config
```

## 🌐 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the configuration
3. Deploy with zero additional setup

### Manual Build

```bash
# Build the application
npm run build

# The built files will be in dist/spa/
```

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
VITE_API_BASE_URL=https://your-backend-api.com/api/v1
VITE_SOCKET_URL=https://your-backend-api.com
```

## 📖 Features

- **4-Step Deployment Wizard**: Industry selection → Model choice → Infrastructure → Deploy
- **Real-time Progress**: Live deployment progress with Socket.IO
- **Document Management**: Upload, process, and search documents
- **AI Chat Interface**: Query your documents with AI
- **Workflow Automation**: Visual workflow builder
- **Health Monitoring**: Real-time system health dashboard
- **Multi-tenant**: Organization-based access control

## 🎨 Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Socket.IO** for real-time updates
- **Lucide** for icons

## 🚨 Troubleshooting

### Vercel Deployment Issues

1. **404 on routes**: Ensure `vercel.json` has proper rewrites
2. **Build failures**: Check dependencies are in `dependencies` not `devDependencies`
3. **Environment variables**: Set them in Vercel dashboard

### Common Issues

- **Module not found**: Clear `node_modules` and reinstall
- **Build errors**: Run `npm run typecheck` to see TypeScript issues
- **Styling issues**: Ensure Tailwind is configured correctly

## 📄 License

MIT License - see LICENSE file for details.