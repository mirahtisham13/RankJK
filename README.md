# 🎯 RankJK — Competitive Exam Cutoff Predictor

A crowd-sourced platform for aspirants of JKSSB, SSC, JKPSC and other competitive exams to submit their marks and get real-time expected cutoffs.

## Features

- 📊 **Submit Marks** — Submit scores for JKSSB, SSC, JKPSC and more
- 🎯 **Cutoff Predictor** — Real-time optimistic/likely/conservative cutoff ranges
- 📈 **Score Distribution Chart** — Visual histogram of all submissions
- 🏅 **Personal Rank** — See your rank among all submitters
- 🏆 **Leaderboard** — Top marks per post and category
- 🔐 **Auth** — Login required to submit (public access for viewing)
- ⚙️ **Admin Panel** — Create exams/posts, manage submissions, manage users
- 🏔️ **J&K Categories** — Full support for RBA and ALC categories

## Categories Supported

| Category | Description |
|----------|-------------|
| General | Open merit |
| OBC | Other Backward Classes |
| SC | Scheduled Caste |
| ST | Scheduled Tribe |
| EWS | Economically Weaker Section |
| PWD | Persons with Disabilities |
| **RBA** | **Residents of Backward Areas** (J&K specific) |
| **ALC** | **Adjacent Locality Candidates** (J&K specific) |

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Vanilla CSS
- **Backend/DB**: Supabase (PostgreSQL + Row Level Security)
- **Auth**: Supabase Auth (Email/Password)
- **Charts**: Recharts
- **Hosting**: Vercel (recommended)

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. This will create all tables, RLS policies, and seed the initial exams

### 2. Configure Environment Variables

Copy `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in your Supabase project → Settings → API.

### 3. Make Yourself Admin

After signing up on the site, run this in Supabase SQL Editor:

```sql
UPDATE profiles SET is_admin = TRUE WHERE id = 'your-user-id-here';
```

Find your user ID in Supabase → Authentication → Users.

### 4. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel

```bash
npx vercel
```

Add your environment variables in Vercel's dashboard.

## Project Structure

```
RankJK/
├── app/
│   ├── page.js           # Home page
│   ├── exams/page.js     # Browse exams
│   ├── submit/page.js    # Submit marks (auth required)
│   ├── predict/[examId]/ # Cutoff predictor
│   ├── leaderboard/      # Top scores
│   ├── auth/page.js      # Login / Sign up
│   ├── profile/page.js   # User profile
│   └── admin/page.js     # Admin panel
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── ExamCard.jsx
│   ├── CutoffChart.jsx
│   └── AuthModal.jsx
├── lib/
│   ├── supabase.js       # Supabase client
│   ├── db.js             # DB helper functions
│   └── constants.js      # Categories, colors
└── supabase/
    └── schema.sql        # Full DB schema + seed data
```

## Cutoff Prediction Algorithm

The cutoff is predicted based on community-submitted scores using percentiles:

- **Optimistic**: Score at top 15% (best case, fewer competition)
- **Likely**: Score at top 20% (typical vacancy fill rate)
- **Conservative**: Score at top 25% (safe estimate)

Confidence levels:
- 🔴 **Low** — < 50 submissions
- 🟡 **Medium** — 50–200 submissions
- 🟢 **High** — 200+ submissions

## Disclaimer

Predictions are based on community-submitted data and are **NOT official**. Actual cutoffs are determined by the recruiting authority (JKSSB, SSC, JKPSC, etc.). Use this as a rough guide only.
