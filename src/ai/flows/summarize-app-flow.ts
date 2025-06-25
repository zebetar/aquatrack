'use server';
/**
 * @fileOverview An AI flow to summarize a detailed application description.
 *
 * - summarizeApp - A function that takes a detailed description and returns a structured summary.
 * - SummarizeAppInput - The input type for the summarizeApp function.
 * - SummarizeAppOutput - The return type for the summarizeApp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SummarizeAppInputSchema = z.string().describe("A detailed text description of an application's features and functionalities.");
export type SummarizeAppInput = z.infer<typeof SummarizeAppInputSchema>;

export const SummarizeAppOutputSchema = z.object({
  title: z.string().describe("A short, catchy title for the application described, like 'AquaTrack'. Do not include the word 'Stitch'."),
  summary: z.string().describe("A concise one-paragraph summary of the application's main purpose and value proposition."),
  adminFeatures: z.array(z.string()).describe("A bulleted list of the most important features available to the Admin role."),
  viewerFeatures: z.array(z.string()).describe("A bulleted list of the most important features available to the Viewer (or Customer) role.")
});
export type SummarizeAppOutput = z.infer<typeof SummarizeAppOutputSchema>;

export async function summarizeApp(input: SummarizeAppInput): Promise<SummarizeAppOutput> {
  return summarizeAppFlow(input);
}

const summarizeAppPrompt = ai.definePrompt({
  name: 'summarizeAppPrompt',
  input: {schema: SummarizeAppInputSchema},
  output: {schema: SummarizeAppOutputSchema},
  prompt: `You are a product manager expert at distilling complex feature descriptions into clear, structured summaries.
Analyze the following application description and extract the key information.

Generate a catchy title for the application.
Write a single paragraph summarizing its core purpose.
List the key features for the 'Admin' role.
List the key features for the 'Viewer' or 'Customer' role.

Application Description:
{{{input}}}
`,
});

const summarizeAppFlow = ai.defineFlow(
  {
    name: 'summarizeAppFlow',
    inputSchema: SummarizeAppInputSchema,
    outputSchema: SummarizeAppOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeAppPrompt(input);
    return output!;
  }
);
