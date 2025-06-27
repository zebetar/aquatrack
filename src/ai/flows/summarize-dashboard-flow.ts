
'use server';
/**
 * @fileOverview An AI flow to generate a summary of admin dashboard metrics.
 *
 * - summarizeDashboard - A function that generates an insightful summary from key metrics.
 * - DashboardMetrics - The type for the input metrics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for the dashboard metrics. This is not exported to avoid "use server" errors.
const DashboardMetricsSchema = z.object({
  totalCustomers: z.number().describe('The total number of customers.'),
  monthlySupply: z.string().describe('The total water supplied this month (e.g., "150 hrs 30 min").'),
  monthlyRevenue: z.number().describe('The total revenue generated this month (in PKR).'),
  outstandingBillsValue: z.number().describe('The total value of all outstanding bills (in PKR).'),
});
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;

// The prompt for the AI model
const summaryPrompt = ai.definePrompt({
  name: 'summarizeDashboardPrompt',
  input: { schema: DashboardMetricsSchema },
  output: { schema: z.string() },

  // Instructions for the AI model
  prompt: `You are an expert financial analyst and operations manager for a water supply company.
  Your task is to provide a brief, insightful summary of the current month's performance based on the following metrics.

  Current Metrics:
  - Total Customers: {{totalCustomers}}
  - Water Supplied This Month: {{monthlySupply}}
  - Revenue This Month: PKR {{monthlyRevenue}}
  - Total Outstanding Bills: PKR {{outstandingBillsValue}}

  Your summary should be:
  1.  **Concise**: Maximum 2-3 sentences.
  2.  **Insightful**: Go beyond just repeating the numbers. Mention the relationship between metrics if interesting (e.g., high supply but low revenue might indicate pricing issues).
  3.  **Action-Oriented**: Suggest a potential area of focus. For example, if outstanding bills are high, suggest focusing on collections. If revenue is strong, suggest reinvestment.
  4.  **Tone**: Professional, encouraging, and slightly futuristic.

  Example Output:
  "This month shows strong operational output with {{monthlySupply}} supplied. With revenue at PKR {{monthlyRevenue}}, consider strategies to address the PKR {{outstandingBillsValue}} in outstanding payments to maximize cash flow."
  `,
  
  // Model configuration
  model: 'gemini-pro',
  config: {
    temperature: 0.7, // A little creativity
  },
});

/**
 * Generates a summary for the admin dashboard based on provided metrics.
 * @param metrics - The dashboard metrics.
 * @returns A string containing the AI-generated summary.
 */
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
    try {
        const summary = await summarizeDashboardFlow(metrics);
        return summary;
    } catch (e: any) {
        console.error("Genkit Error in summarizeDashboard:", e);
        
        if (e.message.includes('API key')) {
            throw new Error("The AI feature requires a valid API key. Please configure it in Admin Settings.");
        }
        if (e.message.includes('NOT_FOUND') || e.message.includes('model')) {
             throw new Error("The specified AI model was not found. This might be a region or project configuration issue in your Google Cloud account.");
        }
        
        throw new Error("An unexpected error occurred while generating the summary.");
    }
}
