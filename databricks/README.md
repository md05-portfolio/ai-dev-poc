# Unity Catalog Governance Tool

A lightweight Streamlit app for managing Databricks Unity Catalog objects with GitOps workflows.

## Features

- **UC Object Management** - Create and manage catalogs, schemas, tables, external locations, credentials, volumes, models, and delta shares
- **Status Tracking** - Track object lifecycle (DRAFT → PENDING → EXECUTED)
- **Audit Trail** - Full audit log of all user actions
- **Execution History** - View execution results and error logs
- **GitHub Integration** - Submit objects for review via GitHub PRs (coming soon)
- **Lakebase Storage** - Persistent metadata and audit trail in Databricks Lakebase Postgres

## Architecture

```
app.py (Streamlit app) ↔ Lakebase Postgres ↔ Databricks workspace
```

- **Frontend**: Streamlit (Python)
- **Database**: Lakebase (Postgres in Databricks)
- **Tables**: 5 tables for objects, diffs, execution history, audit trail, and GitHub sync state

## Installation

### Prerequisites
- Python 3.10+
- Access to Databricks workspace with Lakebase project
- Lakebase connection credentials

### Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables** (or use defaults):
   ```bash
   export PGHOST="your-lakebase-endpoint"
   export PGUSER="your-email@example.com"
   export PGPASSWORD="your-oauth-token"
   export PGDATABASE="databricks_postgres"
   ```

3. **Run the app**:
   ```bash
   streamlit run app.py
   ```

   The app will open at `http://localhost:8501`

## Pages

- **Home** - Dashboard with object counts and recent activity
- **Create Object** - Form to create new UC objects
- **Manage Objects** - View, filter, and manage existing objects
- **Audit Trail** - View all user actions
- **Execution History** - View execution results

## Database Schema

```sql
uc_governance.uc_objects            -- UC object registry
uc_governance.uc_diffs              -- Change tracking
uc_governance.uc_execution_history  -- Execution audit trail
uc_governance.uc_audit_trail        -- User action log
uc_governance.github_sync_state     -- PR tracking
```

## Deployment

### Databricks Streamlit

The simplest deployment option:

```bash
databricks apps init --name uc-governance --features streamlit \
  --set streamlit.path=./app.py \
  --profile DEFAULT
```

Then deploy:

```bash
databricks apps deploy uc-governance --profile DEFAULT
```

### Local Development

```bash
streamlit run app.py
```

## Configuration

### Lakebase Credentials

The app uses these environment variables (fallback to defaults):
- `PGHOST` - Lakebase endpoint hostname
- `PGUSER` - Postgres username (usually your Databricks email)
- `PGPASSWORD` - OAuth token or password
- `PGDATABASE` - Database name (default: databricks_postgres)

### GitHub Integration

GitHub PR submission is wired but requires:
- GitHub token stored in Databricks workspace secret
- Repository URL configuration
- Branch naming conventions

## Next Phases

- **Phase 3**: UC Discovery - Query Databricks workspace for existing UC objects
- **Phase 4**: GitHub Actions - Auto-merge and execution workflows
- **Phase 5**: Advanced Features - Edit, delete, bulk operations
