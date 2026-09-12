# Life RPG — Cyberpunk Hacker Terminal Life Gamification Engine

A full-stack, production-ready "Life RPG" web application engineered with a Cyberpunk / Neon Synthwave Hacker Terminal aesthetic, robust RPG progression math, gamified economy, and server-authoritative quest calculation.

---

## ⚡ Key Features

1. **Theme & Aesthetic**:
   - Cyberpunk Hacker Terminal UI (dark `#0a0a12`, neon cyan `#00f2fe`, hot magenta `#ff007f`, electric amber `#f59e0b`, and deep slate `#10121e`).
   - Tactile game-like feel with glowing borders, CRT scanlines, retro-futuristic sound synthesis (Web Audio API), screen-shake for boss bounties and level-up milestones, and particle confetti (`canvas-confetti`).

2. **RPG Progression Engine**:
   - Non-linear Level Math: `XP_required = Math.floor(100 * Math.pow(level, 1.5))`
   - Level-up calculation that cleanly tracks leftover XP, triggers celebratory fanfare modals, and awards stat points (+2 stat points per level).
   - Attribute Breakdown:
     - **Intellect** 🧠: Cognitive development, technical skills, reading
     - **Strength** ⚔️: Physical conditioning, fitness, lifting
     - **Vitality** 🛡️: Nutrition, hydration, sleep quality, recovery
     - **Discipline** ⌛: Deep work blocks, habits, screen-time moderation
     - Each attribute features its own level and XP progress gauge.

3. **Quest CRUD & Mechanics**:
   - Create, Read, Update, and Delete bounties with deadline tags and attribute classification.
   - Difficulty Tiers:
     - **F-Rank (Routine)**: 15 XP, 10 Credits
     - **C-Rank (Medium)**: 35 XP, 25 Credits
     - **S-Rank (Boss Bounty)**: 100 XP, 75 Credits (triggers tactile screen-shake!)
   - **Streak Counter**: Daily consecutive active day tracking with streak bonus credit multipliers.
   - **Optimistic UI Updates**: Instant checkbox feedback on user click with rollback safety if network drops.

4. **Gamified Economy & Inventory ("The Cyber Armory")**:
   - Black Market item shop to exchange Credits for:
     - **Badges & Titles**: "Script Kiddie", "Ghost in the Machine", "Cyber Samurai", "Netrunner Prime"
     - **Operative Avatars**: Neo Runner, Kenshi Zero, Vesper 9, Unit Chronos
     - **HUD Themes & Cyberware**: Neural Coprocessor, Chronometer Synapse, Subdermal Grid
   - Real-time equip system directly updating character HUD and operative profile card.

5. **Authentication & Security**:
   - JWT-based authentication with bcrypt password hashing.
   - Protected API route handlers verifying operative identity server-side.
   - Instant 1-Click Demo Login (`Neo_Cipher`) for rapid testing and demonstrations.

---

## 📁 Architecture & Directory Structure

```
├── prisma/
│   └── schema.prisma         # Complete PostgreSQL / Prisma database schema
├── server/
│   ├── auth.ts               # JWT token generation and authentication middleware
│   ├── db.ts                 # Database management with persistence and seed data
│   ├── rpgMath.ts            # Non-linear level curves, attribute math, and streak evaluation
│   └── routes.ts             # Express API routes (/api/auth, /api/quests, /api/armory)
├── src/
│   ├── components/
│   │   ├── CharacterHUD.tsx  # Character profile, XP bar, attributes matrix, and streaks
│   │   ├── QuestBoard.tsx    # Bounty checklist, filters, rank badges, and creation modal
│   │   ├── CyberArmory.tsx   # Black market item catalog with buy/equip logic
│   │   ├── LevelUpModal.tsx  # Celebratory fanfare modal on level thresholds
│   │   └── AuthModal.tsx     # Registration, login, and 1-click test access
│   ├── lib/
│   │   ├── api.ts            # Strongly-typed fetch client with JWT bearer tokens
│   │   └── cyberFx.ts        # Web Audio synthesizer, neon confetti, and screen-shake
│   ├── types.ts              # Shared TypeScript interfaces and enums
│   ├── App.tsx               # Main application orchestration
│   ├── index.css             # Cyberpunk glowing utilities, animations & scanlines
│   └── main.tsx              # React DOM entry point
├── server.ts                 # Express fullstack server with Vite middleware integration
├── .env.example              # Environment variables template
└── package.json              # Scripts and dependencies
```

---

## 🛠️ Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Define the following environment variables:

```env
# JWT_SECRET: Secret key used to sign and verify JSON Web Tokens
JWT_SECRET="cyberpunk_life_rpg_super_secret_jwt_key_2026"

# DATABASE_URL: PostgreSQL connection string (when deploying with Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/liferpg?schema=public"

# NODE_ENV: production or development
NODE_ENV="development"
```

---

## 🚀 Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client & Run Migrations** (if using Prisma with PostgreSQL/SQLite):
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000`.

4. **Build for Production**:
   ```bash
   npm run build
   ```

5. **Start Production Server**:
   ```bash
   npm run start
   ```

---

## ☁️ Deployment Guide

### Deploying to Vercel (or Next.js / Node.js Serverless)

1. **Push repository to GitHub / GitLab**.
2. **Import project into Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your Git repository.
3. **Configure Environment Variables in Vercel**:
   - Add `DATABASE_URL` (e.g., from Supabase, Neon, or Railway PostgreSQL).
   - Add `JWT_SECRET`.
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Click **Deploy**.

### Deploying to Cloud Run / Docker Container

A standard container build runs `npm run build` followed by `npm run start` (or `node dist/server.cjs`), which binds to `0.0.0.0:3000` automatically.
