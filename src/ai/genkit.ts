
import {genkit, type GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins: GenkitPlugin[] = [];

// This configuration conditionally initializes the Google AI plugin.
// The server will start even if the API key is missing, but AI features will be disabled.
if (process.env.GOOGLE_API_KEY) {
  plugins.push(
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    })
  );
} else {
  // Log a clear warning to the server console if the key is not found.
  // This helps with debugging during development.
  console.warn(`
********************************************************************************
*                                                                              *
*                              GENKIT AI WARNING                               *
*                                                                              *
*      GOOGLE_API_KEY is not set in your environment variables.                *
*      The Google AI plugin has not been initialized.                          *
*      AI-powered features will not work until the key is provided.            *
*                                                                              *
*      Please create a '.env.local' file in the project root and add:          *
*      GOOGLE_API_KEY=YOUR_API_KEY_HERE                                        *
*                                                                              *
*      Then, restart the development server.                                   *
*                                                                              *
********************************************************************************
  `);
}


export const ai = genkit({
   plugins: plugins,
   logLevel: 'debug',
   enableTracing: true,
});
