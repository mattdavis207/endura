# Endura

Endura is an Ironman-focused training headquarters app: a mobile dashboard, Strava-powered workout data pipeline, weekly training planner, and daily RAG-based AI coaching assistant.

## MVP Product Scope

The MVP should stay focused on the loop that makes the product useful:

1. User sets an active race goal.
2. User connects Strava.
3. Backend syncs completed workouts and relevant streams.
4. Backend creates structured workout summaries.
5. Weekly planner generates a 7-day plan.
6. Daily assistant adjusts tomorrow's workout based on recent training, fatigue, notes, and similar prior workouts.

Core screens:

- Countdown home: race date, days remaining, weeks/months remaining, current phase.
- Weekly calendar: Mon-Sun plan cards with sport, duration, target intensity, status, and AI notes.
- Goals/settings: race date, swim/bike/run targets, weekly volume target, long workout targets.
- Workout sync: Strava connection and recent activity sync state.
- AI coach: daily recommendation and weekly planning flows.

## Tech Stack

Frontend/mobile:

- React Native + Expo.
- TypeScript.
- Expo Router for navigation.
- TanStack Query for API/server state.
- Zustand for lightweight local client state.
- React Hook Form + Zod for forms and validation.
- Supabase JS client for auth/session integration.
- NativeWind for Tailwind-style React Native styling.
- Gluestack UI CLI/config for generated UI components when screen work starts.

Backend:

- FastAPI.
- Pydantic settings for environment config.
- SQLAlchemy async + asyncpg for Postgres access.
- Alembic for migrations.
- Supabase Python client for Supabase service interactions.
- pgvector Python support.
- HTTPX for Strava and provider-agnostic AI API calls.
- OpenAI Python SDK for chat/reasoning and embeddings.
- Ruff, mypy, pytest, and pytest-asyncio for backend quality checks.

Database/auth/storage:

- Supabase Auth.
- Supabase Postgres.
- pgvector for embedded summaries and retrieval.
- Supabase Storage later if workout exports, images, or generated files become useful.

AI layer:

- OpenAI is the MVP provider.
- Keep the backend AI service behind a provider adapter so Claude can be evaluated later without touching product flows.
- Suggested starting models: a cost-conscious GPT model for daily recommendations, a stronger GPT model for weekly planning, and `text-embedding-3-small` for workout summary embeddings.

## Data Model Direction

Start with these core concepts:

- `users`: app users, usually tied to Supabase Auth.
- `goals`: active Ironman/race goal, race date, target watts, swim pace, run pace, and volume targets.
- `workouts`: actual completed Strava/Garmin/manual workouts.
- `workout_streams`: raw-ish time-series data such as HR, power, cadence, pace, distance, and elapsed time.
- `workout_summaries`: AI-readable workout summaries, fatigue indicators, performance notes, and embedding vectors.
- `training_plans`: generated weekly plan headers.
- `planned_workouts`: day-level planned workouts with status, modification reason, and optional actual workout link.
- `ai_recommendations`: AI outputs, retrieved context, and decision history.
- `user_feedback`: subjective notes, fatigue, soreness, confidence, and ratings.

Important RAG choice:

- Do not embed raw FIT/time-series data directly.
- Store raw metrics normally.
- Embed cleaned summaries like: "Long bike, 3h 12m, avg power 178W, normalized power 191W, HR drift increased after 2h, cadence stable, moderate fatigue."

## RAG Flow

Daily recommendation:

1. Fetch active goal.
2. Fetch current 7-day plan.
3. Fetch last 7-14 days of workouts.
4. Fetch tomorrow's planned workout.
5. Fetch recent user feedback/fatigue.
6. Retrieve similar prior workout summaries and previous recommendations.
7. Return keep/reduce/swap/recover guidance with a short explanation.

Weekly planning:

1. Fetch active goal and race date.
2. Calculate weeks remaining and likely training phase.
3. Fetch last 4-8 weeks of training volume.
4. Fetch missed, modified, or failed planned workouts.
5. Retrieve goal-relevant workout history.
6. Return a 7-day plan with purpose, sport, duration, intensity, and progression rationale.

## Repo Layout

Current setup:

```text
apps/
  api/                  FastAPI backend package, migrations, tests
  mobile/               Expo React Native app
config/                 Shared project/tooling config as needed
scripts/                Repo-level setup and maintenance scripts
supabase/
  migrations/           Supabase SQL migrations
  seed/                 Local development seed data
```

Important root files:

- `package.json`: repo-level scripts for running the mobile app, formatting, linting, and typechecking.
- `pnpm-workspace.yaml`: tells pnpm this is a monorepo and that `apps/*` are workspace packages.
- `pnpm-lock.yaml`: exact JavaScript dependency versions.
- `.npmrc`: pnpm settings for this repo.
- `.env.example`: template for local environment variables. Copy this to `.env`.
- `docker-compose.yml`: optional local Postgres + pgvector database for development without touching hosted Supabase.
- `.editorconfig`: shared indentation and newline rules for editors.
- `.prettierrc`: formatting rules for JSON, JS, TS, CSS, Markdown, and YAML.
- `.gitignore`: files Git should ignore, such as dependencies, virtualenvs, build artifacts, and secrets.

