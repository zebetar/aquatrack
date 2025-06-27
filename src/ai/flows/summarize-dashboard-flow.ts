
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

  // --- Enhanced & Futuristic Analysis ---
  if (metrics.totalCustomers > 0) {
      keyTakeaways.push(`Customer Base: ${metrics.totalCustomers} active clients.`);
      if (metrics.totalCustomers < 5) {
        improvementSuggestions.push(`Onboard new clients to expand revenue streams.`);
      } else {
        improvementSuggestions.push(`Analyze usage data to predict future demand.`);
      }
  } else {
      keyTakeaways.push("System Initialized: 0 active clients.");
      improvementSuggestions.push("Add first customer to activate revenue.");
      score -= 1;
  }
  
  keyTakeaways.push(`Revenue Stream: PKR ${metrics.monthlyRevenue.toLocaleString()} this period.`);
  if (metrics.monthlyRevenue > 5000) {
      score += 1;
  } else if (metrics.monthlyRevenue === 0 && metrics.totalCustomers > 0) {
      improvementSuggestions.push("Investigate missing revenue for active customers.");
  }
  
  if (metrics.outstandingBillsValue > 0) {
      const numOutstanding = metrics.topOutstandingCustomers.length;
      keyTakeaways.push(`Outstanding Receivables: PKR ${metrics.outstandingBillsValue.toLocaleString()} across ${numOutstanding} accounts.`);
      improvementSuggestions.push(`Collect outstanding PKR ${metrics.outstandingBillsValue.toLocaleString()} to improve cash flow.`);
      score -= 1;
  } else {
      keyTakeaways.push("Financial Status: Zero outstanding balance maintained.");
      improvementSuggestions.push("Maintain zero outstanding balance by monitoring usage.");
      score +=1;
  }
  
  const topDebtor = metrics.topOutstandingCustomers[0];
  if (topDebtor) {
      improvementSuggestions.push(`Prioritize collecting from top debtor: ${topDebtor.name} (PKR ${topDebtor.balance.toLocaleString()}).`);
  }
  
  let overallStatus: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (score > 0) {
      overallStatus = 'positive';
  } else if (score < 0) {
      overallStatus = 'negative';
  }

  // Ensure there are always some default suggestions if none are generated
  if (improvementSuggestions.length === 0) {
      improvementSuggestions.push("Monitor real-time data for emerging trends.");
      improvementSuggestions.push("Ensure data integrity for accurate billing.");
  }

  // Return a dynamic summary based on the data.
  return {
    overallStatus,
    keyTakeaways: keyTakeaways.slice(0, 3), // Limit to 3 takeaways
    improvementSuggestions: improvementSuggestions.slice(0, 3), // Limit to 3 suggestions
  };
}
