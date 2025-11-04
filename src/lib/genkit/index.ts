
'use server';

import { genkit, Plugin, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const googleAIVision = googleAI({
  apiVersion: 'v1beta',
});

const plugins: Plugin[] = [googleAIVision];

if (process.env.NODE_ENV === 'development') {
  const { devLogger, genkitEval, dotprompt } = require('genkit/dev');
  plugins.push(devLogger);
  plugins.push(genkitEval);
  plugins.push(dotprompt());
}

configureGenkit({
  plugins,
  flowStateStore: 'firebase',
  traceStore: 'firebase',
  enableTracingAndMetrics: true,
});

export const ai = genkit;

    