# Session Summary: Unity Catalog Governance Tool

## Session Date: 2026-05-25

---

## What Was Accomplished This Session

### 1. Databricks CLI Verification
- **Confirmed**: Modern Databricks CLI v1.0.0 is installed and working
- **Authentication**: PAT token in `~/.databrickscfg` is valid
- **Workspace**: https://dbc-b8aa7520-6421.cloud.databricks.com
- **Commands verified**: `databricks --version`, `databricks clusters list`, `databricks jobs list`
- **Updated**: `databricksclisetup.md` status from IN PROGRESS → COMPLETE

### 2. GitHub Setup Discovered
- **GitHub user**: `md05-portfolio`
- **GitHub repo**: `md05-portfolio/ai-dev-poc` (public, currently empty, created 2026-05-03)
- **GitHub CLI**: Authenticated with `repo` + `workflow` scopes
- **Local git**: Initialized in `C:\Users\madhy\claude-projects`, no remote connected yet
- **No remote configured yet** — needs `git remote add origin` in Phase 0

### 3. Databricks Apps Manifest Explored
- Ran `databricks apps manifest --profile DEFAULT`
- Available plugins: `analytics`, `lakebase`, `agents`, `files`, `genie`, `jobs`, `serving`, `server` (required)
- SQL Warehouse found: **"Serverless Starter Warehouse"** (ID: `3d680350834929bc`, status: STOPPED)

### 4. Architecture Decisions Made
| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | AppKit (TypeScript + React) | Native Databricks, tRPC type-safety |
| State | Lakebase (Postgres) | Persistent metadata, audit trail |
| API | Databricks REST API (via fetch) | No extra dependencies |
| Automation | GitHub Actions | Native GitHub, PAT auth |
| Branching | `dev` → `main` with linear history | GitOps, sequential merges |
| Auto-merge | Yes, optional 1-approval gate | Safety + speed |

### 5. Comprehensive Implementation Plan Created

---

## The Full Plan

### Project Goal
Build a **Unity Catalog Administration & Governance Tool** with:
- UC object discovery & display (all types)
- UC object creation via app UI
- GitOps workflow: App → dev branch → PR → auto-merge → GitHub Actions executes in Databricks
- Lakebase for metadata, diffs, and audit trail

### Architecture Overview
```
[Frontend: AppKit React]
  ├─ UC Discovery & Display (tabs/drill-down)
  ├─ Object Creation Forms (one per UC type)
  ├─ Diff/Review Interface (before submit)
  └─ Status Dashboard (execution history)
        ↓
[Backend: tRPC + AppKit Server]
  ├─ UC Discovery (list catalogs, schemas, tables, etc.)
  ├─ UC Creation (create objects via Databricks API)
  ├─ Git Integration (create branches, commits, PRs)
  └─ Lakebase Sync (persist metadata & audit trail)
        ↓
[Persistence & Control]
  ├─ Lakebase (Postgres): Metadata, diffs, audit, execution
  ├─ GitHub (md05-portfolio/ai-dev-poc): Source control + workflows
  └─ Databricks workspace: UC object execution
        ↓
[Automation Workflows]
  ├─ .github/workflows/auto-merge.yml: Auto-merge dev PRs to main
  └─ .github/workflows/execute-databricks.yml: Execute on main merge
```

---

## Lakebase Schema Design

**Database name**: `uc_governance` (in Databricks default catalog)

### Table 1: uc_objects
Registry of all UC objects created/managed
```sql
CREATE TABLE uc_governance.uc_objects (
    object_id       TEXT PRIMARY KEY,
    object_type     TEXT,        -- CATALOG, SCHEMA, TABLE, EXTERNAL_LOCATION, CREDENTIAL, DELTA_SHARE, VOLUME, MODEL, FUNCTION
    full_path       TEXT,        -- e.g., "catalog.schema.table"
    parent_path     TEXT,        -- e.g., "catalog.schema"
    display_name    TEXT,
    config_json     TEXT,        -- Serialized config (properties, permissions, etc.)
    created_by      TEXT,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ,
    status          TEXT,        -- DRAFT, PENDING, EXECUTED, FAILED, ROLLBACK
    pr_url          TEXT,
    commit_hash     TEXT
);
```

