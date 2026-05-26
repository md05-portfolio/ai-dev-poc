import { createApp, analytics, lakebase, server } from '@databricks/appkit';
import { setupUCGovernanceRoutes } from './routes/lakebase/uc-routes';

createApp({
  plugins: [
    analytics(),
    lakebase(),
    server(),
  ],
  async onPluginsReady(appkit) {
    await setupUCGovernanceRoutes(appkit);
  },
}).catch(console.error);
