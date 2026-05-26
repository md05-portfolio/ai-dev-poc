# Project Setup

## Databricks Authentication

**Status**: ✅ Configured with PAT

**Important**: PAT and authentication credentials are stored in `~/.databrickscfg`
- **Refer to this file for workspace URL and PAT token**
- Do NOT commit this file to version control
- Keep credentials confidential

**Workspace**: https://dbc-b8aa7520-6421.cloud.databricks.com

**Configuration**: See `~/.databrickscfg`
- Stored as: `[DEFAULT]` section with `host` and `token`
- Ready to use with Databricks CLI commands

**CLI Version**: 0.18.0 (Python-based databricks-cli)
- Note: This is an older version with some deprecation warnings, but authentication is working
- Recommendation for future: Upgrade to modern Databricks CLI (v0.292.0+) using WinGet for better stability

**Verified Commands**:
- `databricks clusters list` ✓
- `databricks jobs list` ✓

**Usage**:
```bash
databricks clusters list
databricks jobs list
databricks workspace list /
```

The authentication is pre-configured in `~/.databrickscfg` and ready to use.

## Project Organization

**Databricks Projects**: Use the `databricks` folder for all Databricks projects unless specified otherwise.
