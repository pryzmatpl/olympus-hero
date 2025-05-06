// Calculate Western zodiac sign based on birth date
export function calculate_western_zodiac(date) {
  const month = date.getMonth() + 1; // JavaScript months are 0-11
  const day = date.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return {
      sign: 'Aries',
      dateRange: 'March 21 - April 19',
      element: 'Fire',
      traits: ['courageous', 'determined', 'confident', 'enthusiastic', 'optimistic', 'honest'],
      strengths: ['leadership', 'courage', 'passion'],
      weaknesses: ['impatience', 'aggressiveness', 'impulsiveness']
    };
  } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return {
      sign: 'Taurus',
      dateRange: 'April 20 - May 20',
      element: 'Earth',
      traits: ['reliable', 'patient', 'practical', 'devoted', 'responsible', 'stable'],
      strengths: ['reliability', 'patience', 'practicality'],
      weaknesses: ['stubbornness', 'possessiveness', 'uncompromising']
    };
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return {
      sign: 'Gemini',
      dateRange: 'May 21 - June 20',
      element: 'Air',
      traits: ['gentle', 'affectionate', 'curious', 'adaptable', 'quick-learning', 'versatile'],
      strengths: ['adaptability', 'communication', 'intellect'],
      weaknesses: ['nervousness', 'inconsistency', 'indecisiveness']
    };
  } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return {
      sign: 'Cancer',
      dateRange: 'June 21 - July 22',
      element: 'Water',
      traits: ['tenacious', 'emotional', 'loyal', 'sympathetic', 'persuasive', 'imaginative'],
      strengths: ['tenacity', 'imagination', 'loyalty'],
      weaknesses: ['moodiness', 'insecurity', 'manipulative']
    };
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return {
      sign: 'Leo',
      dateRange: 'July 23 - August 22',
      element: 'Fire',
      traits: ['creative', 'passionate', 'generous', 'warm-hearted', 'cheerful', 'humorous'],
      strengths: ['creativity', 'generosity', 'charisma'],
      weaknesses: ['arrogance', 'stubbornness', 'inflexibility']
    };
  } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return {
      sign: 'Virgo',
      dateRange: 'August 23 - September 22',
      element: 'Earth',
      traits: ['loyal', 'analytical', 'kind', 'hardworking', 'practical', 'diligent'],
      strengths: ['attention to detail', 'intelligence', 'modesty'],
      weaknesses: ['shyness', 'worry', 'critical nature']
    };
  } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return {
      sign: 'Libra',
      dateRange: 'September 23 - October 22',
      element: 'Air',
      traits: ['cooperative', 'diplomatic', 'fair-minded', 'social', 'gracious', 'balanced'],
      strengths: ['diplomacy', 'fairness', 'harmony'],
      weaknesses: ['indecisiveness', 'avoidance', 'self-pity']
    };
  } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return {
      sign: 'Scorpio',
      dateRange: 'October 23 - November 21',
      element: 'Water',
      traits: ['resourceful', 'brave', 'passionate', 'stubborn', 'determined', 'mystical'],
      strengths: ['resourcefulness', 'courage', 'passion'],
      weaknesses: ['distrust', 'jealousy', 'secretiveness']
    };
  } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return {
      sign: 'Sagittarius',
      dateRange: 'November 22 - December 21',
      element: 'Fire',
      traits: ['generous', 'idealistic', 'optimistic', 'enthusiastic', 'philosophical', 'adventurous'],
      strengths: ['optimism', 'freedom-loving', 'honesty'],
      weaknesses: ['impatience', 'carelessness', 'tactlessness']
    };
  } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return {
      sign: 'Capricorn',
      dateRange: 'December 22 - January 19',
      element: 'Earth',
      traits: ['responsible', 'disciplined', 'self-control', 'good managers', 'practical', 'perseverant'],
      strengths: ['responsibility', 'discipline', 'ambition'],
      weaknesses: ['pessimism', 'fatalism', 'expecting the worst']
    };
  } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return {
      sign: 'Aquarius',
      dateRange: 'January 20 - February 18',
      element: 'Air',
      traits: ['progressive', 'original', 'independent', 'humanitarian', 'intellectual', 'inventive'],
      strengths: ['originality', 'independence', 'humanitarianism'],
      weaknesses: ['emotionally detached', 'uncompromising', 'temperamental']
    };
  } else {
    return {
      sign: 'Pisces',
      dateRange: 'February 19 - March 20',
      element: 'Water',
      traits: ['compassionate', 'intuitive', 'gentle', 'wise', 'artistic', 'musical'],
      strengths: ['compassion', 'intuition', 'artistic talents'],
      weaknesses: ['fearfulness', 'overly trusting', 'escapist tendencies']
    };
  }
}

// Calculate Chinese zodiac sign based on birth year
// Define a map of Chinese New Year dates for relevant years
const CalendarChinese = require('date-chinese');

// Generate Chinese New Year lookup table for 1950–2150
function generateChineseNewYearTable(startYear, endYear) {
  const table = {};
  for (let year = startYear; year <= endYear; year++) {
    const cal = new CalendarChinese();
    const newYearJDE = cal.newYear(year); // Get Julian Day Ephemeris for Chinese New Year
    cal.fromJDE(newYearJDE); // Set calendar to Chinese New Year date
    const gregorianDate = cal.toGregorian(); // Convert to Gregorian date
    table[year] = new Date(gregorianDate.year, gregorianDate.month - 1, gregorianDate.day); // Store as Date object
  }
  return table;
}

