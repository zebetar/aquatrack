
'use server';

import { ai } from '@/lib/genkit';
import {
  ProjectRevenueInputSchema,
  ProjectRevenueInput,
  ProjectedRevenueOutputSchema,
  ProjectedRevenueOutput,
} from '@/types';

const revenueProjectionPrompt = ai.definePrompt({
  name: 'revenueProjectionPrompt',
  input: { schema: ProjectRevenueInputSchema },
  output: { schema: ProjectedRevenueOutputSchema },
  prompt: `
    You are a financial analyst for a water supply company.
    Your task is to project the total revenue for the upcoming month.

    Analyze the provided data:
    - Previous Month's Total Revenue: {{{lastMonthRevenue}}} PKR
    - Current Month's Revenue to Date: {{{currentMonthRevenue}}} PKR
    - Current Date: {{{currentDate}}}

    Consider the following factors in your analysis:
    - **Time Progression:** Calculate the percentage of the current month that has passed.
    - **Run Rate:** Project the current month's total revenue based on the revenue generated so far.
    - **Month-over-Month Growth:** Compare the projected current month's revenue with last month's revenue to identify a growth trend.
    - **Seasonality (IMPORTANT):** Water consumption patterns change significantly with seasons. In Pakistan, consumption typically peaks in the hot summer months (May-August) and is lowest in winter (December-February). Use the current date to infer the season and adjust your projection accordingly. For example, if moving from a cold month to a warmer month, you should project an increase in revenue, and vice-versa.

    Based on your analysis, provide a projected revenue amount for the **next** month.

    Finally, provide a brief (1-2 sentences) "reasoning" for your projection, mentioning the most critical factors (e.g., seasonal trends, current run rate).
  `,
});

const internalProjectRevenueFlow = ai.defineFlow(
  {
    name: 'projectRevenueFlow',
    inputSchema: ProjectRevenueInputSchema,
    outputSchema: ProjectedRevenueOutputSchema,
  },
  async (input) => {
    const { output } = await revenueProjectionPrompt(input);
    if (!output) {
      throw new Error("Revenue projection failed to produce an output.");
    }
    return output;
  }
);

// Export a regular async function to be used as a Server Action
export async function projectRevenueFlow(input: ProjectRevenueInput): Promise<ProjectedRevenueOutput> {
  return await internalProjectRevenueFlow(input);
}