### Table 2: uc_diffs
Track changes between versions
```sql
CREATE TABLE uc_governance.uc_diffs (
    diff_id         TEXT PRIMARY KEY,
    object_id       TEXT,
    diff_type       TEXT,        -- CREATE, UPDATE, DELETE
    old_config_json TEXT,
    new_config_json TEXT,
    diff_json       TEXT,
    created_at      TIMESTAMPTZ,
    created_by      TEXT,
    pr_url          TEXT
);
```

### Table 3: uc_execution_history
Audit trail of Databricks executions
```sql
CREATE TABLE uc_governance.uc_execution_history (
    execution_id        TEXT PRIMARY KEY,
    object_id           TEXT,
    pr_url              TEXT,
    commit_hash         TEXT,
    status              TEXT,    -- SUCCESS, FAILED, ROLLBACK
    command_executed    TEXT,
    error_message       TEXT,
    error_log           TEXT,
    executed_at         TIMESTAMPTZ,
    rollback_id         TEXT
);
```

### Table 4: uc_audit_trail
User action log
```sql
CREATE TABLE uc_governance.uc_audit_trail (
    audit_id        TEXT PRIMARY KEY,
    user_email      TEXT,
    action          TEXT,        -- CREATE_OBJECT, SUBMIT_PR, MERGE_PR, EXECUTE
    object_id       TEXT,
    object_type     TEXT,
    details_json    TEXT,
    timestamp       TIMESTAMPTZ
);
```

### Table 5: github_sync_state
GitHub PR tracking
```sql
CREATE TABLE uc_governance.github_sync_state (
    sync_id         TEXT PRIMARY KEY,
    branch_name     TEXT,
    pr_number       INT,
    pr_url          TEXT,
    status          TEXT,        -- CREATED, APPROVED, MERGED, EXECUTED
    commit_hash     TEXT,
    last_sync_at    TIMESTAMPTZ
);
```

---

## 10-Phase Implementation Roadmap

### Phase 0: Setup & Prerequisites (2-3 days)
**Goal**: Connect repo to GitHub, configure secrets, create directory structure.

**Tasks**:
1. `git remote add origin https://github.com/md05-portfolio/ai-dev-poc.git`
2. Create `.github/workflows/` stubs for auto-merge.yml, execute-databricks.yml
3. Create directories: `server/`, `client/src/`, `databricks/`, `config/`
4. Configure GitHub Secrets: `DATABRICKS_PAT`, `DATABRICKS_HOST`
5. Configure branch protection on `main` (linear history, optional 1-approval)
6. Create Databricks workspace secret: `github_token` (for GitHub API calls from tRPC backend)
7. Initial git commit with stubs pushed to main

**Key Files Created**:
- `.github/workflows/auto-merge.yml` (stub)
- `.github/workflows/execute-databricks.yml` (stub)
- `server/server.ts` (stub)
- `client/src/App.tsx` (stub)
- `config/lakebase.schema.sql` (stub)
- `app.yaml` (stub)

**Verification**: GitHub remote configured, branch protection enforced, first commit visible on GitHub

---

### Phase 1: Lakebase Database Scaffolding (1-2 days)
**Goal**: Design and deploy Postgres schema for metadata persistence.

**Tasks**:
1. Write full SQL schema in `config/lakebase.schema.sql` (5 tables above)
2. Add indexes on (object_id, pr_url, created_at)
3. Create `databricks/provision-lakebase.py` to deploy schema
4. Execute provisioning against Databricks Lakebase
5. Verify tables in Lakebase UI

**Verification**: All 5 tables visible in `uc_governance` schema in Lakebase UI, can insert/query test rows

---

### Phase 2: AppKit Project Scaffolding (2-3 days)
**Goal**: Initialize AppKit project with TypeScript/React, Lakebase, tRPC.

**Command to run**:
```bash
databricks apps init \
  --name uc-governance \
  --features analytics,lakebase \
  --set analytics.sql-warehouse.id=3d680350834929bc \
  --set lakebase.postgres.branch=<BRANCH_NAME> \
  --set lakebase.postgres.database=<DB_NAME> \
  --description "Unity Catalog Governance Tool" \
  --run none \
  --profile DEFAULT
```

