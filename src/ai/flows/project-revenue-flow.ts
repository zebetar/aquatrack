
'use server';

/**
 * @fileOverview A mock flow to project future revenue based on historical data and simulated factors.
 * This function simulates an AI projection without making any external API calls.
 * - projectRevenue - A function that projects next month's revenue.
 */

import type { ProjectRevenueInput, ProjectedRevenueOutput } from '@/types';

export async function projectRevenue(input: ProjectRevenueInput): Promise<ProjectedRevenueOutput> {
  // Simulate network delay to mimic a real API call
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const { lastMonthRevenue, currentMonthRevenue, currentDate } = input;
  const date = new Date(currentDate);
  const month = date.getMonth(); // 0 = January, 11 = December

  // Use last month's revenue as a baseline, or current month's if last month is zero.
  const baseline = lastMonthRevenue > 0 ? lastMonthRevenue : currentMonthRevenue;
  
  let projectedAmount = baseline;
  let reasoning = "Based on a trend analysis of recent performance.";
  
  // Simulate seasonality for Lodhran, Pakistan
  // Summer: April (3) to September (8) - High demand
  if (month >= 3 && month <= 8) {
      projectedAmount *= 1.15; // 15% increase for summer
      reasoning = "Projection increased due to high demand expected during the hot summer season in Lodhran.";
  }
  // Winter: November (10) to February (1) - Low demand
  else if (month >= 10 || month <= 1) {
      projectedAmount *= 0.85; // 15% decrease for winter
      reasoning = "Projection decreased reflecting lower water demand during the winter months in Lodhran.";
  }
  // Shoulder months (March, October) are considered transitional.
  // We can add a small modifier for harvest seasons (e.g., April/October)
  if (month === 3 || month === 9) { // April or October
      projectedAmount *= 0.95; // 5% decrease for harvesting
      reasoning += " Also adjusted for a potential dip during harvesting season."
  }
  
  // Add a small random factor to make it feel less static
  const randomFactor = 1 + (Math.random() - 0.5) * 0.1; // +/- 5% variance
  projectedAmount *= randomFactor;

  // Ensure projection is not negative
  if (projectedAmount < 0) {
      projectedAmount = 0;
  }
  
  return {
    projectedAmount: Math.round(projectedAmount),
    reasoning: reasoning.trim(),
  };
}
