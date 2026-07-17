# J&J Scoring

A web application for managing Jack & Jill dance competition scoring. Built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Features

- **Admin**: Create competitions, manage rounds (Phase 1, Semifinal, Final, etc.), approve registrations, assign judges
- **Judges**: Score participants individually per round (0–10 scale), from any device
- **Participants**: Register as leader or follower, track approval status
- **Security**: Row Level Security (RLS) on all Supabase tables, role-based access

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend  | Supabase (PostgreSQL, Auth, RLS)    |
| Language | TypeScript                          |

## Getting Started

### 1. Clone and install

```bash
cd jj-scoring
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Run the database migration in the Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

### 3. Create your admin account

1. Sign up through the app at `/signup`
2. In Supabase SQL Editor, promote your user to admin:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-uuid';
```

### 4. Create judge accounts

1. Have judges sign up (or create accounts in Supabase Auth)
2. Promote them to judge role:

```sql
UPDATE profiles SET role = 'judge' WHERE id = 'judge-user-uuid';
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Workflow

1. **Admin** creates a competition and adds rounds (Phase 1, Phase 2, Semifinal, Final)
2. **Admin** opens registration and assigns judges
3. **Dancers** register as leader or follower
4. **Admin** approves registrations
5. **Admin** activates a round when ready
6. **Judges** score each participant (0–10) in the active round
7. **Admin** completes the round and activates the next one
8. Results are computed via the `round_results` view (average scores)

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard & competition management
│   ├── judge/           # Judge scoring panel
│   ├── competitions/    # Public competition listing & registration
│   ├── login/           # Authentication
│   └── signup/
├── components/          # Shared UI components
├── lib/
│   └── supabase/        # Supabase client (browser, server, middleware)
└── types/               # TypeScript types for database schema
supabase/
└── migrations/          # SQL schema & RLS policies
```

## Future Enhancements

- [ ] Payment processing (Stripe) for registration fees
- [ ] Live results display / projector view
- [ ] Automatic advancement based on scores
- [ ] Email notifications for registration status
- [ ] Multi-language support (i18n)
- [ ] Export results to CSV/PDF

## License

Private — all rights reserved.
