# Unity Catalog Governance Tool

A full-stack application for managing Databricks Unity Catalog objects with GitOps workflows.

## Architecture

- **Frontend**: AppKit (TypeScript + React)
- **Backend**: tRPC + Express
- **Database**: Lakebase (Postgres) for metadata and audit trail
- **Automation**: GitHub Actions for auto-merge and Databricks execution
- **API**: Databricks REST API for UC object management

## Features

- UC object discovery & display (catalogs, schemas, tables, external locations, credentials, volumes, models, delta shares)
- UC object creation via web UI
- GitOps workflow: App → dev branch → PR → auto-merge → GitHub Actions → Databricks
- Metadata persistence and audit trail in Lakebase
- Execution history tracking

## Getting Started

### Prerequisites

- Databricks workspace with Unity Catalog enabled
- GitHub account with PAT token
- Node.js 18+
- Databricks CLI v1.0.0+

### Configuration

1. **GitHub Remote**:
   ```bash
   git remote add origin https://github.com/md05-portfolio/ai-dev-poc.git
   ```

2. **GitHub Secrets** (in repo settings):
   - `DATABRICKS_PAT`: PAT token from `~/.databrickscfg`
   - `DATABRICKS_HOST`: Workspace URL

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Phase 0 Progress

- ✅ Directory structure created
- ✅ Stub files created
- ⏳ GitHub remote configuration (next)
- ⏳ GitHub Secrets setup (next)
- ⏳ Initial commit and push (next)

## Implementation Roadmap

See `../claude_databricks.md` for the complete 10-phase implementation plan.

## Resources

- Databricks Workspace: https://dbc-b8aa7520-6421.cloud.databricks.com
- GitHub Repo: https://github.com/md05-portfolio/ai-dev-poc
