import { defineConfig } from 'genkit';
import { groq } from 'genkitx-groq';

export default defineConfig({
  model: 'groq/meta-llama/llama-4-scout-17b-16e-instruct',
  plugins: [
    groq({
      apiKey: process.env.GROQ_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
