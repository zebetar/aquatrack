// Genkit initialization has been commented out to prevent potential server start-up issues.
// To re-enable Genkit, uncomment the code below and ensure you have valid API keys
// configured for your environment.

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
   plugins: [
    googleAI({
      // To use this, set the GOOGLE_API_KEY environment variable.
    }),
  ],
  logLevel: 'debug',
  enableTracing: true,
});