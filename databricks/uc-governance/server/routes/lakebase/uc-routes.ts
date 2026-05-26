// UC Governance Tool Routes
// Provides endpoints for UC object discovery, creation, and management

import { z } from 'zod';
import { Application } from 'express';

interface AppKitWithLakebase {
  lakebase: {
    query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  };
  server: {
    extend(fn: (app: Application) => void): void;
  };
}

const SCHEMA_EXISTS_SQL = `
  SELECT 1 FROM information_schema.schemata
  WHERE schema_name = 'uc_governance'
`;

export async function setupUCGovernanceRoutes(appkit: AppKitWithLakebase) {
  try {
    const { rows } = await appkit.lakebase.query(SCHEMA_EXISTS_SQL);
    if (rows.length > 0) {
      console.log('[uc_governance] Schema uc_governance exists, ready to use');
    } else {
      console.warn('[uc_governance] Schema uc_governance not found');
    }
  } catch (err) {
    console.warn('[uc_governance] Database check failed:', (err as Error).message);
  }

  // Define schemas for request validation
  const CreateObjectBody = z.object({
    objectType: z.string(),
    displayName: z.string().min(1),
    fullPath: z.string().min(1),
    config: z.record(z.unknown()),
  });

  type CreateObjectRequest = z.infer<typeof CreateObjectBody>;

  appkit.server.extend((app) => {
    // GET /api/uc/objects - List all UC objects
    app.get('/api/uc/objects', async (_req, res) => {
      try {
        const result = await appkit.lakebase.query(
          `SELECT
            object_id, object_type, full_path, display_name, status,
            created_by, created_at, pr_url, commit_hash
           FROM uc_governance.uc_objects
           ORDER BY created_at DESC`,
        );
        res.json(result.rows);
      } catch (err) {
        console.error('Failed to list UC objects:', err);
        res.status(500).json({ error: 'Failed to list UC objects' });
      }
    });

    // GET /api/uc/objects/:objectId - Get specific UC object
    app.get('/api/uc/objects/:objectId', async (req, res) => {
      try {
        const objectId = req.params.objectId;
        const result = await appkit.lakebase.query(
          'SELECT * FROM uc_governance.uc_objects WHERE object_id = $1',
          [objectId],
        );
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Object not found' });
          return;
        }
        res.json(result.rows[0]);
      } catch (err) {
        console.error('Failed to get UC object:', err);
        res.status(500).json({ error: 'Failed to get UC object' });
      }
    });

    // POST /api/uc/objects - Create new UC object
    app.post('/api/uc/objects', async (req, res) => {
      try {
        const parsed = CreateObjectBody.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: 'Invalid request body' });
          return;
        }

        const { objectType, displayName, fullPath, config } = parsed.data;
        const objectId = `${objectType.toLowerCase()}-${Date.now()}`;

        const result = await appkit.lakebase.query(
          `INSERT INTO uc_governance.uc_objects
           (object_id, object_type, full_path, display_name, config_json, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING object_id, object_type, full_path, display_name, status, created_at`,
          [
            objectId,
            objectType,
            fullPath,
            displayName,
            JSON.stringify(config),
            'DRAFT',
            'system',
          ],
        );

        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error('Failed to create UC object:', err);
        res.status(500).json({ error: 'Failed to create UC object' });
      }
    });

    // GET /api/uc/audit-trail - Get audit trail
    app.get('/api/uc/audit-trail', async (_req, res) => {
      try {
        const result = await appkit.lakebase.query(
          `SELECT audit_id, user_email, action, object_id, object_type, timestamp
           FROM uc_governance.uc_audit_trail
           ORDER BY timestamp DESC
           LIMIT 100`,
        );
        res.json(result.rows);
      } catch (err) {
        console.error('Failed to get audit trail:', err);
        res.status(500).json({ error: 'Failed to get audit trail' });
      }
    });

    // GET /api/uc/execution-history - Get execution history
    app.get('/api/uc/execution-history', async (_req, res) => {
      try {
        const result = await appkit.lakebase.query(
          `SELECT execution_id, object_id, pr_url, status, executed_at, error_message
           FROM uc_governance.uc_execution_history
           ORDER BY executed_at DESC
           LIMIT 50`,
        );
        res.json(result.rows);
      } catch (err) {
        console.error('Failed to get execution history:', err);
        res.status(500).json({ error: 'Failed to get execution history' });
      }
    });

    // POST /api/uc/objects/:objectId/submit-pr - Submit PR for object
    app.post('/api/uc/objects/:objectId/submit-pr', async (req, res) => {
      try {
        const objectId = req.params.objectId;

        // Update object status to PENDING
        const result = await appkit.lakebase.query(
          `UPDATE uc_governance.uc_objects
           SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE object_id = $2
           RETURNING object_id, status, pr_url`,
          ['PENDING', objectId],
        );

        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Object not found' });
          return;
        }

        res.json(result.rows[0]);
      } catch (err) {
        console.error('Failed to submit PR:', err);
        res.status(500).json({ error: 'Failed to submit PR' });
      }
    });
  });
}
