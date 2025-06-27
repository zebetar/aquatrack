// Genkit initialization has been commented out to prevent potential server start-up issues.
// To re-enable Genkit, uncomment the code below and ensure you have valid API keys
// configured for your environment.

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This configuration explicitly uses the GOOGLE_API_KEY from your .env.local file.
// This is required for server-side AI features to work correctly.
export const ai = genkit({
   plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracing: true,
});
