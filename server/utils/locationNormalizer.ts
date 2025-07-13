/**
 * Location Normalizer
 * Handles intelligent matching of location variations and common aliases
 */

// Country normalization mapping
const countryAliases = {
  // United Kingdom variations
  'UK': 'United Kingdom',
  'England': 'United Kingdom',
  'Great Britain': 'United Kingdom',
  'Britain': 'United Kingdom',
  'United Kingdom of Great Britain and Northern Ireland': 'United Kingdom',
  
  // United States variations
  'USA': 'United States',
  'US': 'United States',
  'U.S.': 'United States',
  'U.S.A.': 'United States',
  'America': 'United States',
  'United States of America': 'United States',
  
  // Germany variations
  'Deutschland': 'Germany',
  'Federal Republic of Germany': 'Germany',
  
  // France variations
  'République française': 'France',
  'French Republic': 'France',
  
  // Other common variations
  'Holland': 'Netherlands',
  'UAE': 'United Arab Emirates',
  'South Korea': 'Republic of Korea',
  'North Korea': 'Democratic People\'s Republic of Korea',
  'Russia': 'Russian Federation',
  'China': 'People\'s Republic of China',
  'Taiwan': 'Republic of China (Taiwan)',
  'Czech Republic': 'Czechia',
  'Macedonia': 'North Macedonia',
  'Congo': 'Democratic Republic of the Congo',
  'Burma': 'Myanmar',
  'Ivory Coast': 'Côte d\'Ivoire',
  'Cape Verde': 'Cabo Verde'
};

// City normalization mapping
const cityAliases = {
  // United Kingdom cities
  'London, UK': 'London',
  'London, England': 'London',
  'London, Great Britain': 'London',
  'City of London': 'London',
  'Greater London': 'London',
  
  // United States cities
  'New York City': 'New York',
  'NYC': 'New York',
  'Manhattan': 'New York',
  'New York, NY': 'New York',
  'Los Angeles, CA': 'Los Angeles',
  'LA': 'Los Angeles',
  'San Francisco, CA': 'San Francisco',
  'SF': 'San Francisco',
  'Chicago, IL': 'Chicago',
  'Washington DC': 'Washington',
  'Washington D.C.': 'Washington',
  'The District': 'Washington',
  
  // Other international cities
  'München': 'Munich',
  'Munchen': 'Munich',
  'München, Deutschland': 'Munich',
  'Paris, France': 'Paris',
  'Ville de Paris': 'Paris',
  'Singapore City': 'Singapore',
  'Singapore, Singapore': 'Singapore',
  'Toronto, ON': 'Toronto',
  'Toronto, Ontario': 'Toronto',
  'Vancouver, BC': 'Vancouver',
  'Vancouver, British Columbia': 'Vancouver',
  'Sydney, NSW': 'Sydney',
  'Sydney, Australia': 'Sydney',
  'Melbourne, VIC': 'Melbourne',
  'Melbourne, Australia': 'Melbourne',
  'Tokyo, Japan': 'Tokyo',
  'Hong Kong SAR': 'Hong Kong',
  'Hong Kong, China': 'Hong Kong'
};

// Regional variations for major cities
const cityRegionalVariations = {
  'London': ['London, UK', 'London, England', 'London, United Kingdom', 'Greater London'],
  'New York': ['New York City', 'NYC', 'Manhattan', 'New York, NY', 'New York, USA'],
  'Paris': ['Paris, France', 'Ville de Paris'],
  'Munich': ['München', 'Munchen', 'München, Germany', 'Munich, Germany'],
  'Singapore': ['Singapore City', 'Singapore, Singapore'],
  'Toronto': ['Toronto, ON', 'Toronto, Ontario', 'Toronto, Canada'],
  'Vancouver': ['Vancouver, BC', 'Vancouver, British Columbia', 'Vancouver, Canada'],
  'Sydney': ['Sydney, NSW', 'Sydney, Australia'],
  'Tokyo': ['Tokyo, Japan'],
  'Hong Kong': ['Hong Kong SAR', 'Hong Kong, China']
};

/**
 * Normalize country name to standard format
 */
export function normalizeCountryName(country: string): string {
  if (!country) return '';
  
  const trimmed = country.trim();
  
  // Direct match
  if (countryAliases[trimmed]) {
    return countryAliases[trimmed];
  }
  
  // Case-insensitive match
  const lowerCountry = trimmed.toLowerCase();
  for (const [alias, normalized] of Object.entries(countryAliases)) {
    if (alias.toLowerCase() === lowerCountry) {
      return normalized;
    }
  }
  
  return trimmed; // Return original if no match found
}

/**
 * Normalize city name to standard format
 */
