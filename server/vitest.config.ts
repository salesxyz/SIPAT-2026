import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://sipat:sipat@localhost:54329/sipat_test",
      JWT_SECRET: "segredo-de-teste-com-mais-de-16-chars",
      STORAGE_DRIVER: "local",
      LOCAL_STORAGE_DIR: "/tmp/sipat-test-storage",
      MAX_UPLOAD_MB: "1",
      MAX_FILES_PER_REQUEST: "3",
      ADMIN_EMAIL: "admin@teste.com",
      ADMIN_PASSWORD: "SenhaForte123",
      PUBLIC_URL: "https://sipat.teste",
    },
  },
});
