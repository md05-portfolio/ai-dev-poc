-- Create schema first
CREATE SCHEMA IF NOT EXISTS uc_governance;

-- Unity Catalog Governance Tool - Lakebase Schema
-- Database: uc_governance

-- Table 1: UC Objects Registry
CREATE TABLE IF NOT EXISTS uc_governance.uc_objects (
    object_id       TEXT PRIMARY KEY,
    object_type     TEXT,        -- CATALOG, SCHEMA, TABLE, EXTERNAL_LOCATION, CREDENTIAL, DELTA_SHARE, VOLUME, MODEL, FUNCTION
    full_path       TEXT,        -- e.g., "catalog.schema.table"
    parent_path     TEXT,        -- e.g., "catalog.schema"
    display_name    TEXT,
    config_json     TEXT,        -- Serialized config (properties, permissions, etc.)
    created_by      TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status          TEXT,        -- DRAFT, PENDING, EXECUTED, FAILED, ROLLBACK
    pr_url          TEXT,
    commit_hash     TEXT
);

-- Table 2: UC Diffs - Track changes between versions
CREATE TABLE IF NOT EXISTS uc_governance.uc_diffs (
    diff_id         TEXT PRIMARY KEY,
    object_id       TEXT,
    diff_type       TEXT,        -- CREATE, UPDATE, DELETE
    old_config_json TEXT,
    new_config_json TEXT,
    diff_json       TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by      TEXT,
    pr_url          TEXT
);

-- Table 3: UC Execution History - Audit trail
CREATE TABLE IF NOT EXISTS uc_governance.uc_execution_history (
    execution_id        TEXT PRIMARY KEY,
    object_id           TEXT,
    pr_url              TEXT,
    commit_hash         TEXT,
    status              TEXT,    -- SUCCESS, FAILED, ROLLBACK
    command_executed    TEXT,
    error_message       TEXT,
    error_log           TEXT,
    executed_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    rollback_id         TEXT
);

-- Table 4: UC Audit Trail - User actions
CREATE TABLE IF NOT EXISTS uc_governance.uc_audit_trail (
    audit_id        TEXT PRIMARY KEY,
    user_email      TEXT,
    action          TEXT,        -- CREATE_OBJECT, SUBMIT_PR, MERGE_PR, EXECUTE
    object_id       TEXT,
    object_type     TEXT,
    details_json    TEXT,
    timestamp       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: GitHub Sync State - PR tracking
CREATE TABLE IF NOT EXISTS uc_governance.github_sync_state (
    sync_id         TEXT PRIMARY KEY,
    branch_name     TEXT,
    pr_number       INT,
    pr_url          TEXT,
    status          TEXT,        -- CREATED, APPROVED, MERGED, EXECUTED
    commit_hash     TEXT,
    last_sync_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uc_objects_status ON uc_governance.uc_objects(status);
CREATE INDEX IF NOT EXISTS idx_uc_objects_object_id ON uc_governance.uc_objects(object_id);
CREATE INDEX IF NOT EXISTS idx_uc_execution_object_id ON uc_governance.uc_execution_history(object_id);
CREATE INDEX IF NOT EXISTS idx_uc_audit_user ON uc_governance.uc_audit_trail(user_email);
CREATE INDEX IF NOT EXISTS idx_github_sync_pr ON uc_governance.github_sync_state(pr_number);
