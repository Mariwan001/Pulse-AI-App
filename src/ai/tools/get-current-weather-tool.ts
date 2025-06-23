
'use server';
/**
 * @fileOverview A Genkit tool for fetching current weather (simulated).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetCurrentWeatherInputSchema = z.object({
  location: z.string().describe('The city or area for which to get the weather (e.g., "London", "Tokyo"). This field is required.'),
});

const GetCurrentWeatherOutputSchema = z.object({
  location: z.string().describe('The location for which weather is reported.'),
  temperature: z.string().describe('The current temperature (e.g., "25°C", "77°F").'),
  condition: z.string().describe('The current weather condition (e.g., "Sunny", "Cloudy with showers").'),
  humidity: z.string().optional().describe('The current humidity percentage (e.g., "60%").'),
  wind: z.string().optional().describe('The current wind speed and direction (e.g., "10 km/h West").'),
  dataSource: z.string().describe('Indicates that the data is simulated.'),
});

export const getCurrentWeatherTool = ai.defineTool(
  {
    name: 'getCurrentWeather',
    description: 'Provides the current weather conditions for a specified location. IMPORTANT: This tool currently provides SIMULATED weather data as it is not connected to a live weather API.',
    inputSchema: GetCurrentWeatherInputSchema,
    outputSchema: GetCurrentWeatherOutputSchema,
  },
  async (input) => {
    // Simulate weather data
    const simulatedConditions = [
      { temp: "22°C (72°F)", condition: "Sunny with a light breeze", humidity: "55%", wind: "5 km/h North" },
      { temp: "15°C (59°F)", condition: "Partly cloudy", humidity: "65%", wind: "10 km/h West" },
      { temp: "28°C (82°F)", condition: "Clear skies, very warm", humidity: "40%", wind: "3 km/h East" },
      { temp: "10°C (50°F)", condition: "Overcast with a chance of rain", humidity: "75%", wind: "15 km/h South" },
    ];
    const randomCondition = simulatedConditions[Math.floor(Math.random() * simulatedConditions.length)];

    return {
      location: input.location,
      temperature: randomCondition.temp,
      condition: randomCondition.condition,
      humidity: randomCondition.humidity,
      wind: randomCondition.wind,
      dataSource: 'Simulated Weather Data - Not Real-Time',
    };
  }
);
