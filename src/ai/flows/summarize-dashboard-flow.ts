'use server';

/**
 * @fileOverview A mock AI agent for generating dashboard summaries.
 * This file provides a placeholder implementation that returns a hardcoded summary
 * to allow UI development and testing without needing a valid AI API key with billing.
 *
 * - summarizeDashboardMetrics - A function that simulates generating a dashboard summary.
 * - DashboardMetricsSummary - The return type for the summary.
 */
import { z } from 'zod';

// This schema defines the expected output structure for the summary.
// It is kept here to ensure the mock data matches what the UI expects.
const DashboardMetricsSummarySchema = z.object({
  keyTakeaways: z.array(z.string()).describe("List of 2-3 key bullet points from the metrics."),
  improvementSuggestions: z.array(z.string()).describe("List of 2-3 actionable suggestions for improvement."),
  overallStatus: z.enum(['positive', 'negative', 'neutral']).describe("Overall sentiment of the current dashboard status."),
});

export type DashboardMetricsSummary = z.infer<typeof DashboardMetricsSummarySchema>;

// This is the exported function that the dashboard page calls.
// It's async to mimic a real network request.
export async function summarizeDashboardMetrics(
  metrics: any // We don't use the metrics for the mock, so type is 'any'
): Promise<DashboardMetricsSummary> {
  // Simulate a network delay to make the loading state visible in the UI.
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Return a hardcoded, realistic-looking summary.
  // This data can be easily customized for different testing scenarios.
  return {
    overallStatus: 'neutral',
    keyTakeaways: [
      "Customer growth appears steady, indicating a stable user base.",
      "Monthly supply and revenue metrics show consistent operational activity.",
      "A number of customers have outstanding bills, which could impact cash flow."
    ],
    improvementSuggestions: [
      "Consider implementing automated payment reminders to reduce outstanding balances.",
      "Analyze usage patterns of top consumers to explore opportunities for premium service tiers.",
      "Engage with new customers to gather feedback and improve retention."
    ],
  };
}
