
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

  // Analyze metrics to build a dynamic summary
  if (metrics.totalCustomers > 0) {
      keyTakeaways.push(`You are currently serving ${metrics.totalCustomers} customer(s).`);
  } else {
      keyTakeaways.push("There are no customers in the system yet.");
      improvementSuggestions.push("Add your first customer to start tracking water usage and payments.");
      score -= 1;
  }
  
  if (metrics.monthlyRevenue > 5000) {
      keyTakeaways.push(`Monthly revenue is strong at PKR ${metrics.monthlyRevenue.toLocaleString()}.`);
      score += 1;
  } else if (metrics.monthlyRevenue > 0) {
       keyTakeaways.push(`This month's revenue is PKR ${metrics.monthlyRevenue.toLocaleString()}.`);
  } else {
      keyTakeaways.push("No revenue has been generated this month.");
  }
  
  if (metrics.outstandingBillsValue > 0) {
      const numOutstanding = metrics.topOutstandingCustomers.length;
      const customerText = numOutstanding === 1 ? 'customer' : 'customers';
      keyTakeaways.push(`There is a total of PKR ${metrics.outstandingBillsValue.toLocaleString()} in outstanding bills from ${numOutstanding} ${customerText}.`);
      improvementSuggestions.push("Follow up with customers who have outstanding balances to improve cash flow.");
      score -= 1;
  } else {
      keyTakeaways.push("All customer accounts are settled with no outstanding bills.");
      score +=1;
  }
  
  if (metrics.totalCustomers > 5) {
      improvementSuggestions.push("With a growing customer base, consider analyzing usage patterns for optimization opportunities.");
  }
  
  if (metrics.topOutstandingCustomers.length > 0) {
      improvementSuggestions.push(`Prioritize collecting from top debtors like ${metrics.topOutstandingCustomers[0].name}.`);
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
