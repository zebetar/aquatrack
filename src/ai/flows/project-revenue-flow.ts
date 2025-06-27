
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

    const isHot = avgTemp > 35;
    const isWarm = avgTemp > 25 && avgTemp <= 35;
    const isCool = avgTemp < 15;
    const isRainy = totalPrecipitation > 20;

    if (isHot) {
      weatherModifier *= 1.25; // Strong increase for very hot weather
      positiveFactors.push("a forecast of very high temperatures");
    } else if (isWarm) {
      weatherModifier *= 1.10; // Moderate increase for warm weather
      positiveFactors.push("a forecast of warm weather");
    }

    if (isCool) {
      weatherModifier *= 0.90; // Decrease for cool weather
      negativeFactors.push("a forecast of cool weather");
    }
    
    if (isRainy) {
      weatherModifier *= 0.80; // Strong decrease for significant rain
      negativeFactors.push("an expectation of significant rainfall");
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

  // Construct final reasoning string
  const isIncrease = projectedAmount > baseline * 1.02; // Use a small threshold to avoid "increase" for tiny changes
  const isDecrease = projectedAmount < baseline * 0.98; // Use a small threshold
  
  if (isIncrease) {
    finalReasoning = "Revenue is projected to increase this month. ";
    if (positiveFactors.length > 0) {
      finalReasoning += `This is primarily due to ${positiveFactors.join(' and ')}. `;
    }
    if (negativeFactors.length > 0) {
      finalReasoning += `However, this growth is tempered by ${negativeFactors.join(' and ')}.`;
    }
  } else if (isDecrease) {
    finalReasoning = "Revenue is projected to decrease this month. ";
    if (negativeFactors.length > 0) {
      finalReasoning += `This is primarily due to ${negativeFactors.join(' and ')}. `;
    }
    if (positiveFactors.length > 0) {
      finalReasoning += `This decrease is partially offset by ${positiveFactors.join(' and ')}.`;
    }
  } else {
     finalReasoning = "Revenue is expected to remain stable, based on historical performance and a balance of current factors.";
  }

  // Fallback for empty reasoning
  if (positiveFactors.length === 0 && negativeFactors.length === 0) {
    finalReasoning = "Projection based on historical performance.";
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
