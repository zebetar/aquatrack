
'use server';

/**
 * @fileOverview An AI flow to project future revenue based on historical data and external factors.
 * - projectRevenue - A function that projects next month's revenue.
 * - ProjectRevenueInput - The input type for the projectRevenue function.
 * - ProjectedRevenueOutput - The return type for the projectRevenue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const ProjectRevenueInputSchema = z.object({
  lastMonthRevenue: z.number().describe("The total revenue from the previous month."),
  currentMonthRevenue: z.number().describe("The total revenue so far in the current month."),
  currentDate: z.string().describe("The current date in ISO 8601 format."),
});
export type ProjectRevenueInput = z.infer<typeof ProjectRevenueInputSchema>;

export const ProjectedRevenueOutputSchema = z.object({
  projectedAmount: z.number().describe("The forecasted revenue amount for the next month."),
  reasoning: z.string().describe("A brief (1-2 sentences) explanation of the key factors that influenced the projection, such as seasonality or weather."),
});
export type ProjectedRevenueOutput = z.infer<typeof ProjectedRevenueOutputSchema>;


const projectRevenuePrompt = ai.definePrompt({
  name: 'projectRevenuePrompt',
  input: {schema: ProjectRevenueInputSchema},
  output: {schema: ProjectedRevenueOutputSchema},
  prompt: `You are a financial analyst for an agricultural water supply company in Lodhran, Pakistan.
  Your task is to forecast the next month's revenue.

  Current Date: {{{currentDate}}}

  Historical Data:
  - Last Month's Revenue: PKR {{{lastMonthRevenue}}}
  - Current Month's Revenue so far: PKR {{{currentMonthRevenue}}}

  Consider the following factors for your projection:
  1.  **Seasonality:** Water demand is highest in the hot summer months (April-September) and lowest in the winter (November-February). Harvesting seasons also affect demand.
  2.  **Weather Patterns:** Base your forecast on typical weather for the upcoming month in Lodhran, Pakistan. Assume that periods of heavy rain will decrease water sales, while dry, hot spells will increase them.
  3.  **Historical Performance:** Use the provided revenue figures as a baseline for growth or decline.

  Provide a projected revenue amount and a concise justification for your forecast based on these factors.
  `,
});

const projectRevenueFlow = ai.defineFlow(
  {
    name: 'projectRevenueFlow',
    inputSchema: ProjectRevenueInputSchema,
    outputSchema: ProjectedRevenueOutputSchema,
  },
  async (input) => {
    const {output} = await projectRevenuePrompt(input);
    return output!;
  }
);

export async function projectRevenue(input: ProjectRevenueInput): Promise<ProjectedRevenueOutput> {
  return projectRevenueFlow(input);
}
