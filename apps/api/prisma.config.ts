import { defineConfig } from 'prisma/config';

export default defineConfig({
  seed: {
    run: 'ts-node -P tsconfig.seed.json prisma/seed.ts',
  },
});
