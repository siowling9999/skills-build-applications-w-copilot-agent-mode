# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep React pages and presentation state in the frontend, using the shared API client and relative `/api` paths through the Vite proxy. Each data-driven page will expose accessible loading, empty, and error states.
- Logic tier decision: Keep request validation and application behavior in Express routes/services. Return deliberate 4xx responses for invalid or unknown input rather than leaking Mongoose cast errors as 500s.
- Data tier decision: Define required fields, references, and defaults in Mongoose models; keep MongoDB persistence and repeatable fixture creation in the data/seed layer.
- Activity tracking approach: Validate `userId` and `teamId` as well-formed IDs that resolve to existing records before creating an activity. Persist the referenced user/team, type, minutes, computed points, and occurrence time; list activities through the API.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, and store member references in the team model. Return created and listed teams through the API.
- Leaderboard approach: Aggregate activity points by team, sort totals descending, and return each team's name, total points, and 1-based rank.
- Workout suggestions approach: Find the requested seeded user by email and use their goal and recent activity patterns to select and explain the first recommendation. Return a deliberate 4xx when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — checks model required fields and relationships. Baseline: 4 failed, 1 passed; User, Team, Activity, and Workout validation contracts are incomplete.
- API command: `npm run test:api --prefix octofit-tracker/backend` — checks activity/team validation and persistence, leaderboard totals/ranking, and personalized workout suggestions. Baseline: 4 failed; invalid activity/team input returned 501 instead of 400, the leaderboard was empty, and the first workout suggestion did not match the user's activity pattern.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — checks API-backed rendering and accessible loading, empty, and error states across the pages. Baseline: 15 failed; expected data/request behavior and page states were not satisfied.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — verifies backend TypeScript compilation; a failure indicates a compile/type error in the API or data tier.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — verifies the production frontend bundle; a failure indicates a compile or bundling error in the presentation tier.