**Note**: Get BRANCH_NAME and DB_NAME from:
```bash
databricks postgres list-projects --profile DEFAULT
databricks postgres list-branches <project-name> --profile DEFAULT
databricks postgres list-databases <branch-name> --profile DEFAULT
```

**Tasks**:
1. Run `databricks apps init` (command above)
2. Configure Lakebase connection in `server/server.ts`
3. Set up tRPC router stubs in `server/routers/`
4. Verify dev server starts: `databricks apps run --profile DEFAULT`

**Verification**: `npm install` succeeds, dev server runs on localhost:5173, no TypeScript errors

---

### Phase 3: UC Discovery Backend - tRPC (3-4 days)
**Goal**: Implement tRPC endpoints to list UC objects from Databricks.

**Files to create**:
- `server/uc-discovery.ts` — Functions calling Databricks REST API
- `server/lib/databricks-api.ts` — API client wrapper with auth
- `server/routers/uc.ts` — tRPC query endpoints

**tRPC Endpoints**:
- `uc.listCatalogs.query()` → calls `/api/2.1/catalogs`
- `uc.listSchemas.query({catalogName})` → calls `/api/2.1/schemas?catalog_name=...`
- `uc.listTables.query({catalogName, schemaName})` → calls `/api/2.1/tables?...`
- `uc.listExternalLocations.query()` → calls `/api/2.1/external-locations`
- `uc.listCredentials.query()` → calls `/api/2.1/credentials`
- `uc.listVolumes.query()` → calls `/api/2.1/volumes`
- `uc.listModels.query()` → calls `/api/2.1/models`
- `uc.listDeltaShares.query()` → calls `/api/2.1/delta-shares`

**Also**:
- Cache discovered objects in Lakebase `uc_objects` with `status=DISCOVERED`
- Add error handling and retry logic

**Verification**: tRPC call returns catalog list from Databricks, Lakebase shows DISCOVERED rows

---

### Phase 4: UC Creation Backend - tRPC (3-4 days)
**Goal**: Implement tRPC endpoints to create UC objects via Databricks API.

**Files to create**:
- `server/uc-creation.ts` — Create functions for each UC type
- `server/lib/validation.ts` — Input validation utilities
- `server/routers/uc-create.ts` — tRPC mutation endpoints

**tRPC Endpoints**:
- `uc.create.mutation({objectType, name, config, ...})` → creates object, returns object_id

**Functions**: createCatalog, createSchema, createTable, createExternalLocation, createCredential, createVolume, createModel, createDeltaShare

**State**:
- Generate UUID for object_id
- Store in Lakebase `uc_objects` with `status=DRAFT`
- Save full API payload in config_json

**Verification**: tRPC mutation call → Databricks API returns 201 → Lakebase row shows status=DRAFT

---

### Phase 5: Git Integration Backend - tRPC (2-3 days)
**Goal**: Implement tRPC endpoints for GitHub operations (branches, commits, PRs).

**Files to create**:
- `server/lib/github-api.ts` — Octokit wrapper for GitHub API
- `server/git-integration.ts` — Git helper functions
- `server/routers/git.ts` — tRPC mutation endpoints

**tRPC Endpoints**:
- `git.submitPR.mutation({objectId, targetBranch='main'})` → creates PR, updates Lakebase to PENDING
- `git.mergePR.mutation({prNumber})` → merges PR, updates Lakebase to EXECUTED

**GitHub API Operations**:
- Create branch from dev: `POST /repos/md05-portfolio/ai-dev-poc/git/refs`
- Commit config file: `PUT /repos/md05-portfolio/ai-dev-poc/contents/{path}`
- Create PR: `POST /repos/md05-portfolio/ai-dev-poc/pulls`
- Approve PR: `POST /repos/md05-portfolio/ai-dev-poc/pulls/{pr_number}/reviews`
- Merge PR: `PUT /repos/md05-portfolio/ai-dev-poc/pulls/{pr_number}/merge`

**Submit PR Workflow**:
1. Get object from Lakebase
2. Create feature branch `feature/uc-{type}-{name}` from dev
3. Commit object config JSON to branch
4. Create PR to main
5. Update Lakebase: status=PENDING, pr_url=<url>

**Verification**: tRPC call → GitHub shows new PR → Lakebase github_sync_state row created

---

