
'use server';

import { genkit, Plugin, GenkitOptions } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const googleAIVision = googleAI({
  apiVersion: 'v1beta',
});

const plugins: Plugin[] = [googleAIVision];

const genkitOptions: GenkitOptions = {
  plugins,
  flowStateStore: 'firebase',
  traceStore: 'firebase',
  enableTracingAndMetrics: true,
};

// Initialize genkit and export the instance
export const ai = genkit(genkitOptions);
