import { defineConfig } from "vitest/config";

// Diese Datei konfiguriert die Testumgebung für das Frontend.
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
  },
});
