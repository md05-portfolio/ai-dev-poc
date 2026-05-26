"""
Unity Catalog Governance Tool - Streamlit App
A simple governance interface for managing UC objects with GitOps workflows
"""

import streamlit as st
import psycopg
import json
from datetime import datetime
from typing import Optional
import os

# Page configuration
st.set_page_config(
    page_title="UC Governance",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Lakebase connection settings
LAKEBASE_HOST = os.getenv(
    "PGHOST",
    "ep-wispy-cloud-d8aqqkw1.database.us-east-2.cloud.databricks.com",
)
LAKEBASE_USER = os.getenv("PGUSER", "madhyam.dhume@gmail.com")
LAKEBASE_DBNAME = os.getenv("PGDATABASE", "databricks_postgres")
LAKEBASE_PASSWORD = os.getenv("PGPASSWORD", "")

# Object types for UC
UC_OBJECT_TYPES = [
    "CATALOG",
    "SCHEMA",
    "TABLE",
    "EXTERNAL_LOCATION",
    "CREDENTIAL",
    "VOLUME",
    "MODEL",
    "DELTA_SHARE",
]

STATUS_COLORS = {
    "DRAFT": "🟡",
    "PENDING": "🔵",
    "EXECUTED": "🟢",
    "FAILED": "🔴",
    "ROLLBACK": "🟠",
}


@st.cache_resource
def get_db_connection():
    """Get cached database connection"""
    try:
        conn = psycopg.connect(
            host=LAKEBASE_HOST,
            user=LAKEBASE_USER,
            password=LAKEBASE_PASSWORD,
            dbname=LAKEBASE_DBNAME,
            sslmode="require",
        )
        conn.autocommit = True
        return conn
    except Exception as e:
        st.error(f"Failed to connect to Lakebase: {e}")
        return None


def execute_query(query: str, params: Optional[list] = None) -> list:
    """Execute a query and return results"""
    conn = get_db_connection()
    if not conn:
        return []

    try:
        with conn.cursor() as cur:
            cur.execute(query, params or [])
            if cur.description:
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                return [dict(zip(columns, row)) for row in rows]
        return []
    except Exception as e:
        st.error(f"Query error: {e}")
        return []


def execute_insert(query: str, params: list) -> bool:
    """Execute an insert/update/delete query"""
    conn = get_db_connection()
    if not conn:
        return False

    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
        return True
    except Exception as e:
        st.error(f"Insert error: {e}")
        return False


# Page: Home
def page_home():
    st.title("📊 Unity Catalog Governance Tool")
    st.markdown(
        """
    Manage and orchestrate Unity Catalog objects with GitOps workflows.

    **Features:**
    - Create UC objects (catalogs, schemas, tables, etc.)
    - Track object status and changes
    - Submit objects for review via GitHub PRs
    - View audit trail and execution history
    """
    )

    col1, col2, col3 = st.columns(3)

    with col1:
        objects = execute_query(
            "SELECT COUNT(*) as count FROM uc_governance.uc_objects"
        )
        st.metric("Total Objects", objects[0]["count"] if objects else 0)

    with col2:
        draft = execute_query(
            "SELECT COUNT(*) as count FROM uc_governance.uc_objects WHERE status = 'DRAFT'"
        )
        st.metric("Draft", draft[0]["count"] if draft else 0)

    with col3:
        executed = execute_query(
            "SELECT COUNT(*) as count FROM uc_governance.uc_objects WHERE status = 'EXECUTED'"
        )
        st.metric("Executed", executed[0]["count"] if executed else 0)

    st.divider()

    st.subheader("Recent Activity")
    audits = execute_query(
        """
        SELECT user_email, action, object_type, timestamp
        FROM uc_governance.uc_audit_trail
        ORDER BY timestamp DESC
        LIMIT 10
        """
    )

    if audits:
        st.dataframe(audits, use_container_width=True, hide_index=True)
    else:
        st.info("No recent activity")


# Page: Create Object
def page_create_object():
    st.title("➕ Create UC Object")

    with st.form("create_object_form"):
        col1, col2 = st.columns(2)

        with col1:
            object_type = st.selectbox("Object Type", UC_OBJECT_TYPES)
            display_name = st.text_input("Display Name", placeholder="e.g., my_catalog")

        with col2:
            full_path = st.text_input("Full Path", placeholder="e.g., catalog.schema.table")
            config_json = st.text_area(
                "Configuration (JSON)",
                value='{}',
                height=100,
                placeholder='{"key": "value"}',
            )

        description = st.text_area("Description", placeholder="Optional description")

        submitted = st.form_submit_button("Create Object", type="primary")

    if submitted:
        if not display_name or not full_path:
            st.error("Display name and full path are required")
            return

        try:
            config = json.loads(config_json)
        except json.JSONDecodeError:
            st.error("Invalid JSON in configuration")
            return

        object_id = f"{object_type.lower()}-{datetime.now().timestamp()}"

        success = execute_insert(
            """
            INSERT INTO uc_governance.uc_objects
            (object_id, object_type, full_path, display_name, config_json, status, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            [
                object_id,
                object_type,
                full_path,
                display_name,
                json.dumps(config),
                "DRAFT",
                "streamlit-user",
            ],
        )

        if success:
            st.success(f"✅ Object created: {object_id}")
            st.balloons()
        else:
            st.error("Failed to create object")


# Page: Manage Objects
def page_manage_objects():
    st.title("📋 Manage UC Objects")

    # Filter options
    col1, col2, col3 = st.columns(3)

    with col1:
        status_filter = st.multiselect(
            "Filter by Status",
            ["DRAFT", "PENDING", "EXECUTED", "FAILED"],
            default=["DRAFT", "PENDING"],
        )

    with col2:
        type_filter = st.multiselect(
            "Filter by Type",
            UC_OBJECT_TYPES,
            default=UC_OBJECT_TYPES,
        )

    with col3:
        search = st.text_input("Search by name", "")

    # Build query
    where_clauses = []
    params = []

    if status_filter:
        placeholders = ",".join(["%s"] * len(status_filter))
        where_clauses.append(f"status IN ({placeholders})")
        params.extend(status_filter)

    if type_filter:
        placeholders = ",".join(["%s"] * len(type_filter))
        where_clauses.append(f"object_type IN ({placeholders})")
        params.extend(type_filter)

    if search:
        where_clauses.append("(display_name ILIKE %s OR full_path ILIKE %s)")
        params.extend([f"%{search}%", f"%{search}%"])

    where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"

    query = f"""
        SELECT object_id, object_type, full_path, display_name, status,
               created_by, created_at, pr_url
        FROM uc_governance.uc_objects
        WHERE {where_clause}
        ORDER BY created_at DESC
    """

    objects = execute_query(query, params)

    if not objects:
        st.info("No objects found matching your filters")
        return

    st.subheader(f"Objects ({len(objects)})")

    for obj in objects:
        with st.container(border=True):
            col1, col2, col3 = st.columns([2, 1, 1])

            with col1:
                st.markdown(f"**{obj['display_name']}**")
                st.caption(f"{obj['object_type']} • {obj['full_path']}")
                st.caption(f"Created by {obj['created_by']} on {obj['created_at'][:10]}")

            with col2:
                status_icon = STATUS_COLORS.get(obj["status"], "⚪")
                st.markdown(f"{status_icon} {obj['status']}")

            with col3:
                if obj["status"] == "DRAFT":
                    if st.button("📤 Submit PR", key=f"pr_{obj['object_id']}"):
                        success = execute_insert(
                            """
                            UPDATE uc_governance.uc_objects
                            SET status = %s, pr_url = %s, updated_at = CURRENT_TIMESTAMP
                            WHERE object_id = %s
                            """,
                            [
                                "PENDING",
                                f"https://github.com/md05-portfolio/ai-dev-poc/pull/draft",
                                obj["object_id"],
                            ],
                        )
                        if success:
                            st.success("PR submitted!")
                            st.rerun()


# Page: Audit Trail
def page_audit_trail():
    st.title("📝 Audit Trail")

    audits = execute_query(
        """
        SELECT audit_id, user_email, action, object_id, object_type,
               details_json, timestamp
        FROM uc_governance.uc_audit_trail
        ORDER BY timestamp DESC
        LIMIT 100
        """
    )

    if audits:
        # Format for display
        display_audits = []
        for audit in audits:
            display_audits.append({
                "User": audit["user_email"],
                "Action": audit["action"],
                "Object Type": audit["object_type"],
                "Timestamp": audit["timestamp"][:16],
            })

        st.dataframe(display_audits, use_container_width=True, hide_index=True)
    else:
        st.info("No audit records found")


# Page: Execution History
def page_execution_history():
    st.title("⚙️ Execution History")

    executions = execute_query(
        """
        SELECT execution_id, object_id, status, command_executed,
               error_message, executed_at
        FROM uc_governance.uc_execution_history
        ORDER BY executed_at DESC
        LIMIT 50
        """
    )

    if executions:
        # Format for display
        display_execs = []
        for exec_record in executions:
            display_execs.append({
                "Object ID": exec_record["object_id"][:20],
                "Status": STATUS_COLORS.get(exec_record["status"], "⚪") + " " + exec_record["status"],
                "Timestamp": exec_record["executed_at"][:16],
                "Error": exec_record["error_message"][:50] if exec_record["error_message"] else "-",
            })

        st.dataframe(display_execs, use_container_width=True, hide_index=True)
    else:
        st.info("No execution history found")


# Main app
def main():
    st.sidebar.title("Navigation")

    page = st.sidebar.radio(
        "Select Page",
        [
            "Home",
            "Create Object",
            "Manage Objects",
            "Audit Trail",
            "Execution History",
        ],
    )

    st.sidebar.divider()
    st.sidebar.info(
        """
        **UC Governance Tool**

        Database: Lakebase uc_governance

        GitHub: md05-portfolio/ai-dev-poc
        """
    )

    # Route to pages
    if page == "Home":
        page_home()
    elif page == "Create Object":
        page_create_object()
    elif page == "Manage Objects":
        page_manage_objects()
    elif page == "Audit Trail":
        page_audit_trail()
    elif page == "Execution History":
        page_execution_history()


if __name__ == "__main__":
    main()
