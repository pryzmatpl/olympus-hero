import { useState, useEffect } from 'react';

export interface ZodiacInfo {
  western: {
    sign: string;
    dateRange: string;
    element: string;
    traits: string[];
    strengths: string[];
    weaknesses: string[];
  };
  chinese: {
    sign: string;
    element: string;
    years: string;
    traits: string[];
    compatibility: string[];
  };
}

// Western Zodiac signs data
const westernSigns = [
  {
    sign: 'Aries',
    dateRange: 'March 21 - April 19',
    element: 'Fire',
    traits: ['courageous', 'determined', 'confident', 'enthusiastic', 'optimistic', 'honest'],
    strengths: ['leadership', 'courage', 'passion'],
    weaknesses: ['impatience', 'aggressiveness', 'impulsiveness']
  },
  {
    sign: 'Taurus',
    dateRange: 'April 20 - May 20',
    element: 'Earth',
    traits: ['reliable', 'patient', 'practical', 'devoted', 'responsible', 'stable'],
    strengths: ['reliability', 'patience', 'practicality'],
    weaknesses: ['stubbornness', 'possessiveness', 'uncompromising']
  },
  {
    sign: 'Gemini',
    dateRange: 'May 21 - June 20',
    element: 'Air',
    traits: ['gentle', 'affectionate', 'curious', 'adaptable', 'quick-learning', 'versatile'],
    strengths: ['adaptability', 'communication', 'intellect'],
    weaknesses: ['nervousness', 'inconsistency', 'indecisiveness']
  },
  {
    sign: 'Cancer',
    dateRange: 'June 21 - July 22',
    element: 'Water',
    traits: ['tenacious', 'emotional', 'loyal', 'sympathetic', 'persuasive', 'imaginative'],
    strengths: ['tenacity', 'imagination', 'loyalty'],
    weaknesses: ['moodiness', 'insecurity', 'manipulative']
  },
  {
    sign: 'Leo',
    dateRange: 'July 23 - August 22',
    element: 'Fire',
    traits: ['creative', 'passionate', 'generous', 'warm-hearted', 'cheerful', 'humorous'],
    strengths: ['creativity', 'generosity', 'charisma'],
    weaknesses: ['arrogance', 'stubbornness', 'inflexibility']
  },
  {
    sign: 'Virgo',
    dateRange: 'August 23 - September 22',
    element: 'Earth',
    traits: ['loyal', 'analytical', 'kind', 'hardworking', 'practical', 'diligent'],
    strengths: ['attention to detail', 'intelligence', 'modesty'],
    weaknesses: ['shyness', 'worry', 'critical nature']
  },
  {
    sign: 'Libra',
    dateRange: 'September 23 - October 22',
    element: 'Air',
    traits: ['cooperative', 'diplomatic', 'fair-minded', 'social', 'gracious', 'balanced'],
    strengths: ['diplomacy', 'fairness', 'harmony'],
    weaknesses: ['indecisiveness', 'avoidance', 'self-pity']
  },
  {
    sign: 'Scorpio',
    dateRange: 'October 23 - November 21',
    element: 'Water',
    traits: ['resourceful', 'brave', 'passionate', 'stubborn', 'determined', 'mystical'],
    strengths: ['resourcefulness', 'courage', 'passion'],
    weaknesses: ['distrust', 'jealousy', 'secretiveness']
  },
  {
    sign: 'Sagittarius',
    dateRange: 'November 22 - December 21',
    element: 'Fire',
    traits: ['generous', 'idealistic', 'optimistic', 'enthusiastic', 'philosophical', 'adventurous'],
    strengths: ['optimism', 'freedom-loving', 'honesty'],
    weaknesses: ['impatience', 'carelessness', 'tactlessness']
  },
  {
    sign: 'Capricorn',
    dateRange: 'December 22 - January 19',
    element: 'Earth',
    traits: ['responsible', 'disciplined', 'self-control', 'good managers', 'practical', 'perseverant'],
    strengths: ['responsibility', 'discipline', 'ambition'],
    weaknesses: ['pessimism', 'fatalism', 'expecting the worst']
  },
  {
    sign: 'Aquarius',
    dateRange: 'January 20 - February 18',
    element: 'Air',
    traits: ['progressive', 'original', 'independent', 'humanitarian', 'intellectual', 'inventive'],
    strengths: ['originality', 'independence', 'humanitarianism'],
    weaknesses: ['emotionally detached', 'uncompromising', 'temperamental']
  },
  {
    sign: 'Pisces',
    dateRange: 'February 19 - March 20',
    element: 'Water',
    traits: ['compassionate', 'intuitive', 'gentle', 'wise', 'artistic', 'musical'],
    strengths: ['compassion', 'intuition', 'artistic talents'],
    weaknesses: ['fearfulness', 'overly trusting', 'escapist tendencies']
  }
];

