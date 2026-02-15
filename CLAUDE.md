# WhereTo - Café & Restaurant Discovery App

## What This Project Is
WhereTo is a swipe-based café and restaurant discovery app. Users select an intent (Study, Date, Budget Eats, etc.), then swipe through café cards to save or skip. Swipe right = save, swipe left = skip, swipe up = go now (opens directions).

## Tech Stack
- Framework: Next.js 15 with App Router
- Language: TypeScript
- Styling: Tailwind CSS v4
- Database: PostgreSQL on Neon (using Prisma ORM)
- Auth: NextAuth.js (Google OAuth + email)
- Maps & Places: Google Places API
- Animations: Framer Motion (for swipe gestures)
- Hosting: Vercel

## Coding Standards
- Use functional React components with hooks
- Use TypeScript strictly — no 'any' types
- Use Tailwind CSS for all styling — no separate CSS files
- Mobile-first responsive design
- All colors, spacing, and design tokens should be consistent
- Keep components small and reusable
- API routes go in app/api/
- Reusable components go in components/
- Utility functions and helpers go in lib/
- Database schema and migrations managed by Prisma in prisma/
- All prices and currency references are in CAD

## Design Direction
- Clean, modern, minimal UI
- Orange accent color (#E85D2A) as primary brand color
- Dark navy (#1B2A4A) for text
- White/light backgrounds
- Cards should be full-bleed photos with gradient overlays
- Mobile-first — everything should look great on a phone screen
