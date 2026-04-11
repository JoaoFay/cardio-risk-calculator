# LabIA — Agent Instructions

This file is the source of truth for all agents (CTO, etc.) working in this repository.

---

## Git Branching Rules

### Core Rules (Mandatory)

| Rule | Detail |
|------|--------|
| **Never push to `main` directly** | All changes go to `develop` or a `feature/*` branch |
| **`main` = production** | Only receives merges from `develop` with board approval |
| **Default branch** | `develop` |
| **Feature branches** | `feature/<short-name>`, branched off `develop` |

### Workflow

```bash
# Start from develop
git checkout develop && git pull origin develop

# Small fix → commit to develop directly
git add <files>
git commit -m "fix: description\n\nCo-Authored-By: Paperclip <noreply@paperclip.ing>"
git push origin develop

# Large feature → use feature branch
git checkout -b feature/<name>
# work...
git checkout develop
git merge feature/<name>
git push origin develop
```

### Merging `develop → main`

**Requires board approval via Paperclip.** Steps:
1. Create a Paperclip approval task with a change summary.
2. Wait for explicit board approval.
3. Only then: merge develop into main, tag the release.

No agent may merge to `main` autonomously.

---

## Commit Format

```
type: short description

Co-Authored-By: Paperclip <noreply@paperclip.ing>
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`

---

## Testing Before Committing

No automated test suite yet. Before committing:

1. Run TypeScript check: `npx tsc --noEmit`
2. For significant changes, verify app starts: `npx expo start`
3. Manually test affected screens/features

---

## Project Stack

- React Native + Expo SDK ~54 (TypeScript)
- Local storage: AsyncStorage
- Backend: Vercel Serverless Functions (Node.js)
- AI: GPT-4o-mini
- Notifications: expo-notifications (local push)
- PDF: expo-print + expo-sharing
- Version: see `package.json` and `app.json`
