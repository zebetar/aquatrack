
'use server';
/**
 * @fileOverview An AI flow to summarize dashboard metrics.
 *
 * - summarizeDashboard - A function that generates a natural language summary of dashboard data.
 * - DashboardMetricsSchema - The input type for the summarizeDashboard function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DashboardMetricsSchema, type DashboardMetrics } from '@/types';

const summaryPrompt = ai.definePrompt({
    name: 'summarizeDashboardPrompt',
    model: 'googleai/gemini-1.5-flash',
    input: { schema: DashboardMetricsSchema },
    output: { schema: z.string() },
    prompt: `You are a helpful business analyst for a water supply company called AquaTrack. 
    Given the following key metrics for the current month, provide a brief, insightful summary in 2-3 sentences.
    Highlight any notable changes or areas that need attention. Be concise and professional.
    Keep the language clear and direct.

    Metrics:
    - Total Customers: {{{totalCustomers}}}
    - Monthly Supply: {{{monthlySupply}}} hours (a {{supplyChange}}% change from last month)
    - Monthly Revenue: PKR {{{monthlyRevenue}}} (a {{revenueChange}}% change from last month)
    - Total Outstanding Bills: PKR {{{outstandingBillsValue}}}
    `,
});

const summarizeDashboardFlow = ai.defineFlow(
  {
    name: 'summarizeDashboardFlow',
    inputSchema: DashboardMetricsSchema,
    outputSchema: z.string(),
  },
  async (metrics) => {
    const { output } = await summaryPrompt(metrics);
    return output || 'No summary could be generated at this time.';
  }
);


export async function summarizeDashboard(metrics: DashboardMetrics): Promise<string> {
    return summarizeDashboardFlow(metrics);
}
