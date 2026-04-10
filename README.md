# Fitness Tracker App

A modern fitness tracking website built with Next.js where users can sign up, log workouts, track goals, and monitor progress with charts.

## Brief About The Website

This app helps users manage their fitness journey in one place:
- Authentication (signup and login)
- Dashboard with key fitness stats
- Workout tracking
- Goal management
- Progress and trend visualizations
- Profile management
- Optional Supabase backend integration

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Recharts
- Framer Motion
- Lucide React

## Project Structure

- `src/app/(auth)` - authentication pages
- `src/app/(app)` - main app pages (dashboard, workouts, goals, progress, profile)
- `src/components` - shared UI components
- `src/context` - auth/theme context providers
- `src/lib` - Supabase client and helper data
- `supabase-schema.sql` - database schema reference

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

If these values are not set, the app runs in demo mode with a mock Supabase client.

3. Start development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - build production app
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Contributers
- ShlokPathak28
- Ayush-otcom
- Ayush16012005
