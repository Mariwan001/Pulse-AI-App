import { genkit } from 'genkit';
import { groq } from 'genkitx-groq';

export default genkit({
  plugins: [
    groq({
      apiKey: process.env.GROQ_API_KEY,
    }),
  ],
});
