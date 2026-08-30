/**
 * Amharic Number-to-Words Phonetic Translator & Human Caller Prosody Engine
 * Designed to mimic an energetic Ethiopian live bingo caller (Viva/Ethio Bingo style).
 * Supports both Native Ge'ez and Natural Human Phonetics with anticipation pauses.
 */

// Native Ge'ez Units (1 to 19)
const amharicUnitsGeEz: Record<number, string> = {
  1: 'አንድ',
  2: 'ሁለት',
  3: 'ሶስት',
  4: 'አራት',
  5: 'አምስት',
  6: 'ስድስት',
  7: 'ሰባት',
  8: 'ስምንት',
  9: 'ዘጠኝ',
  10: 'አስር',
  11: 'አስራ አንድ',
  12: 'አስራ ሁለት',
  13: 'አስራ ሶስት',
  14: 'አስራ አራት',
  15: 'አስራ አምስት',
  16: 'አስራ ስድስት',
  17: 'አስራ ሰባት',
  18: 'አስራ ስምንት',
  19: 'አስራ ዘጠኝ'
};

// Human Phonetic Units (Tuned for energetic, natural human caller cadence)
const amharicUnitsPhonetic: Record<number, string> = {
  1: 'And',
  2: 'Hoo-lett',
  3: 'Sohst',
  4: 'Ah-raat',
  5: 'Ah-mist',
  6: 'Sih-dist',
  7: 'Seh-baat',
  8: 'Sim-mint',
  9: 'Zeh-tayn',
  10: 'Ah-sir',
  11: 'Ahs-rah And',
  12: 'Ahs-rah Hoo-lett',
  13: 'Ahs-rah Sohst',
  14: 'Ahs-rah Ah-raat',
  15: 'Ahs-rah Ah-mist',
  16: 'Ahs-rah Sih-dist',
  17: 'Ahs-rah Seh-baat',
  18: 'Ahs-rah Sim-mint',
  19: 'Ahs-rah Zeh-tayn'
};

// Native Ge'ez Tens (20 to 70)
const amharicTensGeEz: Record<number, string> = {
  20: 'ሃያ',
  30: 'ሰላሳ',
  40: 'አርባ',
  50: 'ሃምሳ',
  60: 'ስልሳ',
  70: 'ሰባ'
};

// Human Phonetic Tens
const amharicTensPhonetic: Record<number, string> = {
  20: 'Hah-yah',
  30: 'Seh-lah-sah',
  40: 'Ahr-bah',
  50: 'Hahm-sah',
  60: 'Sil-sah',
  70: 'Seh-bah'
};

// Column Letters with human caller emphasis
const amharicLettersGeEz: Record<string, string> = {
  B: 'ቢ',
  I: 'አይ',
  N: 'ኤን',
  G: 'ጂ',
  O: 'ኦ'
};

const amharicLettersPhonetic: Record<string, string> = {
  B: 'Beee',
  I: 'Ah-yeee',
  N: 'Ennn',
  G: 'Jeee',
  O: 'Ohhh'
};

/**
 * Returns native Ge'ez words for a number (1 to 75)
 */
export const getAmharicNumberWords = (num: number): string => {
  if (num <= 19) {
    return amharicUnitsGeEz[num] || num.toString();
  }
  const tens = Math.floor(num / 10) * 10;
  const unit = num % 10;
  const tensStr = amharicTensGeEz[tens] || '';

  if (unit === 0) {
    return tensStr;
  }
  return `${tensStr} ${amharicUnitsGeEz[unit] || unit}`;
};

/**
 * Returns human-mimicking phonetic pronunciation for a number (1 to 75)
 */
export const getAmharicNumberPhonetic = (num: number): string => {
  if (num <= 19) {
    return amharicUnitsPhonetic[num] || num.toString();
  }
  const tens = Math.floor(num / 10) * 10;
  const unit = num % 10;
  const tensStr = amharicTensPhonetic[tens] || '';

  if (unit === 0) {
    return tensStr;
  }
  return `${tensStr} ${amharicUnitsPhonetic[unit] || unit}`;
};

/**
 * Two-Beat Caller Struct: Separate Letter and Number for natural human timing
 */
export interface HumanCallParts {
  letterGeEz: string;
  numberGeEz: string;
  letterPhonetic: string;
  numberPhonetic: string;
}

export const getHumanCallParts = (col: string, num: number): HumanCallParts => {
  return {
    letterGeEz: amharicLettersGeEz[col] || col,
    numberGeEz: getAmharicNumberWords(num),
    letterPhonetic: amharicLettersPhonetic[col] || col,
    numberPhonetic: getAmharicNumberPhonetic(num)
  };
};

export const getAmharicCallText = (col: string, num: number): string => {
  const parts = getHumanCallParts(col, num);
  return `${parts.letterGeEz} ... ${parts.numberGeEz}`;
};

export const getAmharicCallPhonetic = (col: string, num: number): string => {
  const parts = getHumanCallParts(col, num);
  return `${parts.letterPhonetic}... ${parts.numberPhonetic}!`;
};

/**
 * Authentic Live Ethiopian Bingo Caller Shouts & Announcements
 */
export interface GamePhrase {
  geez: string;
  phonetic: string;
  en: string;
}

export const gamePhrases: Record<string, GamePhrase> = {
  start: {
    geez: 'ጨዋታው በይፋ ተጀምሯል! መልካም እድል!',
    phonetic: 'Chah-wah-tah-woo beh-yee-fah teh-jem-rwol! Mel-kam ed-dil!',
    en: 'Game is officially underway! Good luck!'
  },
  solo_win: {
    geez: 'ቢንጎ! ቢንጎ! እንኳን ደስ አለዎት! ሙሉ ፖቱን አሸንፈዋል!',
    phonetic: 'Bingo! Bingo! En-kwan dess ah-leh-woht! Moo-loo poh-toon ash-en-fah-wahl!',
    en: 'Bingo! Bingo! Congratulations, you won the full jackpot!'
  },
  split_win: {
    geez: 'ቢንጎ! የጋራ አሸናፊዎች! ብሩ በእኩል ተከፋፍሏል!',
    phonetic: 'Bingo! Yeh-gah-rah ash-en-ah-fee-woch! Bir-roo beh-ik-kool teh-keh-fah-flwol!',
    en: 'Bingo! Joint winners! The pot is split equally!'
  },
  opp_win: {
    geez: 'ቢንጎ! አሸናፊ ተገኝቷል! ቀጣዩ ዙር አሁን ይጀምራል!',
    phonetic: 'Bingo! Ash-en-ah-fee teh-gehn-ywal! Keh-tah-yoo zoor ah-hoon yee-jem-rahl!',
    en: 'Bingo! Winner found! Next round starts shortly!'
  },
  one_to_go: {
    geez: 'አንድ ቁጥር ብቻ ቀርቷል! በርቱ!',
    phonetic: 'And koo-tir bee-chah kehr-twol! Ber-too!',
    en: 'Only one number left! Good luck!'
  }
};
