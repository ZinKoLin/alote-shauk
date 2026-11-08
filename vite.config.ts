import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vercel from "./vercel.json" with { type: "json" };

export default defineConfig({
  plugins: [react()],
  preview: {
    headers: Object.fromEntries(
      vercel.headers[0].headers.map(({ key, value }) => [key, value]),
    ),
  },
});
