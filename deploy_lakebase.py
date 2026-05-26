#!/usr/bin/env python3
"""Deploy Lakebase schema for UC Governance Tool"""

import psycopg
import sys

# Connection parameters
HOST = "ep-wispy-cloud-d8aqqkw1.database.us-east-2.cloud.databricks.com"
TOKEN = "eyJraWQiOiI2NDZiZWZkNGY5NjYwMTdiNjk1MjRjOTRlMjcxNzljY2YyZmRlZDU1ZGJiMzQ5N2UwZjEwM2EwMzljZjI2ODU3IiwidHlwIjoiYXQrand0IiwiYWxnIjoiUlMyNTYifQ.eyJjbGllbnRfaWQiOiJkYi1kYXRhYmFzZS1jcmVkZW50aWFsIiwic2NvcGUiOiJpYW0uY3VycmVudC11c2VyOnJlYWQgaWFtLmdyb3VwczpyZWFkIGlhbS5zZXJ2aWNlLXByaW5jaXBhbHM6cmVhZCBpYW0udXNlcnM6cmVhZCIsImlzcyI6Imh0dHBzOi8vZGJjLWI4YWE3NTIwLTY0MjEuY2xvdWQuZGF0YWJyaWNrcy5jb20vb2lkYyIsImF1ZCI6IjM4OTExNzEyODAzMzI3OTciLCJzdWIiOiJtYWRoeWFtLmRodW1lQGdtYWlsLmNvbSIsImlhdCI6MTc3OTc2NzcwNywiZXhwIjoxNzc5NzcxMzA3LCJqdGkiOiI2NDg2Zjk4Ny02ZDMxLTRiZjItYjY5NC01OTllNTVhZDM2ZWEifQ.xi4vKEO4vOhXk0TX9kcAL1oyMow6W2-Qk3dOhz0VBE96yIA4qv4ARvsH0V4CUa5tbBDXhhsIHspLNgkQs2AWOzAiwhX1zA-SaN5F7pX21dCdb_511Gg7ZEKzGHSCTKvMvOKI6Lr5HjebIhWLtpEhmFtjIcK6SFb2Ob5R6tkX3G0JC-rebXAvR8ALOGE7qj2d-sav_TueW2em629dNMUV-eqn5agufSOs5LWWrOvu7Pr1wIlsPchpb5GHQPYKSHxBBZ6fehZ12cxisijJmy1lPQpL_HQ9TzK-7Gmqke-53MC7wDHmK38KTB3tg2J7AqfkB-_5UhIAamWdwCVsypJL0Q"
USER = "madhyam.dhume@gmail.com"
DBNAME = "databricks_postgres"

# Read schema SQL
with open("C:\\Users\\madhy\\claude-projects\\deploy-schema.sql", "r") as f:
    schema_sql = f.read()

try:
    # Connect to Lakebase
    conn = psycopg.connect(
        host=HOST,
        user=USER,
        password=TOKEN,
        dbname=DBNAME,
        sslmode="require"
    )
    conn.autocommit = True

    with conn.cursor() as cur:
        # Execute schema deployment
        cur.execute(schema_sql)

        # Verify tables were created
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'uc_governance'
            ORDER BY table_name
        """)

        tables = cur.fetchall()
        print("[OK] Schema deployed successfully!")
        print("\nCreated tables:")
        for (table,) in tables:
            print(f"  - uc_governance.{table}")

        # Verify indexes
        cur.execute("""
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'uc_governance'
            ORDER BY indexname
        """)

        indexes = cur.fetchall()
        print("\nCreated indexes:")
        for (index,) in indexes:
            print(f"  - {index}")

    conn.close()
    sys.exit(0)

except Exception as e:
    print(f"[ERROR] Error deploying schema: {e}", file=sys.stderr)
    sys.exit(1)
