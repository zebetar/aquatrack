
/**
 * @fileoverview This file initializes the Genkit AI instance.
 * It configures the necessary plugins, such as Google AI, and handles
 * API key validation to ensure the server can start gracefully even if
 * the key is not provided in the environment variables.
 */

import { genkit, type GenkitPlugin } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const apiKey = process.env.GOOGLE_API_KEY;

const plugins: GenkitPlugin[] = [];

if (apiKey) {
  // Only add the Google AI plugin if the API key is available.
  plugins.push(googleAI({ apiKey }));
} else {
  // If no API key is found, log a clear warning to the server console.
  // This prevents the application from crashing on startup.
  console.warn(`
********************************************************************************
*                                                                              *
*                      GENKIT AI PLUGIN NOT INITIALIZED                        *
*                                                                              *
*      'GOOGLE_API_KEY' environment variable not found.                        *
*      The Google AI plugin has not been loaded, and AI features will be       *
*      disabled. To enable them, please create a '.env.local' file in your     *
*      project's root directory and add your key:                              *
*                                                                              *
*      GOOGLE_API_KEY=AIzaSy...                                                *
*                                                                              *
*      After adding the key, you must restart the development server.          *
*                                                                              *
********************************************************************************
  `);
}

// Configure Genkit with the available plugins.
export const ai = genkit({
  plugins,
  // Using in-memory storage for development.
  // flowStateStore and traceStore are removed as they require the Firebase plugin.
  enableTracingAndMetrics: true,
});
