import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/server';

export const trpc = createTRPCReact<AppRouter>();

// TODO: Configure tRPC query client with React Query
// export const trpcClient = trpc.createClient({
//   links: [
//     httpBatchLink({
//       url: 'http://localhost:3000/trpc',
//     }),
//   ],
// });
