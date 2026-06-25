# PBL Program Intelligence Dashboard

A Next.js application for Mantra4Change's PBL pre-interview assignment. It ingests three months of synthetic school response data and grant reporting evidence, computes deterministic program intelligence metrics, and supports monthly review meetings and grant report preparation.

## Live demo

_Add your deployed URL here after publishing (e.g. Vercel + hosted Postgres)._

## Quick start

### Prerequisites

- Node.js 20+
- The unzipped [candidate data package](https://drive.google.com/file/d/1cEEo7VHYYxNkzf-_HMdNJeGnq8SOOykT/view?usp=drivesdk)

### Setup

```bash
npm install
cp .env.example .env
# Set ASSIGNMENT_DATA_DIR to your unzipped package path
npx prisma db push
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Note:** The app uses SQLite locally (`file:./prisma/dev.db`) so no external database is required. For production, switch `DATABASE_URL` to PostgreSQL and update the Prisma datasource provider to `postgresql`.

## Architecture overview

```
CSV files (PBL + Grant) → import.service → PostgreSQL (Prisma)
                                              ↓
                         program.service / grant.service (deterministic logic)
                                              ↓
                              Next.js API routes (/api/*)
                                              ↓
                         React dashboard (filters, KPIs, geography, grant report)
```

- **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS, Recharts
- **Backend:** Next.js Route Handlers, Prisma ORM, SQLite (local) / PostgreSQL (production)
- **AI:** Rule-based narrative generation from computed facts (no runtime LLM required). Grant and review narratives work with AI fully disabled.

## Data model

| Model | Purpose |
|-------|---------|
| `School` | Unique schools with district/block geography |
| `MonthlySubmission` | Normalized grade × subject rows per school per month |
| `Grant` | Donor grant profile and covered districts |
| `GrantFinanceLine` | Monthly budget utilization by line item |
| `GrantReport` | Pre-computed grant performance facts per month |
| `Evidence` | Linked media assets with relative paths |
| `ActionItem` | Schema ready for persisted follow-up actions (currently generated on read) |

### Import normalization

Each school CSV row is expanded into up to six `MonthlySubmission` records (Classes 6–8 × Math/Science). Participation and evidence are school-level flags; enrollment and attendance are taken from grade/subject-specific columns.

## Risk classification (deterministic)

All dashboard risk labels use code thresholds — never AI:

| Status | Threshold |
|--------|-----------|
| On Track | ≥ 75% |
| Behind | 60% – below 75% |
| At Risk | 35% – below 60% |
| Critical | below 35% |

Applied to:

- **KPI cards:** participation %, evidence submission %, attendance %
- **Geography composite:** 40% participation + 30% evidence + 30% attendance

## Key metrics

- **Participation %** = schools with PBL conducted ÷ total schools in filter scope
- **Evidence submission %** = schools with evidence ÷ participating schools
- **Attendance %** = total attendance ÷ total enrollment across submission rows
- **Month-over-month movement** = current month metric minus prior month (percentage points)

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/filters` | Available filter options |
| GET | `/api/dashboard` | KPIs + MoM movement |
| GET | `/api/geography?level=district\|block` | High/low performing geographies |
| GET | `/api/summary` | Structured review summary |
| GET | `/api/actions` | Recommended follow-up actions |
| GET | `/api/grants` | Grant list |
| GET | `/api/grants/report?grantLabel=&reportingMonth=` | Grant report section |
| POST | `/api/import` | Import CSV data from `ASSIGNMENT_DATA_DIR` |
| GET | `/api/evidence/[...path]` | Serve evidence images |

## Assignment coverage

### Tier 1 (required)

- [x] Program review filters (month, district, block, grade, subject)
- [x] Monthly review dashboard with KPIs and MoM movement
- [x] District and block performance tables + chart
- [x] Deterministic risk & gap engine with explanations
- [x] Grant reporting assistant with facts, finance, evidence, and narrative

### Tier 2 (enhancements)

- [x] Monthly review summary with discussion prompts
- [x] Copy-ready export for program summary and grant report

### Tier 3 (optional)

- [x] Recommended actions with owner, priority, due date, linked metric

## Assumptions & decisions

1. **Grade/subject expansion:** Teachers report combined classes/subjects; the importer creates one row per grade × subject combination using shared school-level PBL/evidence flags.
2. **School counts:** KPI school counts use distinct `schoolId` values, not raw submission rows.
3. **Evidence gating:** Evidence is only counted when PBL was conducted (`pblConducted && evidenceSubmitted`).
4. **Grant narrative:** Uses rule-based text assembly from DB facts. An LLM can be swapped in later without changing metric calculations.
5. **Default data path:** Falls back to `../Open Source/Mantra4Change_PBL_AI_Prework_Candidate_Package` relative to the project root if `ASSIGNMENT_DATA_DIR` is unset.

## Limitations

- No authentication (assessment scope)
- Action items are generated on read, not persisted to `ActionItem` table
- PDF/DOCX export not implemented; clipboard copy is provided instead
- Large CSV import runs synchronously on button click (acceptable for ~2.3k rows/month)

## Production readiness notes

- Add auth (e.g. SSO for program staff)
- Move import to a background job with idempotency keys
- Add database indexes (already on key filter columns)
- Wire optional LLM behind a feature flag with fact validation
- Host evidence assets on object storage instead of local filesystem
- Add observability (structured logs, health checks)

## Future improvements

- Persist and edit recommended actions
- Drill-down from block to school list
- Grade/subject heatmaps
- Scheduled monthly data imports
- Real LLM narrative with strict fact grounding and citation links

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run seed     # Import assignment CSVs into database
npm run db:push  # Push schema without migration files
```

## License

Assessment submission for Mantra4Change. All bundled data is synthetic.