// Chinese zodiac signs data
const chineseAnimals = [
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

const chineseNewYearDates: Record<number, string> = {
  1924: '1924-02-05', 1925: '1925-01-24', 1926: '1926-02-13', 1927: '1927-02-02',
  1928: '1928-01-23', 1929: '1929-02-10', 1930: '1930-01-30', 1931: '1931-02-17',
  1932: '1932-02-06', 1933: '1933-01-26', 1934: '1934-02-14', 1935: '1935-02-04',
  1936: '1936-01-24', 1937: '1937-02-11', 1938: '1938-01-31', 1939: '1939-02-19',
  1940: '1940-02-08', 1941: '1941-01-27', 1942: '1942-02-15', 1943: '1943-02-05',
  1944: '1944-01-25', 1945: '1945-02-13', 1946: '1946-02-02', 1947: '1947-01-22',
  1948: '1948-02-10', 1949: '1949-01-29', 1950: '1950-02-17', 1951: '1951-02-06',
  1952: '1952-01-27', 1953: '1953-02-14', 1954: '1954-02-03', 1955: '1955-01-24',
  1956: '1956-02-12', 1957: '1957-01-31', 1958: '1958-02-18', 1959: '1959-02-08',
  1960: '1960-01-28', 1961: '1961-02-15', 1962: '1962-02-05', 1963: '1963-01-25',
  1964: '1964-02-13', 1965: '1965-02-02', 1966: '1966-01-21', 1967: '1967-02-09',
  1968: '1968-01-30', 1969: '1969-02-17', 1970: '1970-02-06', 1971: '1971-01-27',
  1972: '1972-02-15', 1973: '1973-02-03', 1974: '1974-01-23', 1975: '1975-02-11',
  1976: '1976-01-31', 1977: '1977-02-18', 1978: '1978-02-07', 1979: '1979-01-28',
  1980: '1980-02-16', 1981: '1981-02-05', 1982: '1982-01-25', 1983: '1983-02-13',
  1984: '1984-02-02', 1985: '1985-02-20', 1986: '1986-02-09', 1987: '1987-01-29',
  1988: '1988-02-17', 1989: '1989-02-06', 1990: '1990-01-27', 1991: '1991-02-15',
  1992: '1992-02-04', 1993: '1993-01-23', 1994: '1994-02-10', 1995: '1995-01-31',
  1996: '1996-02-19', 1997: '1997-02-07', 1998: '1998-01-28', 1999: '1999-02-16',
  2000: '2000-02-05', 2001: '2001-01-24', 2002: '2002-02-12', 2003: '2003-02-01',
  2004: '2004-01-22', 2005: '2005-02-09', 2006: '2006-01-29', 2007: '2007-02-18',
  2008: '2008-02-07', 2009: '2009-01-26', 2010: '2010-02-14', 2011: '2011-02-03',
  2012: '2012-01-23', 2013: '2013-02-10', 2014: '2014-01-31', 2015: '2015-02-19',
  2016: '2016-02-08', 2017: '2017-01-28', 2018: '2018-02-16', 2019: '2019-02-05',
  2020: '2020-01-25', 2021: '2021-02-12', 2022: '2022-02-01', 2023: '2023-01-22',
  2024: '2024-02-10', 2025: '2025-01-29', 2026: '2026-02-17', 2027: '2027-02-06',
  2028: '2028-01-26', 2029: '2029-02-13', 2030: '2030-02-03', 2031: '2031-01-23',
  2032: '2032-02-11', 2033: '2033-01-31', 2034: '2034-02-19', 2035: '2035-02-08',
  2036: '2036-01-28', 2037: '2037-02-15', 2038: '2038-02-04', 2039: '2039-01-24',
  2040: '2040-02-12', 2041: '2041-02-01', 2042: '2042-01-22', 2043: '2043-02-10',
  2044: '2044-01-30', 2045: '2045-02-17', 2046: '2046-02-06', 2047: '2047-01-26',
  2048: '2048-02-14', 2049: '2049-02-02', 2050: '2050-01-23'
};


export const useZodiac = (birthdate: Date | null): ZodiacInfo | null => {
  const [zodiacInfo, setZodiacInfo] = useState<ZodiacInfo | null>(null);

  useEffect(() => {
    if (!birthdate) {
      setZodiacInfo(null);
      return;
    }

    // --- WESTERN ZODIAC ---
    const month = birthdate.getMonth() + 1;
    const day = birthdate.getDate();

    let westernSign;
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
      westernSign = westernSigns[0];
    } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
      westernSign = westernSigns[1];
    } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
      westernSign = westernSigns[2];
    } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
      westernSign = westernSigns[3];
    } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
      westernSign = westernSigns[4];
    } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
      westernSign = westernSigns[5];
    } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
      westernSign = westernSigns[6];
    } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
      westernSign = westernSigns[7];
    } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
      westernSign = westernSigns[8];
    } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
      westernSign = westernSigns[9];
    } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
      westernSign = westernSigns[10];
    } else {
      westernSign = westernSigns[11];
    }

    // --- CHINESE ZODIAC ---
    const year = birthdate.getFullYear();
    const cnyStr = chineseNewYearDates[year];
    let zodiacYear = year;

    if (cnyStr) {
      const cny = new Date(cnyStr);
      if (birthdate < cny) {
        zodiacYear -= 1;
      }
    } else {
      // fallback assumption: Feb 1
      if (month === 1 || (month === 2 && day < 1)) {
        zodiacYear -= 1;
      }
    }

    const chineseIndex = (zodiacYear - 1924 + 12) % 12;
    const chineseSign = chineseAnimals[chineseIndex];

    setZodiacInfo({
      western: westernSign,
      chinese: chineseSign
    });
  }, [birthdate]);

  return zodiacInfo;
};