### Phase 6: Frontend - UC Browser UI (4-5 days)
**Goal**: React components to display all UC objects with drill-down navigation.

**Files to create**:
- `client/src/components/Layout.tsx` — Tab navigation for each UC type
- `client/src/components/UCObjectList.tsx` — Table view of objects
- `client/src/components/UCObjectDetail.tsx` — Detail view, related objects, actions
- `client/src/components/Dashboard.tsx` — Counts, recent changes, PR queue, history
- `client/src/trpc.ts` — tRPC client setup

**UI Structure**:
- Tabs: Catalogs | Schemas | Tables | External Locations | Credentials | Volumes | Models | Delta Shares
- Each tab: List view → click to drill-down → detail view
- Dashboard: counts by type, recent activity, pending PRs, execution history
- Status indicator: Databricks connected ✓/✗

**Verification**: Dev server shows all tabs, data loads from tRPC, drill-down works

---

### Phase 7: Frontend - Object Creation Forms (4-5 days)
**Goal**: React form components for creating each UC object type.

**Files to create**:
- `client/src/components/forms/BaseObjectForm.tsx`
- `client/src/components/forms/CatalogForm.tsx`
- `client/src/components/forms/SchemaForm.tsx`
- `client/src/components/forms/TableForm.tsx`
- `client/src/components/forms/ExternalLocationForm.tsx`
- `client/src/components/forms/CredentialForm.tsx`
- `client/src/components/forms/VolumeForm.tsx`
- `client/src/components/forms/ModelForm.tsx`
- `client/src/components/forms/DeltaShareForm.tsx`
- `client/src/hooks/useForm.ts`

**Form Workflow**:
1. Click "Create [Type]" → modal with form opens
2. Fill fields, client-side validation
3. Submit → tRPC `uc.create.mutation()` called
4. Success toast → Lakebase row created with status=DRAFT
5. Review panel auto-populated

**Verification**: Create button → form modal → submit → DRAFT status in Lakebase

---

### Phase 8: Frontend - Review & Diff UI (3-4 days)
**Goal**: Build diff viewer and review interface before submitting PR.

**Files to create**:
- `client/src/components/DiffViewer.tsx` — Before/after JSON diff with color highlighting
- `client/src/components/ReviewPanel.tsx` — DRAFT objects, diff, impact, "Submit PR" button
- `client/src/components/ApprovalPanel.tsx` — Pending PRs, merge status, execution history

**Submit PR Workflow**:
1. Draft object appears in ReviewPanel
2. User reviews diff and estimated impact
3. Click "Submit PR" → tRPC `git.submitPR.mutation()` called
4. PR created on GitHub, status → PENDING
5. PR URL shown in app
6. Once merged + executed → status shown as EXECUTED

**Verification**: Create object → review panel shows diff → submit PR → GitHub PR visible → status updates

---

### Phase 9: GitHub Actions Workflows (2-3 days)
**Goal**: Implement automated merge and execution workflows.

**Workflow 1: `.github/workflows/auto-merge.yml`**
- Trigger: PR opened on `dev` → `main`
- Steps: validate PR → auto-merge (rebase strategy)
- Tool: `pascalgn/automerge-action` or `actions/github-script`

**Workflow 2: `.github/workflows/execute-databricks.yml`**
- Trigger: Push to `main` branch
- Steps:
  1. Checkout code
  2. Set credentials from GitHub Secrets
  3. Install Databricks CLI
  4. Find UC object config files in commit
  5. For each object: call Databricks REST API to create object
  6. Log results, update Lakebase execution history
  7. On failure: post error comment to GitHub PR, alert user

**GitHub Secrets to configure** (in repo Settings → Secrets):
| Secret | Value |
|--------|-------|
| `DATABRICKS_PAT` | PAT token from `~/.databrickscfg` |
| `DATABRICKS_HOST` | `https://dbc-b8aa7520-6421.cloud.databricks.com` |

**Branch Protection on `main`** (configure in GitHub repo Settings → Branches):
- Require linear history: ✅ ON
- Require approvals: 1 (optional, toggle off for fully automated)
- Dismiss stale reviews on new commits: ✅ ON

**Verification**: Push to main → GitHub Actions run → UC object created in Databricks → Lakebase updated

---

