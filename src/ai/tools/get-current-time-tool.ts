'use server';
/**
 * @fileOverview A tool for fetching the current time and date for any location worldwide.
 */

import {z} from 'zod';

const GetCurrentTimeInputSchema = z.object({
  location: z.string().describe('The location for which to get the current time (e.g., "Erbil", "Paris", "New York", "Tokyo"). If not provided, returns server time.'),
});

const GetCurrentTimeOutputSchema = z.object({
  currentDate: z.string().describe('The current date in a readable format.'),
  currentTime: z.string().describe('The current time as a string.'),
  timeZone: z.string().describe('The timezone of the location.'),
  location: z.string().describe('The location that was queried.'),
  timeZoneOffset: z.string().describe('The timezone offset from UTC (e.g., "+03:00", "-05:00").'),
  isDaytime: z.boolean().describe('Whether it is currently daytime at the location.'),
  note: z.string().optional().describe('Additional information about the time or location.'),
});

export type GetCurrentTimeInput = z.infer<typeof GetCurrentTimeInputSchema>;
export type GetCurrentTimeOutput = z.infer<typeof GetCurrentTimeOutputSchema>;

// Timezone mapping for common cities
const TIMEZONE_MAP: Record<string, string> = {
  // Middle East
  'erbil': 'Asia/Baghdad',
  'baghdad': 'Asia/Baghdad',
  'basra': 'Asia/Baghdad',
  'mosul': 'Asia/Baghdad',
  'sulaymaniyah': 'Asia/Baghdad',
  'kirkuk': 'Asia/Baghdad',
  'dubai': 'Asia/Dubai',
  'abudhabi': 'Asia/Dubai',
  'sharjah': 'Asia/Dubai',
  'ajman': 'Asia/Dubai',
  'riyadh': 'Asia/Riyadh',
  'jeddah': 'Asia/Riyadh',
  'mecca': 'Asia/Riyadh',
  'medina': 'Asia/Riyadh',
  'dammam': 'Asia/Riyadh',
  'doha': 'Asia/Qatar',
  'kuwait': 'Asia/Kuwait',
  'amman': 'Asia/Amman',
  'beirut': 'Asia/Beirut',
  'damascus': 'Asia/Damascus',
  'aleppo': 'Asia/Damascus',
  'istanbul': 'Europe/Istanbul',
  'ankara': 'Europe/Istanbul',
  'izmir': 'Europe/Istanbul',
  'antalya': 'Europe/Istanbul',
  'tehran': 'Asia/Tehran',
  'mashhad': 'Asia/Tehran',
  'isfahan': 'Asia/Tehran',
  'tabriz': 'Asia/Tehran',
  'yerevan': 'Asia/Yerevan',
  'baku': 'Asia/Baku',
  'tbilisi': 'Asia/Tbilisi',
  
  // Europe
  'london': 'Europe/London',
  'paris': 'Europe/Paris',
  'berlin': 'Europe/Berlin',
  'munich': 'Europe/Berlin',
  'hamburg': 'Europe/Berlin',
  'frankfurt': 'Europe/Berlin',
  'rome': 'Europe/Rome',
  'milan': 'Europe/Rome',
  'naples': 'Europe/Rome',
  'madrid': 'Europe/Madrid',
  'barcelona': 'Europe/Madrid',
  'valencia spain': 'Europe/Madrid',
  'amsterdam': 'Europe/Amsterdam',
  'rotterdam': 'Europe/Amsterdam',
  'brussels': 'Europe/Brussels',
  'antwerp': 'Europe/Brussels',
  'vienna': 'Europe/Vienna',
  'salzburg': 'Europe/Vienna',
  'prague': 'Europe/Prague',
  'brno': 'Europe/Prague',
  'warsaw': 'Europe/Warsaw',
  'krakow': 'Europe/Warsaw',
  'moscow': 'Europe/Moscow',
  'saintpetersburg': 'Europe/Moscow',
  'novosibirsk': 'Asia/Novosibirsk',
  'stockholm': 'Europe/Stockholm',
  'gothenburg': 'Europe/Stockholm',
  'oslo': 'Europe/Oslo',
  'bergen': 'Europe/Oslo',
  'copenhagen': 'Europe/Copenhagen',
  'helsinki': 'Europe/Helsinki',
  'tampere': 'Europe/Helsinki',
  'dublin': 'Europe/Dublin',
  'cork': 'Europe/Dublin',
  'glasgow': 'Europe/London',
  'edinburgh': 'Europe/London',
  'manchester': 'Europe/London',
  'birmingham': 'Europe/London',
  'leeds': 'Europe/London',
  'liverpool': 'Europe/London',
  
  // North America
  'newyork': 'America/New_York',
  'losangeles': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'houston': 'America/Chicago',
  'phoenix': 'America/Phoenix',
  'denver': 'America/Denver',
  'seattle': 'America/Los_Angeles',
  'sanfrancisco': 'America/Los_Angeles',
  'san diego': 'America/Los_Angeles',
  'sandiego': 'America/Los_Angeles',
  'boston': 'America/New_York',
  'atlanta': 'America/New_York',
  'miami': 'America/New_York',
  'orlando': 'America/New_York',
  'las vegas': 'America/Los_Angeles',
  'lasvegas': 'America/Los_Angeles',
  'dallas': 'America/Chicago',
  'fort worth': 'America/Chicago',
  'fortworth': 'America/Chicago',
  'austin': 'America/Chicago',
  'san antonio': 'America/Chicago',
  'sanantonio': 'America/Chicago',
  'toronto': 'America/Toronto',
  'vancouver': 'America/Vancouver',
  'montreal': 'America/Toronto',
  'calgary': 'America/Edmonton',
  'edmonton': 'America/Edmonton',
  'ottawa': 'America/Toronto',
  'winnipeg': 'America/Winnipeg',
  'mexicocity': 'America/Mexico_City',
  'guadalajara': 'America/Mexico_City',
  'monterrey': 'America/Mexico_City',
  
  // Asia
  'tokyo': 'Asia/Tokyo',
  'osaka': 'Asia/Tokyo',
  'kyoto': 'Asia/Tokyo',
  'yokohama': 'Asia/Tokyo',
  'nagoya': 'Asia/Tokyo',
  'sapporo': 'Asia/Tokyo',
  'seoul': 'Asia/Seoul',
  'busan': 'Asia/Seoul',
  'incheon': 'Asia/Seoul',
  'daegu': 'Asia/Seoul',
  'beijing': 'Asia/Shanghai',
  'shanghai': 'Asia/Shanghai',
  'guangzhou': 'Asia/Shanghai',
  'shenzhen': 'Asia/Shanghai',
  'tianjin': 'Asia/Shanghai',
  'chongqing': 'Asia/Shanghai',
  'chengdu': 'Asia/Shanghai',
  'xian': 'Asia/Shanghai',
  'hongkong': 'Asia/Hong_Kong',
  'singapore': 'Asia/Singapore',
  'bangkok': 'Asia/Bangkok',
  'jakarta': 'Asia/Jakarta',
  'surabaya': 'Asia/Jakarta',
  'bandung': 'Asia/Jakarta',
  'manila': 'Asia/Manila',
  'quezon': 'Asia/Manila',
  'kualalumpur': 'Asia/Kuala_Lumpur',
  'george town': 'Asia/Kuala_Lumpur',
  'georgetown': 'Asia/Kuala_Lumpur',
  'mumbai': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  'bangalore': 'Asia/Kolkata',
  'chennai': 'Asia/Kolkata',
  'kolkata': 'Asia/Kolkata',
  'hyderabad': 'Asia/Kolkata',
  'pune': 'Asia/Kolkata',
  'ahmedabad': 'Asia/Kolkata',
  'surat': 'Asia/Kolkata',
  'jaipur': 'Asia/Kolkata',
  'lucknow': 'Asia/Kolkata',
  'kanpur': 'Asia/Kolkata',
  'nagpur': 'Asia/Kolkata',
  'indore': 'Asia/Kolkata',
  'thane': 'Asia/Kolkata',
  'bhopal': 'Asia/Kolkata',
  'visakhapatnam': 'Asia/Kolkata',
  'patna': 'Asia/Kolkata',
  'vadodara': 'Asia/Kolkata',
  'ghaziabad': 'Asia/Kolkata',
  'ludhiana': 'Asia/Kolkata',
  'agra': 'Asia/Kolkata',
  'nashik': 'Asia/Kolkata',
  'faridabad': 'Asia/Kolkata',
  'meerut': 'Asia/Kolkata',
  'rajkot': 'Asia/Kolkata',
  'kalyan': 'Asia/Kolkata',
  'vasai': 'Asia/Kolkata',
  'vashi': 'Asia/Kolkata',
  'aurangabad': 'Asia/Kolkata',
  'dhanbad': 'Asia/Kolkata',
  'amritsar': 'Asia/Kolkata',
  'allahabad': 'Asia/Kolkata',
  'ranchi': 'Asia/Kolkata',
  'howrah': 'Asia/Kolkata',
  'coimbatore': 'Asia/Kolkata',
  'jabalpur': 'Asia/Kolkata',
  'gwalior': 'Asia/Kolkata',
  'vijayawada': 'Asia/Kolkata',
  'jodhpur': 'Asia/Kolkata',
  'madurai': 'Asia/Kolkata',
  'raipur': 'Asia/Kolkata',
  'kota': 'Asia/Kolkata',
  'guwahati': 'Asia/Kolkata',
  'chandigarh': 'Asia/Kolkata',
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'perth': 'Australia/Perth',
  'brisbane': 'Australia/Brisbane',
  'adelaide': 'Australia/Adelaide',
  'gold coast': 'Australia/Brisbane',
  'goldcoast': 'Australia/Brisbane',
  'newcastle': 'Australia/Sydney',
  'canberra': 'Australia/Sydney',
  'auckland': 'Pacific/Auckland',
  'wellington': 'Pacific/Auckland',
  'christchurch': 'Pacific/Auckland',
  
  // Africa
  'cairo': 'Africa/Cairo',
  'alexandria': 'Africa/Cairo',
  'giza': 'Africa/Cairo',
  'lagos': 'Africa/Lagos',
  'kano': 'Africa/Lagos',
  'ibadan': 'Africa/Lagos',
  'kaduna': 'Africa/Lagos',
  'port harcourt': 'Africa/Lagos',
  'portharcourt': 'Africa/Lagos',
  'nairobi': 'Africa/Nairobi',
  'mombasa': 'Africa/Nairobi',
  'kisumu': 'Africa/Nairobi',
  'johannesburg': 'Africa/Johannesburg',
  'capetown': 'Africa/Johannesburg',
  'durban': 'Africa/Johannesburg',
  'pretoria': 'Africa/Johannesburg',
  'casablanca': 'Africa/Casablanca',
  'rabat': 'Africa/Casablanca',
  'fes': 'Africa/Casablanca',
  'marrakech': 'Africa/Casablanca',
  'tunis': 'Africa/Tunis',
  'sfax': 'Africa/Tunis',
  'sousse': 'Africa/Tunis',
  'algiers': 'Africa/Algiers',
  'oran': 'Africa/Algiers',
  'constantine': 'Africa/Algiers',
  
  // South America
  'saopaulo': 'America/Sao_Paulo',
  'riodejaneiro': 'America/Sao_Paulo',
  'brasilia': 'America/Sao_Paulo',
  'salvador': 'America/Sao_Paulo',
  'fortaleza': 'America/Sao_Paulo',
  'belo horizonte': 'America/Sao_Paulo',
  'belohorizonte': 'America/Sao_Paulo',
  'manaus': 'America/Manaus',
  'curitiba': 'America/Sao_Paulo',
  'recife': 'America/Sao_Paulo',
  'porto alegre': 'America/Sao_Paulo',
  'portoalegre': 'America/Sao_Paulo',
  'buenosaires': 'America/Argentina/Buenos_Aires',
  'cordoba': 'America/Argentina/Cordoba',
  'rosario': 'America/Argentina/Buenos_Aires',
  'mendoza': 'America/Argentina/Mendoza',
  'lima': 'America/Lima',
  'arequipa': 'America/Lima',
  'trujillo': 'America/Lima',
  'bogota': 'America/Bogota',
  'medellin': 'America/Bogota',
  'cali': 'America/Bogota',
  'barranquilla': 'America/Bogota',
  'caracas': 'America/Caracas',
  'maracaibo': 'America/Caracas',
  'valencia venezuela': 'America/Caracas',
  'santiago': 'America/Santiago',
  'valparaiso': 'America/Santiago',
  'concepcion': 'America/Santiago',
};