export function normalizeCityName(city: string, country?: string): string {
  if (!city) return '';
  
  const trimmed = city.trim();
  
  // Direct match in aliases
  if (cityAliases[trimmed]) {
    return cityAliases[trimmed];
  }
  
  // Case-insensitive match in aliases
  const lowerCity = trimmed.toLowerCase();
  for (const [alias, normalized] of Object.entries(cityAliases)) {
    if (alias.toLowerCase() === lowerCity) {
      return normalized;
    }
  }
  
  // Check regional variations
  for (const [standardCity, variations] of Object.entries(cityRegionalVariations)) {
    if (variations.some(variation => 
      variation.toLowerCase() === lowerCity || 
      variation.toLowerCase().includes(lowerCity) ||
      lowerCity.includes(variation.toLowerCase())
    )) {
      return standardCity;
    }
  }
  
  // Remove country suffix if present
  if (country) {
    const normalizedCountry = normalizeCountryName(country);
    const cityWithoutCountry = trimmed
      .replace(new RegExp(`, ${country}$`, 'i'), '')
      .replace(new RegExp(`, ${normalizedCountry}$`, 'i'), '')
      .trim();
    
    if (cityWithoutCountry !== trimmed) {
      return normalizeCityName(cityWithoutCountry);
    }
  }
  
  return trimmed; // Return original if no match found
}

/**
 * Smart location matching for database queries
 */
export function findBestLocationMatch(searchCountry: string, searchCity: string, availableLocations: Array<{country: string, city: string}>): Array<{country: string, city: string}> {
  const normalizedSearchCountry = normalizeCountryName(searchCountry);
  const normalizedSearchCity = normalizeCityName(searchCity, searchCountry);
  
  // Exact match after normalization
  const exactMatch = availableLocations.filter(loc => 
    normalizeCountryName(loc.country) === normalizedSearchCountry &&
    normalizeCityName(loc.city, loc.country) === normalizedSearchCity
  );
  
  if (exactMatch.length > 0) {
    return exactMatch;
  }
  
  // Country match only (for fallback)
  const countryMatch = availableLocations.filter(loc => 
    normalizeCountryName(loc.country) === normalizedSearchCountry
  );
  
  if (countryMatch.length > 0) {
    // Try to find a major city in the same country
    const majorCityMatch = countryMatch.filter(loc => {
      const normalizedCity = normalizeCityName(loc.city, loc.country);
      return ['London', 'New York', 'Paris', 'Munich', 'Singapore', 'Toronto', 'Vancouver', 'Sydney', 'Tokyo'].includes(normalizedCity);
    });
    
    if (majorCityMatch.length > 0) {
      return majorCityMatch.slice(0, 1); // Return first major city
    }
    
    return countryMatch.slice(0, 1); // Return first city in country
  }
  
  return []; // No match found
}

/**
 * Generate location suggestions for user feedback
 */
export function generateLocationSuggestions(searchCountry: string, searchCity: string, availableLocations: Array<{country: string, city: string}>): string[] {
  const normalizedSearchCountry = normalizeCountryName(searchCountry);
  
  // Find all cities in the same country
  const sameCountryCities = availableLocations
    .filter(loc => normalizeCountryName(loc.country) === normalizedSearchCountry)
    .map(loc => `${loc.city}, ${loc.country}`)
    .slice(0, 5); // Limit to 5 suggestions
  
  if (sameCountryCities.length > 0) {
    return sameCountryCities;
  }
  
  // Find similar country names
  const similarCountries = availableLocations
    .filter(loc => {
      const locCountry = normalizeCountryName(loc.country).toLowerCase();
      const searchLower = normalizedSearchCountry.toLowerCase();
      return locCountry.includes(searchLower) || searchLower.includes(locCountry);
    })
    .map(loc => `${loc.city}, ${loc.country}`)
    .slice(0, 5);
  
  return similarCountries;
}

/**
 * Validate location format and provide normalization feedback
 */
export function validateAndNormalizeLocation(country: string, city: string): {
  normalizedCountry: string;
  normalizedCity: string;
  suggestions: string[];
  isNormalized: boolean;
} {
  const normalizedCountry = normalizeCountryName(country);
  const normalizedCity = normalizeCityName(city, country);
  
  const isCountryNormalized = normalizedCountry !== country;
  const isCityNormalized = normalizedCity !== city;
  const isNormalized = isCountryNormalized || isCityNormalized;
  
  const suggestions: string[] = [];
  if (isCountryNormalized) {
    suggestions.push(`Country normalized: "${country}" → "${normalizedCountry}"`);
  }
  if (isCityNormalized) {
    suggestions.push(`City normalized: "${city}" → "${normalizedCity}"`);
  }
  
  return {
    normalizedCountry,
    normalizedCity,
    suggestions,
    isNormalized
  };
}