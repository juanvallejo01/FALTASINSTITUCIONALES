import { defineConfig } from "vitest/config";

// Config separada para pruebas de integración: requieren el servidor de
// desarrollo corriendo (`npm run dev`) y el seed aplicado (`npm run seed`).
// Se ejecutan con `npm run test:integration`, nunca como parte de `npm test`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 15000,
  },
});