### Phase 10: End-to-End Testing & Deployment (3-5 days)
**Goal**: Full workflow test + deploy to Databricks.

**Full E2E Test**:
1. Open app in browser
2. Click Catalogs tab → see existing catalogs
3. Click "Create Catalog" → fill name/description → Submit
4. Review panel shows new catalog DRAFT with diff
5. Click "Submit PR" → GitHub PR auto-created
6. auto-merge.yml runs → PR merged to main
7. execute-databricks.yml runs → catalog created in Databricks
8. Catalog visible in Databricks workspace
9. Lakebase `uc_execution_history` shows SUCCESS
10. Dashboard shows execution in history

**Deploy App**:
```bash
databricks apps deploy --profile DEFAULT
```

---

## File Structure at Completion

```
C:\Users\madhy\claude-projects\
├── .github/
│   └── workflows/
│       ├── auto-merge.yml
│       └── execute-databricks.yml
├── server/
│   ├── server.ts
│   ├── routers/
│   │   ├── uc.ts
│   │   ├── uc-create.ts
│   │   └── git.ts
│   ├── lib/
│   │   ├── databricks-api.ts
│   │   ├── github-api.ts
│   │   └── validation.ts
│   ├── uc-discovery.ts
│   ├── uc-creation.ts
│   └── git-integration.ts
├── client/
│   └── src/
│       ├── App.tsx
│       ├── trpc.ts
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── UCObjectList.tsx
│       │   ├── UCObjectDetail.tsx
│       │   ├── Dashboard.tsx
│       │   ├── DiffViewer.tsx
│       │   ├── ReviewPanel.tsx
│       │   ├── ApprovalPanel.tsx
│       │   └── forms/
│       │       ├── BaseObjectForm.tsx
│       │       ├── CatalogForm.tsx
│       │       ├── SchemaForm.tsx
│       │       ├── TableForm.tsx
│       │       ├── ExternalLocationForm.tsx
│       │       ├── CredentialForm.tsx
│       │       ├── VolumeForm.tsx
│       │       ├── ModelForm.tsx
│       │       └── DeltaShareForm.tsx
│       └── hooks/
│           └── useForm.ts
├── databricks/
│   ├── provision-lakebase.py
│   └── dev.sql
├── config/
│   └── lakebase.schema.sql
├── app.yaml
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── CLAUDE.md
├── databricksclisetup.md
├── claude_databricks.md    ← this file
└── README.md
```

---

## Known Limitations (Phase 10)
- ❌ Editing existing UC objects not supported yet (Phase 11)
- ❌ Deleting UC objects not supported yet (Phase 11)
- ❌ Bulk operations not supported yet (Phase 11)
- ❌ Auto-rollback on execution failure not implemented (Phase 11 - manual revert via GitHub UI)
- ⚠️ Approval gates are optional (configurable in auto-merge.yml)

---

## Key Resources

| Resource | Value |
|----------|-------|
| Databricks Workspace | https://dbc-b8aa7520-6421.cloud.databricks.com |
| GitHub Repo | https://github.com/md05-portfolio/ai-dev-poc |
| SQL Warehouse ID | `3d680350834929bc` (Serverless Starter Warehouse) |
| GitHub User | `md05-portfolio` |
| Databricks Config | `~/.databrickscfg` (DEFAULT profile) |
| Plan File | `C:\Users\madhy\.claude\plans\swirling-waddling-elephant.md` |

---

## Where to Start Next Session

**Start with Phase 0**:

1. Connect GitHub remote:
   ```bash
   git remote add origin https://github.com/md05-portfolio/ai-dev-poc.git
   ```

2. Create Lakebase project (needed for Phase 2 scaffolding):
   ```bash
   databricks postgres list-projects --profile DEFAULT
   ```
   If none exists, create one. Then get branch and database names.

3. Add GitHub Secrets in repo settings (https://github.com/md05-portfolio/ai-dev-poc/settings/secrets/actions):
   - `DATABRICKS_PAT` = PAT token from `~/.databrickscfg`
   - `DATABRICKS_HOST` = `https://dbc-b8aa7520-6421.cloud.databricks.com`

4. Start creating directory structure and stubs.

**Model Note**: User switched to Sonnet 4.6 during this session for implementation work.