// Lookup table for 1950–2150
const chineseNewYearTable = generateChineseNewYearTable(1950, 2150);

// Calculate Chinese zodiac sign based on birth date
export function calculate_chinese_zodiac(date) {
  const birthYear = date.getFullYear();

  // Get the Chinese New Year date for the birth year
  let cny = chineseNewYearTable[birthYear];

  // If no Chinese New Year date is found, default to February 1 (approximation)
  if (!cny) {
    cny = new Date(birthYear, 1, 1);
  }

  // Adjust the zodiac year if the birth date is before the Chinese New Year
  let zodiacYear = birthYear;
  if (date < cny) {
    zodiacYear -= 1;
  }

  // Define the animals array (unchanged from original)
  const animals = [
    {
      sign: 'Rat',
      element: 'Yang Water',
      years: '1924, 1936, 1948, 1960, 1972, 1984, 1996, 2008, 2020',
      traits: ['quick-witted', 'resourceful', 'versatile', 'kind', 'smart', 'adaptable'],
      compatibility: ['Dragon', 'Monkey', 'Ox']
    },
    {
      sign: 'Ox',
      element: 'Yin Earth',
      years: '1925, 1937, 1949, 1961, 1973, 1985, 1997, 2009, 2021',
      traits: ['diligent', 'dependable', 'strong', 'determined', 'honest', 'patient'],
      compatibility: ['Snake', 'Rooster', 'Rat']
    },
    {
      sign: 'Tiger',
      element: 'Yang Wood',
      years: '1926, 1938, 1950, 1962, 1974, 1986, 1998, 2010, 2022',
      traits: ['brave', 'competitive', 'confident', 'unpredictable', 'charming', 'passionate'],
      compatibility: ['Horse', 'Dog', 'Pig']
    },
    {
      sign: 'Rabbit',
      element: 'Yin Wood',
      years: '1927, 1939, 1951, 1963, 1975, 1987, 1999, 2011, 2023',
      traits: ['gentle', 'elegant', 'quiet', 'alert', 'responsible', 'artistic'],
      compatibility: ['Sheep', 'Monkey', 'Dog']
    },
    {
      sign: 'Dragon',
      element: 'Yang Earth',
      years: '1928, 1940, 1952, 1964, 1976, 1988, 2000, 2012, 2024',
      traits: ['confident', 'intelligent', 'ambitious', 'charismatic', 'enthusiastic', 'powerful'],
      compatibility: ['Rooster', 'Monkey', 'Rat']
    },
    {
      sign: 'Snake',
      element: 'Yin Fire',
      years: '1929, 1941, 1953, 1965, 1977, 1989, 2001, 2013, 2025',
      traits: ['wise', 'intuitive', 'elegant', 'determined', 'graceful', 'mysterious'],
      compatibility: ['Monkey', 'Rooster', 'Ox']
    },
    {
      sign: 'Horse',
      element: 'Yang Fire',
      years: '1930, 1942, 1954, 1966, 1978, 1990, 2002, 2014, 2026',
      traits: ['animated', 'active', 'energetic', 'friendly', 'independent', 'freedom-loving'],
      compatibility: ['Sheep', 'Tiger', 'Dog']
    },
    {
      sign: 'Sheep/Goat',
      element: 'Yin Earth',
      years: '1931, 1943, 1955, 1967, 1979, 1991, 2003, 2015, 2027',
      traits: ['calm', 'gentle', 'compassionate', 'creative', 'thoughtful', 'perseverant'],
      compatibility: ['Rabbit', 'Horse', 'Pig']
    },
    {
      sign: 'Monkey',
      element: 'Yang Metal',
      years: '1932, 1944, 1956, 1968, 1980, 1992, 2004, 2016, 2028',
      traits: ['witty', 'intelligent', 'magnetic', 'curious', 'mischievous', 'clever'],
      compatibility: ['Dragon', 'Rat', 'Snake']
    },
    {
      sign: 'Rooster',
      element: 'Yin Metal',
      years: '1933, 1945, 1957, 1969, 1981, 1993, 2005, 2017, 2029',
      traits: ['observant', 'hardworking', 'courageous', 'talented', 'confident', 'honest'],
      compatibility: ['Ox', 'Snake', 'Dragon']
    },
    {
      sign: 'Dog',
      element: 'Yang Earth',
      years: '1934, 1946, 1958, 1970, 1982, 1994, 2006, 2018, 2030',
      traits: ['loyal', 'honest', 'responsible', 'courageous', 'just', 'prudent'],
      compatibility: ['Rabbit', 'Tiger', 'Horse']
    },
    {
      sign: 'Pig',
      element: 'Yin Water',
      years: '1935, 1947, 1959, 1971, 1983, 1995, 2007, 2019, 2031',
      traits: ['compassionate', 'generous', 'earnest', 'diligent', 'trusting', 'sincere'],
      compatibility: ['Sheep', 'Rabbit', 'Tiger']
    }
  ];

  // Calculate the zodiac index based on the adjusted year
  const startYear = 1924;
  let index = (zodiacYear - startYear) % 12;

  // Handle negative indices for years before 1924
  if (index < 0) index += 12;

  return animals[index];
}