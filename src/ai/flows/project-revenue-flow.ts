
'use server';

/**
 * @fileOverview A flow to project future revenue based on historical data and live weather forecasts.
 * - projectRevenue - A function that projects next month's revenue.
 */
import type { ProjectRevenueInput, ProjectedRevenueOutput } from '@/types';

// Lodhran, Pakistan coordinates
const LATITUDE = 29.5383;
const LONGITUDE = 71.6333;
const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&daily=temperature_2m_max,precipitation_sum&forecast_days=14&timezone=auto`;

interface WeatherData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    precipitation_sum: number[];
  };
}

async function getLiveWeatherForecast(): Promise<WeatherData | null> {
  try {
    const response = await fetch(WEATHER_API_URL, { cache: 'no-store' }); // Use no-store to get fresh data
    if (!response.ok) {
      console.error(`Weather API error: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data as WeatherData;
  } catch (error) {
    console.error("Failed to fetch weather forecast:", error);
    return null;
  }
}

export async function projectRevenue(input: ProjectRevenueInput): Promise<ProjectedRevenueOutput> {
  const { lastMonthRevenue, currentMonthRevenue } = input;

  const baseline = lastMonthRevenue > 0 ? lastMonthRevenue : currentMonthRevenue;
  let projectedAmount = baseline;
  
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  let finalReasoning = "";

  // 1. Analyze Weather Data from API
  const weatherData = await getLiveWeatherForecast();
  let weatherModifier = 1.0;

  if (weatherData && weatherData.daily) {
    const avgTemp = weatherData.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / weatherData.daily.temperature_2m_max.length;
    const totalPrecipitation = weatherData.daily.precipitation_sum.reduce((a, b) => a + b, 0);

    const isHot = avgTemp > 35; // Very hot for Lodhran
    const isWarm = avgTemp > 25 && avgTemp <= 35;
    const isCool = avgTemp < 15;
    
    // Temperature factors
    if (isHot) {
      weatherModifier *= 1.25; 
      positiveFactors.push("a forecast of very hot weather");
    } else if (isWarm) {
      weatherModifier *= 1.10;
      positiveFactors.push("a forecast of warm weather");
    }

    if (isCool) {
      weatherModifier *= 0.90;
      negativeFactors.push("a forecast of cool weather");
    }
    
    // Precipitation factors - make them more explicit
    if (totalPrecipitation > 20) {
      weatherModifier *= 0.80; // Strong decrease for significant rain
      negativeFactors.push("an expectation of significant rainfall");
    } else if (totalPrecipitation > 5) {
      weatherModifier *= 0.95; // Minor decrease for some rain
      negativeFactors.push("a forecast for some light rain");
    } else {
      // If there's no significant rain, and it's hot, it's a positive factor.
      if (isHot || isWarm) {
        weatherModifier *= 1.05; // Minor increase for dry and hot conditions
        positiveFactors.push("continued dry conditions");
      }
    }
    
  } else {
     // Fallback to seasonality if API fails
     const date = new Date(input.currentDate);
     const month = date.getMonth(); // 0 = January
     
     // Summer months in Lodhran: April (3) to September (8)
     if (month >= 3 && month <= 8) {
        weatherModifier *= 1.15;
        positiveFactors.push("typical hot summer conditions");
     }
     // Winter months: November (10) to February (1)
     if (month >= 10 || month <= 1) {
        weatherModifier *= 0.85;
        negativeFactors.push("typical cool winter conditions");
     }
  }

  // 2. Analyze Seasonality (specifically harvesting)
  const date = new Date(input.currentDate);
  const month = date.getMonth(); // April or October for Wheat/Cotton
  const isHarvestSeason = month === 3 || month === 9;
  if(isHarvestSeason) {
    weatherModifier *= 0.95; // 5% decrease for harvesting
    negativeFactors.push("the ongoing harvest season");
  }

  // Apply the modifier
  projectedAmount *= weatherModifier;
  
  // Add a small random factor to make it feel less static
  const randomFactor = 1 + (Math.random() - 0.5) * 0.05; // +/- 2.5% variance
  projectedAmount *= randomFactor;

  // Construct final reasoning string with percentage and clearer details
  const percentageChange = baseline > 0 ? ((projectedAmount - baseline) / baseline) * 100 : (projectedAmount > 0 ? 100 : 0);
  const roundedPercentage = Math.round(Math.abs(percentageChange));
  
  const isIncrease = percentageChange > 2;
  const isDecrease = percentageChange < -2;

  let reasoningIntro = "";
  if (isIncrease) {
    reasoningIntro = `Revenue is projected to increase by approximately ${roundedPercentage}%. `;
  } else if (isDecrease) {
    reasoningIntro = `Revenue is projected to decrease by approximately ${roundedPercentage}%. `;
  } else {
    reasoningIntro = "Revenue is expected to remain stable this month. ";
  }

  const allFactors = [...positiveFactors, ...negativeFactors];
  if (allFactors.length > 0) {
    finalReasoning = reasoningIntro + `This forecast is influenced by factors including: ${allFactors.join(', ')}.`;
  } else {
    finalReasoning = reasoningIntro + "This forecast is based on historical performance as no significant external factors were detected.";
  }

  // Ensure projection is not negative
  if (projectedAmount < 0) {
    projectedAmount = 0;
  }
  
  return {
    projectedAmount: Math.round(projectedAmount),
    reasoning: finalReasoning.trim(),
  };
}
