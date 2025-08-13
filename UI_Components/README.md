# React UI Component Library

A comprehensive React UI component library built with [shadcn/ui](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/).

## Features

- 🎨 **Modern Design**: Clean, accessible components following modern design principles
- 🔧 **TypeScript**: Full TypeScript support for better development experience
- 🎯 **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- ♿ **Accessible**: Built with accessibility in mind using Radix UI primitives
- 🚀 **Fast**: Powered by Vite for lightning-fast development and builds

## Components Included

- **Buttons**: Various button styles and sizes
- **Cards**: Flexible card components with headers and content
- **Forms**: Input fields, labels, and form controls
- **Navigation**: Tabs, menus, and navigation components
- **Feedback**: Alerts, toasts, and loading states
- **Data Display**: Tables, badges, and typography
- **Layout**: Grids, containers, and spacing utilities

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react-ui-component-library
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173` to see the component showcase.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/
│   ├── ui/           # Core UI components
│   └── ...
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Demo pages
└── ...
```

## Customization

The components are built with Tailwind CSS and can be easily customized by:

1. Modifying the `tailwind.config.ts` file
2. Updating CSS custom properties in `src/index.css`
3. Customizing component variants in individual component files

## Technologies Used

- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - Component foundation
- [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- [Lucide React](https://lucide.dev/) - Icons

## License

This project is open source and available under the [MIT License](LICENSE).