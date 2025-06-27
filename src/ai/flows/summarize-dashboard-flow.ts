
'use server';

/**
 * @fileOverview A mock AI agent for generating dashboard summaries.
 * This file provides a placeholder implementation that returns a dynamic, data-driven summary
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
  metrics: any 
): Promise<DashboardMetricsSummary> {
  // Simulate a network delay to make the loading state visible in the UI.
  await new Promise(resolve => setTimeout(resolve, 1500));

  const keyTakeaways: string[] = [];
  const improvementSuggestions: string[] = [];
  let score = 0;

  // Analyze metrics to build a dynamic, statistical summary
  if (metrics.totalCustomers > 0) {
      keyTakeaways.push(`Active customers: ${metrics.totalCustomers}.`);
  } else {
      keyTakeaways.push("Active customers: 0.");
      improvementSuggestions.push("Action: Add first customer to begin tracking.");
      score -= 1;
  }
  
  keyTakeaways.push(`Revenue (This Month): PKR ${metrics.monthlyRevenue.toLocaleString()}.`);
  if (metrics.monthlyRevenue > 5000) {
      score += 1;
  }
  
  if (metrics.outstandingBillsValue > 0) {
      const numOutstanding = metrics.topOutstandingCustomers.length;
      keyTakeaways.push(`Outstanding Balance: PKR ${metrics.outstandingBillsValue.toLocaleString()} from ${numOutstanding} customer(s).`);
      improvementSuggestions.push(`Action: Prioritize collecting PKR ${metrics.outstandingBillsValue.toLocaleString()} in outstanding payments.`);
      score -= 1;
  } else {
      keyTakeaways.push("Outstanding Balance: PKR 0. All accounts are settled.");
      score +=1;
  }
  
  if (metrics.totalCustomers > 5) {
      improvementSuggestions.push(`Analysis: Evaluate usage patterns for ${metrics.totalCustomers} customers to identify optimization opportunities.`);
  }
  
  const topDebtor = metrics.topOutstandingCustomers[0];
  if (topDebtor) {
      improvementSuggestions.push(`Focus: Top debtor (${topDebtor.name}) owes PKR ${topDebtor.balance.toLocaleString()}.`);
  }
  
  let overallStatus: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (score > 0) {
      overallStatus = 'positive';
  } else if (score < 0) {
      overallStatus = 'negative';
  }

  // Ensure there are always some default suggestions if none are generated
  if (improvementSuggestions.length === 0) {
      improvementSuggestions.push("Review monthly reports to identify trends in water consumption.");
      improvementSuggestions.push("Ensure all customer information is up-to-date for accurate billing.");
  }


  // Return a dynamic summary based on the data.
  return {
    overallStatus,
    keyTakeaways: keyTakeaways.slice(0, 3), // Limit to 3 takeaways
    improvementSuggestions: improvementSuggestions.slice(0, 3), // Limit to 3 suggestions
  };
}
