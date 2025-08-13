# AI Infrastructure Platform - Frontend

React + TypeScript frontend for the AI Infrastructure Management Platform, built with shadcn/ui components and Tailwind CSS.

## 🚀 Deploy to Vercel

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FOrcadebug%2FAncor%2Ftree%2Fmain%2FUI_Components)

### Manual Deployment

1. **Fork/Clone the repository**
2. **Go to [Vercel](https://vercel.com)**
3. **Import your repository**
4. **Configure the project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `UI_Components`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Add Environment Variables** in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-app.railway.app/api/v1
   VITE_APP_NAME=AI Infrastructure Platform
   VITE_APP_VERSION=1.0.0
   ```

6. **Deploy!**

## 🛠️ Local Development

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

## 🔧 Configuration

### Environment Variables

Create `.env` file in the root directory:

```bash
# Copy from example
cp .env.example .env

# Edit with your backend URL
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Backend Integration

The frontend is configured to work with the backend API. Update `VITE_API_BASE_URL` to point to your backend deployment:

- **Local**: `http://localhost:3000/api/v1`
- **Production**: `https://your-backend.railway.app/api/v1`

## 📦 Features

### UI Components (30+)
- **Navigation**: Menus, breadcrumbs, pagination
- **Forms**: Inputs, selects, checkboxes, radio buttons
- **Feedback**: Alerts, toasts, progress indicators
- **Layout**: Cards, tabs, accordions, sheets
- **Data Display**: Tables, badges, avatars

### Pages
- **Component Demo**: Showcase of all UI components
- **Ready for Integration**: API client configured for backend

### Styling
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Consistent design system
- **Dark/Light Mode**: Built-in theme support
- **Responsive**: Mobile-first design

## 🔗 API Integration

The frontend includes a pre-configured API client (`src/lib/api.ts`) with methods for:

- **Authentication**: Login, register, profile management
- **Deployments**: Create, manage AI model deployments
- **Monitoring**: Real-time metrics and analytics
- **Management**: Instance control and logs

## 📁 Project Structure

```
UI_Components/
├── src/
│   ├── components/ui/     # shadcn/ui components (30+)
│   ├── pages/             # Application pages
│   ├── lib/               # Utilities and API client
│   └── hooks/             # Custom React hooks
├── public/                # Static assets
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies and scripts
```

## 🚨 Troubleshooting

### Common Issues

**Build fails on Vercel:**
- Ensure `Root Directory` is set to `UI_Components`
- Check that all environment variables are set

**API calls fail:**
- Verify `VITE_API_BASE_URL` points to your backend
- Check CORS settings in backend allow your Vercel domain

**Components not rendering:**
- Clear browser cache
- Check console for JavaScript errors

### Support

For issues with deployment or development, check:
1. Vercel build logs
2. Browser console errors
3. Network tab for API call failures

## Technologies Used

- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - Component foundation
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [Lucide React](https://lucide.dev/) - Icons

## 📄 License

MIT License - see the root project for details.