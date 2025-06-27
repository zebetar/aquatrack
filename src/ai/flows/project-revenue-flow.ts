
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

  // Fetch live weather data
  const weatherData = await getLiveWeatherForecast();

  const baseline = lastMonthRevenue > 0 ? lastMonthRevenue : currentMonthRevenue;
  let projectedAmount = baseline;
  const reasoningParts: string[] = [];

  // 1. Analyze Weather Data
  let weatherModifier = 1.0;
  if (weatherData && weatherData.daily) {
    const avgTemp = weatherData.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / weatherData.daily.temperature_2m_max.length;
    const totalPrecipitation = weatherData.daily.precipitation_sum.reduce((a, b) => a + b, 0);

    const isHot = avgTemp > 35;
    const isDry = totalPrecipitation < 5; // Less than 5mm rain over 14 days is very dry
    const isRainy = totalPrecipitation > 20;

    if (isHot && isDry) {
      weatherModifier *= 1.20; // 20% increase for hot and dry
      reasoningParts.push("hot and dry weather forecast");
    } else if (isHot) {
      weatherModifier *= 1.10; // 10% increase just for heat
      reasoningParts.push("high temperatures");
    }

    if (isRainy) {
      weatherModifier *= 0.80; // 20% decrease for significant rain
      reasoningParts.push("expected rainfall");
    }
  } else {
    reasoningParts.push("could not fetch live weather, using seasonal estimate");
  }
  
  projectedAmount *= weatherModifier;
  
  // 2. Analyze Seasonality (as a fallback or supplement)
  const date = new Date(input.currentDate);
  const month = date.getMonth(); // 0 = January
  const isHarvestSeason = month === 3 || month === 9; // April or October
  if(isHarvestSeason) {
    projectedAmount *= 0.95; // 5% decrease for harvesting
    reasoningParts.push("harvest season adjustment");
  }

  // Add a small random factor to make it feel less static
  const randomFactor = 1 + (Math.random() - 0.5) * 0.05; // +/- 2.5% variance
  projectedAmount *= randomFactor;

  // Construct final reasoning string
  let finalReasoning = "Projection based on ";
  if (reasoningParts.length > 0) {
    finalReasoning += reasoningParts.join(', ') + ".";
  } else {
    finalReasoning = "Projection based on historical performance.";
  }

  // Ensure projection is not negative
  if (projectedAmount < 0) {
    projectedAmount = 0;
  }
  
  return {
    projectedAmount: Math.round(projectedAmount),
    reasoning: finalReasoning,
  };
}
