
import {genkit, type Genkit} from 'genkit';
import {googleAI} from 'genkit/googleai';

// This is a re-usable Genkit definition.
// The API key is read from the GOOGLE_API_KEY environment variable.
export const ai: Genkit = genkit({
  plugins: [
    googleAI(),
  ],
});
