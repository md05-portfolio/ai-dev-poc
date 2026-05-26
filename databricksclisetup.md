# Databricks CLI Setup

## Status
✅ **COMPLETE** - Modern CLI (v1.0.0) installed and verified. Databricks connection working.

## Current State
- **Old Python CLI (v0.18.0)**: ✅ Uninstalled
- **Modern Databricks CLI (v1.0.0)**: ✅ Installed via WinGet, command alias added
- **Issue**: Command not recognized until PowerShell is restarted
- **Next Step**: Restart PowerShell and verify with `databricks --version`

## Installation Process

### Issue Encountered
1. Old Python package (`databricks-cli 0.18.0`) was in PATH, blocking modern CLI
2. Attempted `winget install` → showed "No available upgrade found"
3. Solution: Uninstall WinGet package completely, then fresh install

### Commands Run
```powershell
# Step 1: Remove old Python package
pip uninstall databricks-cli -y

# Step 2: Clean uninstall of WinGet version
winget uninstall --id Databricks.DatabricksCLI --exact

# Step 3: Fresh install modern CLI
winget install --id Databricks.DatabricksCLI --exact
# Output: Successfully installed v1.0.0, Command line alias added

# Step 4: RESTART PowerShell FIRST, then verify
# databricks --version  (run in new PowerShell window)
```

## Verification Complete (2026-05-25)
1. ✅ PowerShell restarted
2. ✅ Verified: `databricks --version` shows v1.0.0
3. ✅ Authenticated: PAT from ~/.databrickscfg working
4. ✅ Clusters list accessible
5. ✅ Jobs list accessible
6. ⏳ Next: Build Unity Catalog metrics dashboard app with AppKit

## Why This Matters
- Old CLI (v0.18.0): No `databricks apps` command support
- Modern CLI (v1.0.0): Full AppKit, apps management, latest features
- Required for: Building Databricks Apps with TypeScript/React

## Files Related
- `CLAUDE.md` - Databricks authentication config with PAT
- `.databrickscfg` - PAT token stored securely