Mobile app files under `apps/mobile`:

- `app.json`: Expo project metadata, app name, bundle/package IDs, plugins, and web bundler setting.
- `package.json`: mobile app dependencies and scripts.
- `app/_layout.tsx`: Expo Router root layout. This imports `global.css` once and owns the top-level navigation stack.
- `app/index.tsx`: default first screen for the app. This is intentionally minimal.
- `global.css`: NativeWind/Tailwind directives.
- `tailwind.config.js`: where Tailwind scans app files for class names and loads the NativeWind preset.
- `babel.config.js`: tells Expo/Babel to compile NativeWind class names.
- `metro.config.js`: tells Metro to process `global.css` through NativeWind.
- `nativewind-env.d.ts`: TypeScript support for `className` on React Native components.
- `gluestack-ui.config.json`: tells the Gluestack CLI where Tailwind config lives and where generated UI components should go.
- `tsconfig.json`: TypeScript settings for the mobile app.
- `src/components/ui`: future generated Gluestack components.
- `src/features`: feature-level modules such as goals, calendar, workouts, and coach.
- `src/hooks`: shared React hooks.
- `src/lib`: clients and utilities, such as API and Supabase clients.
- `src/state`: Zustand stores.
- `src/types`: shared TypeScript types.

Backend files under `apps/api`:

- `pyproject.toml`: Python package metadata, backend dependencies, and tool settings.
- `alembic.ini`: Alembic migration configuration.
- `app/main.py`: FastAPI app entrypoint. `fastapi dev app/main.py` loads this file.
- `app/api`: route modules. The current `health.py` exposes `/health`.
- `app/core`: shared backend configuration and infrastructure helpers. `config.py` reads environment variables.
- `app/db`: future database session and repository setup.
- `app/models`: future SQLAlchemy models.
- `app/schemas`: future Pydantic request/response schemas.
- `app/integrations`: future Strava and external service clients.
- `app/rag`: future embedding, retrieval, and context assembly code.
- `app/ai`: future OpenAI adapter and provider abstraction.
- `app/services`: future orchestration workflows.
- `tests`: backend tests. The current test checks `/health`.
- `alembic/versions`: generated database migration files.

Supabase files under `supabase`:

- `config.toml`: local Supabase CLI project settings.
- `migrations`: SQL migrations if using Supabase migration workflow.
- `seed`: optional local seed data.

The `.gitkeep` files only exist so Git preserves empty folders. They can be removed once a real source file exists in the same folder.

Suggested backend folders under `apps/api/app`:

```text
api/                    FastAPI routers and request/response boundaries
core/                   settings, logging, security helpers
db/                     database session, migrations helpers, repositories
models/                 SQLAlchemy models
schemas/                Pydantic schemas
integrations/           Strava first, Garmin later if needed
rag/                    embedding, retrieval, context assembly
ai/                     OpenAI adapter first, provider abstraction for future Claude testing
services/               workflow orchestration
```

Suggested mobile folders under `apps/mobile/src`:

```text
app/                    route-level screens if not using Expo Router's app folder directly
components/             reusable UI components
features/               feature modules such as goals, calendar, workouts, coach
hooks/                  shared hooks
lib/                    API clients, Supabase client, utilities
state/                  Zustand stores
types/                  shared TypeScript types
```

Gluestack component generation:

```bash
cd apps/mobile
pnpm exec gluestack-ui add button
```

Generated components are configured to go under `apps/mobile/src/components/ui`. Add only the components you need instead of generating the whole library.

## Local Setup

Runtime versions:

- Node.js `>=20.19.4` for Expo SDK 55.
- pnpm `>=10.11.0`.
- Python `>=3.10`.

Install JavaScript dependencies:

```bash
pnpm install
```

Create a backend virtual environment:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
```

Start local Postgres with pgvector:

```bash
docker compose up -d postgres
```

Copy environment values:

```bash
cp .env.example .env
```

Run the mobile app after adding the initial Expo route files:

```bash
pnpm dev:mobile
```

Run the backend:

```bash
cd apps/api
source .venv/bin/activate
fastapi dev app/main.py
```

## Notes And Decisions

- The backend is FastAPI as requested.
- The repo is intentionally not filled with implementation files yet.
- UI is set up for NativeWind plus Gluestack-generated components.
- AI is set up for OpenAI first, with room for a future Claude adapter.
- Strava should be the first integration because its OAuth and activity APIs are the clearest MVP path.
- Garmin can be evaluated later because its API access is more developer-program/business oriented.
- Failed or modified workouts should live on `planned_workouts.status` at first instead of becoming separate tables.
