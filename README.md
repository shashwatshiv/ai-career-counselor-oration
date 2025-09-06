# 🚀 Career Counselor AI

A modern, AI-powered career counseling application built with Next.js, featuring real-time chat sessions with Google's Gemini AI. Get personalized career guidance, interview preparation, and professional development advice.

## 🌐 Live Demo

**🔗 [Visit the Live Application](https://my-career-counselor-ai.vercel.app/)**

## 📸 Screenshots

### 1. Landing Page

![Landing Page](./screenshots/landing-page.png)
_Welcome page with feature overview and getting started tips_

### 2. Chat Interface

![Chat Interface](./screenshots/chat-interface.png)
_Real-time chat with the AI career counselor_

### 4. Authentication

![Authentication](./screenshots/authentication.png)
_Secure Google OAuth authentication_

## ✨ Features

- 🤖 **AI-Powered Career Counseling**: Get personalized advice from Google's Gemini AI
- 💬 **Real-time Chat**: Stream responses for natural conversation flow
- 🔐 **Secure Authentication**: Google OAuth integration with NextAuth.js
- 📚 **Session Management**: Save and continue your career discussions
- 🎨 **Modern UI**: Beautiful, responsive design with dark/light mode
- 📱 **Mobile Responsive**: Optimized for all device sizes
- ⚡ **Fast Performance**: Built with Next.js 15 and optimized for speed

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components, ShadCN UI
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Google Gemini 2.0 Flash
- **Deployment**: Vercel
- **State Management**: TanStack Query (React Query)
- **API**: tRPC for type-safe APIs

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database
- Google Cloud Console project (for OAuth and Gemini AI)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/career-counselor-ai.git
cd career-counselor-ai
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/career_counselor_ai"
DIRECT_URL="postgresql://username:password@localhost:5432/career_counselor_ai"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma db push

```

### 5. Google Cloud Setup

1. **Create a Google Cloud Project**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Gemini API**:

   - Navigate to "APIs & Services" > "Library"
   - Search for "Generative Language API" and enable it
   - Create an API key in "APIs & Services" > "Credentials"

3. **Set up Google OAuth**:
   - Go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.com/api/auth/callback/google` (production)

### 6. Run the Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
career-counselor-ai/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   └── chat/              # Chat interface
│   ├── components/            # React components
│   │   ├── chat/             # Chat-related components
│   │   ├── layout/           # Layout components
│   │   ├── providers/        # Context providers
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utility libraries
│   │   ├── ai/               # AI integration
│   │   ├── auth.ts           # Auth configuration
│   │   ├── db.ts             # Database connection
│   │   └── trpc/             # tRPC setup
│   └── server/               # Server-side code
│       └── api/              # tRPC routers
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
└── types/                    # TypeScript type definitions
```

## 🔧 Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start

```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Google Gemini](https://ai.google.dev/) for the AI capabilities
- [Prisma](https://prisma.io/) for the database ORM
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/your-username/career-counselor-ai/issues) page
2. Create a new issue if your problem isn't already reported

---

**⭐ Star this repository if you found it helpful!**
