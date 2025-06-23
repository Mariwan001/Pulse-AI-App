
import { config } from 'dotenv';
config();

import '@/ai/flows/answer-user-query.ts';
import '@/ai/flows/generate-chat-title.ts';
import '@/ai/flows/simplify-text-flow.ts';
import '@/ai/flows/extract-key-takeaways-flow.ts';
import '@/ai/flows/expand-text-flow.ts';
import '@/ai/flows/explain-with-analogy-flow.ts';

// Import tool files so Genkit is aware of them
import '@/ai/tools/get-current-time-tool.ts';
import '@/ai/tools/get-current-weather-tool.ts';
