# AI Music Production System - Frontend

Complete Next.js 14 frontend for the AI-Based Music Production System with TypeScript support.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in browser
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Home page
│   │   ├── auth/
│   │   │   ├── login/page.tsx        # Login page
│   │   │   └── register/page.tsx     # Registration page
│   │   ├── dashboard/page.tsx        # Main dashboard
│   │   ├── chat/page.tsx             # AI chatbot interface
│   │   ├── marketplace/page.tsx      # Marketplace browser
│   │   └── profile/page.tsx          # User profile
│   │
│   ├── components/                   # React components
│   │   ├── Common/
│   │   │   └── Providers.tsx         # React Query & Sonner provider
│   │   ├── Dashboard/
│   │   │   ├── DashboardLayout.tsx   # Dashboard wrapper
│   │   │   └── AudioUploader.tsx     # Audio file uploader
│   │   ├── Auth/                     # Auth components
│   │   ├── Chat/                     # Chat components
│   │   └── Marketplace/              # Marketplace components
│   │
│   ├── services/
│   │   └── api.ts                    # API client with axios
│   │
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   │
│   ├── styles/
│   │   └── globals.css               # Global styles & TailwindCSS
│   │
│   ├── hooks/                        # Custom React hooks
│   ├── lib/                          # Utility functions
│   └── utils/                        # Helper functions
│
├── public/
│   ├── icons/                        # Icon assets
│   └── images/                       # Image assets
│
├── tests/                            # Test files
├── .next/                            # Build output
├── node_modules/                     # Dependencies
│
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── next.config.js                    # Next.js config
├── tailwind.config.js                # TailwindCSS config
├── postcss.config.js                 # PostCSS config
├── .eslintrc.json                    # ESLint config
├── .prettierrc                       # Prettier config
├── .gitignore                        # Git ignore rules
└── README.md                         # This file
```

## 🎨 Pages & Features

### 1. **Home Page** (`/`)
- Hero section with features overview
- Navigation with login/register buttons
- Feature grid highlighting key capabilities
- Responsive design

### 2. **Authentication**
- **Login** (`/auth/login`)
  - Email/password authentication
  - JWT token storage
  - Error handling with toast notifications
  
- **Register** (`/auth/register`)
  - User account creation
  - Validation (password length, confirmation)
  - Success redirect to login

### 3. **Dashboard** (`/dashboard`)
- Protected route with authentication check
- User welcome message
- Quick action cards
- Audio upload interface
- Statistics cards

### 4. **Audio Management** (`/dashboard/audio`)
- Upload audio files (WAV, MP3, FLAC, OGG)
- File size validation (max 50MB)
- Audio metadata display
- File description & visibility toggle
- Upload progress indicator

### 5. **AI Chatbot** (`/chat`)
- Real-time chat interface
- Message history display
- Protected user-only access
- Toast notifications for errors

### 6. **Marketplace** (`/marketplace`)
- Browse marketplace listings
- Filter by category (VST, samples, templates, presets)
- Item details with pricing
- Rating and download count display
- Buy/Download actions

### 7. **Profile** (`/profile`)
- View user information
- Edit full name and bio
- Display member since date
- Profile update functionality

## 🔧 Configuration

### API Base URL
Edit `next.config.js` or `.env.local`:
```javascript
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

### Tailwind CSS Theme
Customize colors in `tailwind.config.js`:
- Primary: `#8B5CF6` (Purple)
- Secondary: `#EC4899` (Pink)
- Accent: `#06B6D4` (Cyan)

## 📦 Dependencies

### Core
- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety

### UI & Styling
- **TailwindCSS 3**: Utility-first CSS
- **Sonner**: Toast notifications

### State Management & Data
- **TanStack Query 5**: Server state management
- **Axios**: HTTP client
- **Zustand**: Lightweight state management

### Development
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **TypeScript**: Static typing

## 🛠️ Development

### Code Formatting
```bash
npm run format          # Format code
npm run format:check   # Check format
```

### Type Checking
```bash
npm run type-check
```

### Testing
```bash
npm test              # Run tests
npm run test:watch   # Watch mode
```

### Linting
```bash
npm run lint
```

## 🔐 Security

- **JWT Authentication**: Tokens stored in localStorage
- **CORS Enabled**: Configured for local development
- **Input Validation**: Client-side validation for forms
- **Error Handling**: Graceful error messages with toasts
- **Protected Routes**: Authentication checks before page load

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Deploy from Git
git push origin main
# Vercel auto-deploys on push
```

### Docker
See `Dockerfile` in project root:
```bash
docker build -t music-frontend .
docker run -p 3000:3000 music-frontend
```

### Manual
```bash
npm run build
npm start
```

## 📊 Performance

- **Bundle Optimization**: Tree-shaking & code splitting
- **Image Optimization**: Next.js Image component (when added)
- **Caching**: React Query with 5-minute stale time
- **CSS-in-JS**: Tailwind utility classes
- **SEO**: Built-in Next.js SEO support

## 🐛 Troubleshooting

### CORS Errors
Ensure backend API URL matches in `next.config.js`:
```javascript
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### Authentication Issues
- Clear localStorage and cookies
- Check JWT expiration in `.env.local`
- Verify backend is running on correct port

### Styling Issues
Rebuild TailwindCSS:
```bash
npx tailwindcss rebuild
```

### Build Errors
Clear cache and reinstall:
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 👤 Author

Created for AI Music Production System Diploma Project
- Institution: MUST (Mongolian University of Science and Technology)
- Author: Erdenesuukh Yesudei

## 📄 License

All rights reserved.
