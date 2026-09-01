# PaperPulse

PaperPulse is an AI-powered research-to-project platform built for computer science students. The app helps users turn academic papers into actionable, buildable project ideas, track progress, save research, compare papers, and access premium features through subscriptions.

## Overview

The product is a Next.js application with an App Router frontend, Supabase-backed auth and data layer, and AI-powered workflows powered by Groq. Users can:

- upload or import research papers
- generate 3 project ideas from a paper or abstract
- chat with the AI about a paper
- compare multiple papers
- organize saved and reading-list content
- generate project roadmaps
- manage student and premium access flows
- access an admin dashboard for moderation and content management

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres database + Storage
- Groq LLM API
- Stripe for subscriptions/checkouts
- PayHere integration for local payment flow
- Resend for transactional emails
- PDF processing utilities via pdfjs-dist and jspdf

## Main Features

### Student experience
- paper upload and research discovery
- AI-generated project ideas tied to the paper domain
- project details with architecture, difficulty, and estimated timeline
- saved papers and reading-list management
- chat interface for research Q&A
- project tracker and roadmap generation
- portfolio / profile area for work summaries

### Admin and operations
- admin dashboard for users, papers, ideas, and revenue
- moderation of flagged content
- invite-based onboarding for admin access
- premium request management
- payment monitoring and announcement controls

### Integrations
- Groq API for paper analysis and idea generation
- Supabase for auth, profile storage, and server-side data access
- Stripe and PayHere payment flows
- Resend email delivery

## Project Structure

```text
paperpulse/
├── app/
│   ├── api/                   # API routes for AI, PayHere, Stripe, imports, etc.
│   ├── admin/                # Admin dashboard and auth flows
│   ├── auth/                 # Supabase auth callbacks and password reset
│   ├── (app)/                # authenticated app pages
│   ├── (auth)/               # login/signup flows
│   ├── payhere/              # checkout pages
│   ├── portfolio/            # public portfolio pages
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/               # UI components and shared layout elements
├── lib/
│   └── supabase/             # client/server/admin Supabase helpers
├── public/
├── types/
├── .env.local                # local environment variables
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.*
├── tsconfig.json
├── README.md
└── middleware.ts
```

## Environment Variables

Create a local environment file named `.env.local` with the following values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GROQ_API_KEY=your_groq_api_key

STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

RESEND_API_KEY=your_resend_api_key

SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_key

NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_PAYHERE_MERCHANT_ID=your_payhere_merchant_id
PAYHERE_MERCHANT_ID=your_payhere_merchant_id
PAYHERE_MERCHANT_SECRET=your_payhere_merchant_secret
NEXT_PUBLIC_PAYHERE_SANDBOX=true
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure your environment variables in `.env.local`.

3. Run the development server:

```bash
npm run dev
```

4. Open the app in your browser:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev      # start local dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # run ESLint checks
```

## Deployment

This app is designed for deployment on Vercel with environment variables configured in the project settings. The current project also includes webhooks and payment APIs for Stripe and PayHere, so production deployment should include the correct secrets and webhook endpoint configuration.

## Notes

- The application uses the Next.js App Router and relies on server-side route handlers under `app/api`.
- AI generation logic is implemented in route handlers such as `app/api/process-paper/route.ts` and `app/api/import-paper/route.ts`.
- Authentication and database access are centralized through the Supabase helpers in `lib/supabase`.
- This project is tailored to research-paper-driven learning experiences and university CS use cases.

## License

This project is currently unlicensed unless a repository-specific license file is added.

## Contributing

For local development, keep the environment variables in sync, run the app with the Supabase project connected, and validate all AI and payment-related flows before production release.
