import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// TODO: Configure tRPC middleware
// app.use(
//   '/trpc',
//   createExpressMiddleware({
//     router: appRouter,
//     createContext: () => ({}),
//   }),
// );

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export type AppRouter = typeof appRouter;