function normalizeLocation(location: string): string {
  return location.toLowerCase().replace(/[^a-z]/g, '');
}

function getTimezoneForLocation(location: string): string | null {
  const normalized = normalizeLocation(location);
  return TIMEZONE_MAP[normalized] || null;
}

function isDaytime(hour: number): boolean {
  return hour >= 6 && hour < 18;
}

export async function getCurrentTimeTool(input: GetCurrentTimeInput): Promise<GetCurrentTimeOutput> {
  const location = input.location?.trim() || 'server';
  const timezone = getTimezoneForLocation(location);
  
  if (!timezone) {
    // Fallback to server time with a note
    const now = new Date();
    const serverTimezone = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).resolvedOptions().timeZone;
    
    return {
      currentDate: now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      currentTime: now.toLocaleTimeString(),
      timeZone: serverTimezone,
      location: location,
      timeZoneOffset: now.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() || '',
      isDaytime: isDaytime(now.getHours()),
      note: `Could not find timezone for "${location}". Showing server time instead. For accurate local time, please specify a major city name.`,
    };
  }
  
  try {
    const now = new Date();
    const locationTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    // Format the date and time for the specific location
    const currentDate = locationTime.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: timezone 
    });
    
    const currentTime = locationTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone
    });
    
    // Get timezone offset
    const offset = locationTime.toLocaleTimeString('en-US', { 
      timeZoneName: 'short',
      timeZone: timezone 
    }).split(' ').pop() || '';
    
    // Determine if it's daytime
    const hour = locationTime.getHours();
    const isDay = isDaytime(hour);
    
    return {
      currentDate: currentDate,
      currentTime: currentTime,
      timeZone: timezone,
      location: location,
      timeZoneOffset: offset,
      isDaytime: isDay,
      note: `Current time in ${location} (${timezone})`,
    };
    
  } catch (error) {
    console.error('Error getting time for location:', location, error);
    
    // Fallback to server time
    const now = new Date();
    const serverTimezone = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).resolvedOptions().timeZone;
    
    return {
      currentDate: now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      currentTime: now.toLocaleTimeString(),
      timeZone: serverTimezone,
      location: location,
      timeZoneOffset: now.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() || '',
      isDaytime: isDaytime(now.getHours()),
      note: `Error getting time for "${location}". Showing server time instead.`,
    };
  }
}

