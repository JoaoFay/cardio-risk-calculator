# LabIA Freemium System

## Overview

LabIA uses a client-enforced freemium model backed by AsyncStorage persistence and server-side IP rate-limiting as a safety net. The premium tier is in **"em breve" (coming soon)** state for v1.1.0 — no purchase flow is live yet.

---

## Free Tier Limits

| Limit | Value | Scope |
|---|---|---|
| AI analyses | 3 per day | Per device (AsyncStorage) |
| Saved exam history | 5 exams | Per device (AsyncStorage) |

---

## Frontend Implementation

### AsyncStorage Keys

| Key | Type | Purpose |
|---|---|---|
| `labia:premium` | `'true' \| null` | Stores premium status |
| `labia:usage` | `{ date: 'YYYY-MM-DD', count: number }` | Daily analysis counter |
| `medcalc:exams` | `SavedExam[]` | Exam history |
| `labia:onboarding_completed` | `'true' \| null` | Onboarding flag |
| `labia:stale_exams` | `string[]` (id list) | Exams marked stale after edit |

### Storage Modules

- **`src/storage/premiumStorage.ts`** — `isPremium(): Promise<boolean>`  
  Reads `labia:premium` from AsyncStorage.

- **`src/storage/usageStorage.ts`** — `getTodayCount()` / `incrementUsage()`  
  Tracks `{ date, count }`. Resets to 0 automatically when the date changes (daily reset without a cron job).

- **`src/storage/examStorage.ts`** — CRUD for `SavedExam[]`  
  `getAllExams()`, `saveExam()`, `updateExam()`, `deleteExam()`, `getLastExamByType()`, `getExamsByType()`.

### Freemium Check in Form Screens

All four form screens (cardio `FormScreen`, `HemogramaFormScreen`, `LipidogramaFormScreen`, `MetabolicFormScreen`) follow the same pattern before calling the AI:

```ts
const premium = await isPremium();
if (!premium) {
  const count = await getTodayCount();
  if (count >= 3) {
    setShowUpgradeModal(true);  // blocks execution, shows paywall
    return;
  }
}
// ... call AI API ...
await incrementUsage();
```

### History Limit in SaveExamModal

`src/components/SaveExamModal.tsx` reads `isPremium()` before saving. If the user is on the free tier and already has 5+ saved exams, it calls `onUpgradeNeeded()`, which triggers the history `UpgradeModal` via `App.tsx`.

### Upgrade Modal

`src/components/UpgradeModal.tsx` — bottom sheet with two reasons:

- `'analyses'` — "Você atingiu o limite de 3 análises gratuitas por dia."
- `'history'` — "Você atingiu o limite de 5 exames salvos no plano gratuito."

Both lead to `PremiumScreen` via `onLearnMore()`.

### Premium Screen

`src/screens/PremiumScreen.tsx` — lists upcoming premium benefits (unlimited analyses, unlimited history, evolution charts, PDF export, reminders) with a mailto link to express interest. Premium is not yet purchasable.

### PDF Export (Premium Feature)

`src/services/pdfExport.ts` — generates and shares a PDF report of all saved exams.

**Entry point:** `exportExamsPdf(exams: SavedExam[], filter?: ExportFilter): Promise<void>`

**Filter options (`ExportFilter`):**
- `types?: ExamType[]` — restrict to specific modules (e.g. `['cardio', 'hemograma']`)
- `fromDate?: string` — start date in `'YYYY-MM-DD'` format (inclusive)
- `toDate?: string` — end date in `'YYYY-MM-DD'` format (inclusive)

**Flow:**
1. Applies filters to the exam list.
2. Builds an A4-formatted HTML document with LabIA branding (`#f39c12`) containing per-module sections (markers table + AI interpretation).
3. Converts HTML to a PDF file using `expo-print` (`Print.printToFileAsync`).
4. Opens the native share sheet via `expo-sharing` (`Sharing.shareAsync`).

**Feature gate:** `HistoryScreen` calls `isPremium()` before invoking `exportExamsPdf`. Non-premium users are redirected to `PremiumScreen`.

**UI:** A `⭐ PDF` button appears in the top-right corner of `HistoryScreen` (next to the screen title). During export it shows a loading spinner and is disabled to prevent double-taps.

### Home Screen Usage Indicator

`App.tsx` calls `getTodayCount()` + `isPremium()` whenever the user navigates to the home screen. It passes `dailyCount` to `HomeScreen`, which renders:

> Análises hoje: X/3 gratuitas

Hidden for premium users (`dailyCount` passed as `undefined`).

---

## Backend Implementation

### New TypeScript Endpoints (v1.1.0)

All three TypeScript endpoints share the same rate-limiting pattern:

| Endpoint | File | Rate Limit | Redis Prefix |
|---|---|---|---|
| `POST /api/hemograma` | `api/hemograma.ts` | 20 req/hr per IP | `cardio:rl:hemo` |
| `POST /api/lipidograma` | `api/lipidograma.ts` | 20 req/hr per IP | `cardio:rl:lipid` |
| `POST /api/metabolico` | `api/metabolico.ts` | 20 req/hr per IP | `cardio:rl:metabolico` |

Rate limiting uses **Upstash Redis** with a sliding window (`@upstash/ratelimit`). Returns `429` on limit exceeded. The `X-RateLimit-Remaining` header is set on each successful response.

These endpoints do **not** check freemium tier headers — they rely on the client to enforce the 3/day limit. The IP rate limit acts as a DoS safety net.

### Legacy Endpoint (`analyze.js`)

`POST /api/analyze` enforces a server-side monthly freemium check via client-sent headers:

| Header | Value |
|---|---|
| `x-labia-tier` | `'free' \| 'premium'` |
| `x-labia-month` | `'YYYY-MM'` (client's current month) |
| `x-labia-count` | Number of analyses used this month |

Free-tier limit: **3 per month** (different granularity than the client-side 3/day). Returns `402 free_limit_reached` if exceeded.

> **Note:** This endpoint is from v1.0.0 and is not used by the v1.1.0 exam type screens. It may be retired in a future version.

---

## Upgrade Path (Future)

When a purchase flow is implemented:

1. Set `labia:premium = 'true'` in AsyncStorage after successful purchase verification.
2. The daily counter and history limit checks in all screens read `isPremium()` — no code changes needed.
3. Server-side: add a JWT or receipt validation step to the TypeScript endpoints to replace client-sent tier headers.
4. `PremiumScreen` will link to the in-app purchase or web checkout instead of the email link.

---

## Acceptance Criteria (v1.1.0 Status)

| Criterion | Status |
|---|---|
| Free tier limits defined and enforced | ✅ 3 analyses/day + 5 saved exams |
| Paywall/upgrade flow in app | ✅ `UpgradeModal` + `PremiumScreen` |
| Backend Vercel functions enforce freemium limits | ✅ IP rate-limiting (20/hr); legacy `analyze.js` has monthly tier check |
| AsyncStorage compatibility | ✅ All state in AsyncStorage |
| PDF export (premium) | ✅ `expo-print` + `expo-sharing`; premium-gated in `HistoryScreen` |
| Freemium logic documented | ✅ This document |
