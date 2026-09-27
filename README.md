# PolicyEngine profiler

A rebuilt profiler for PolicyEngine simulation setup and variable calculation cost.

This version replaces the old Streamlit prototype with:

- Next.js 14 App Router
- Tailwind 4 with PolicyEngine design tokens
- Recharts visualizations
- A custom Modal backend for hosted profiling

The browser owns the UI. Python owns the actual `cProfile` run.

## Architecture

```text
Local dev: Next.js UI -> /api/local-profile -> scripts/profile_policyengine.py -> backend/profile_core.py
Hosted app: Next.js UI -> Modal web endpoint -> backend/profile_core.py -> policyengine-us / policyengine-uk
```

The backend returns structured JSON:

- Baseline setup timing
- Reform setup timing
- Baseline variable timing
- Reform variable timing
- Total and primitive call counts
- Top cumulative functions
- Raw `pstats` text
- Variable output summary across the income axis

## Defaults

The rebuilt app keeps country-specific presets but removes the brittle hardcoded assumptions from the old repo.

- US: current-safe ACA extension benchmark
- UK: Universal Credit taper benchmark

## Setup

1. Install Node dependencies:

```bash
npm install
```

2. Point the local Next.js route at a Python environment with PolicyEngine installed:

```bash
export POLICYENGINE_PYTHON=/path/to/python
```

Optional repo-path overrides if you want to profile local checkouts instead of installed packages:

```bash
export POLICYENGINE_CORE_PATH=/path/to/policyengine-core
export POLICYENGINE_US_PATH=/path/to/policyengine-us
export POLICYENGINE_UK_PATH=/path/to/policyengine-uk
```

3. Run the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

Local development uses the Node route at [route.js](/Users/maxghenis/PolicyEngine/policyengine-profiler/app/api/local-profile/route.js), which shells out to the shared Python runner.

## Hosted backend

Deploy the Modal backend from [modal_app.py](/Users/maxghenis/PolicyEngine/policyengine-profiler/modal_app.py):

```bash
python3 -m pip install modal
unset MODAL_TOKEN_ID MODAL_TOKEN_SECRET
modal deploy modal_app.py
```

That deploys the backend currently at:

```text
https://policyengine--policyengine-profiler-profile.modal.run
```

The frontend now falls back to that production URL automatically. If you want to override it in Vercel, set `NEXT_PUBLIC_API_URL`:

```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel --prod --force --yes --scope policy-engine
```

Use [.env.example](/Users/maxghenis/PolicyEngine/policyengine-profiler/.env.example) as the frontend env template.

## Commands

```bash
npm run dev
npm run lint
npm test
npm run build
```

## API contract

`POST {NEXT_PUBLIC_API_URL}` in production, or `POST /api/local-profile` in local development.

Example payload:

```json
{
  "country": "us",
  "incomePoints": 401,
  "variable": "aca_ptc"
}
```

Example response shape:

```json
{
  "ok": true,
  "creation": {
    "baseline": { "elapsedSeconds": 0.03 },
    "reform": { "elapsedSeconds": 19.1 },
    "deltaSeconds": 19.07,
    "ratio": 694.58
  },
  "variable": {
    "baseline": { "elapsedSeconds": 0.18 },
    "reform": { "elapsedSeconds": 27.51 },
    "deltaSeconds": 27.33,
    "ratio": 154.23
  }
}
```

## Verification

These checks passed in this workspace:

```bash
npm test
npm run lint
npm run build
```

I also verified the shared Python backend directly with:

```bash
/Users/maxghenis/venv_analysis/bin/python scripts/profile_policyengine.py \
  <<< '{"country":"us","incomePoints":11,"variable":"aca_ptc"}'
```

That returned a successful JSON response with live timings from the current local `policyengine-us` environment.

## Notes

- Local development uses the existing Python environment you point `POLICYENGINE_PYTHON` at.
- Hosted profiling is implemented in [modal_app.py](/Users/maxghenis/PolicyEngine/policyengine-profiler/modal_app.py).
- The Modal image pins Python 3.13 plus `policyengine-us==1.633.2` and `policyengine-uk==2.78.0`, which are current public PyPI releases compatible with Modal.
- The UI uses the `policyengine-claude` standalone-tool conventions: Next.js, Tailwind, PE tokens, and an embeddable hash model.
- `bun` was not available in this machine’s PATH, so the same scaffold was implemented with `npm`.
