import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Badge,
} from '@databricks/appkit-ui/react';
import { useState, useEffect } from 'react';
import { Trash2, Git } from 'lucide-react';

interface UCObject {
  object_id: string;
  object_type: string;
  full_path: string;
  display_name: string;
  status: 'DRAFT' | 'PENDING' | 'EXECUTED' | 'FAILED';
  created_by: string;
  created_at: string;
  pr_url: string | null;
}

const objectTypes = [
  'CATALOG',
  'SCHEMA',
  'TABLE',
  'EXTERNAL_LOCATION',
  'CREDENTIAL',
  'VOLUME',
  'MODEL',
  'DELTA_SHARE',
];

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-blue-100 text-blue-800',
  EXECUTED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export function UCObjectsPage() {
  const [objects, setObjects] = useState<UCObject[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [objectType, setObjectType] = useState('CATALOG');
  const [fullPath, setFullPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/uc/objects')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch UC objects: ${res.statusText}`);
        return res.json() as Promise<UCObject[]>;
      })
      .then(setObjects)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load objects'))
      .finally(() => setLoading(false));
  }, []);

  const createObject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !fullPath.trim()) {
      setError('Name and path are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/uc/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectType,
          displayName: displayName.trim(),
          fullPath: fullPath.trim(),
          config: { type: objectType },
        }),
      });
      if (!res.ok) throw new Error(`Failed to create object: ${res.statusText}`);
      const created = (await res.json()) as UCObject;
      setObjects((prev) => [created, ...prev]);
      setDisplayName('');
      setFullPath('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create object');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPR = async (objectId: string) => {
    try {
      const res = await fetch(`/api/uc/objects/${objectId}/submit-pr`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`Failed to submit PR: ${res.statusText}`);
      const updated = (await res.json()) as UCObject;
      setObjects((prev) => prev.map((obj) => (obj.object_id === objectId ? updated : obj)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit PR');
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Create UC Object</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Create new Unity Catalog objects with GitOps workflow integration.
          </p>

          <form onSubmit={createObject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Object Type</label>
                <Select value={objectType} onValueChange={setObjectType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {objectTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input
                  placeholder="e.g., my_catalog"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Path</label>
              <Input
                placeholder="e.g., catalog.schema.table"
                value={fullPath}
                onChange={(e) => setFullPath(e.target.value)}
                disabled={submitting}
              />
            </div>

            <Button type="submit" disabled={submitting || !displayName.trim() || !fullPath.trim()}>
              {submitting ? 'Creating...' : 'Create Object'}
            </Button>
          </form>

          {error && (
            <div className="text-destructive bg-destructive/10 p-3 rounded-md mt-4">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>UC Objects ({objects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={`skeleton-${i}`} className="h-20 rounded" />
              ))}
            </div>
          )}

          {!loading && objects.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No UC objects yet. Create one above to get started.
            </p>
          )}

          {!loading && objects.length > 0 && (
            <div className="space-y-3">
              {objects.map((obj) => (
                <div
                  key={obj.object_id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{obj.display_name}</span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${statusColors[obj.status] || 'bg-gray-100'}`}
                      >
                        {obj.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{obj.object_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{obj.full_path}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created by {obj.created_by} on {new Date(obj.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {obj.status === 'DRAFT' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => submitPR(obj.object_id)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Git className="h-4 w-4 mr-1" />
                        Submit PR
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
