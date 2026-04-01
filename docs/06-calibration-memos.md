# Calibration Memo Engine

## Purpose
Generate structured methodology defense and calibration documentation from platform data. Memos support internal review, external stakeholder communication, and regulatory compliance.

## Memo Types

### 1. Weighting Defense
Documents and defends weight choices for a specific methodology profile.
- Current weights with rationale
- Portfolio behavior under this profile
- Known limitations and assumptions
- Validation needs

### 2. Calibration Review
Reviews model calibration across all profiles.
- Portfolio summary and family distribution
- Scoring behavior analysis
- Detected calibration issues
- Recommendations

### 3. Portfolio Risk Methodology
Documents risk methodology applied to the full portfolio.
- Portfolio composition and decision distribution
- Capital mode distribution
- Methodology framework description

### 4. Sector Family Scoring
Documents scoring for a specific sector family.
- Family definition and project types
- Profile configuration and weight rationale

### 5. Instrument Logic
Documents instrument-specific decision logic differences.
- Logic for each instrument type
- Decision signal descriptions

### 6. Grant/Blended Readiness
Assesses portfolio readiness for grant and blended finance.
- Grant and blended portfolio summaries
- Readiness assessment

## Memo Structure
Each memo includes:
- Title, type, timestamp
- Purpose and scope statements
- Structured sections with headings and content
- Recommendations
- Confidence statement
- Validation needs

## API Endpoints
- `POST /api/calibration/memos/generate` — Generate a new memo
- `GET /api/calibration/memos` — List all memos
- `GET /api/calibration/memos/:id` — Get specific memo

## Files
- `artifacts/api-server/src/lib/memo-generator.ts`
- `lib/db/src/schema/methodology-defense.ts`
- `artifacts/api-server/src/routes/methodology.ts`
