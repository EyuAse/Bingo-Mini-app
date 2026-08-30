/**
 * Addis AI Voice Script Manifest & Prompts
 * Copy-paste these exact text prompts into Addis AI (or any Ethiopian Neural Voice Generator)
 * to generate studio-quality MP3 audio files for the game.
 *
 * Save each output file in: public/assets/audio/am/{filename}.mp3
 */

export interface VoicePromptItem {
  file: string;
  col: string;
  num: number;
  amharicScript: string;
  englishLabel: string;
}

export const addisAiBallPrompts: VoicePromptItem[] = [
  // Column B (1 - 15)
  { file: '1.mp3', col: 'B', num: 1, amharicScript: 'ቢ... አንድ!', englishLabel: 'B-1' },
  { file: '2.mp3', col: 'B', num: 2, amharicScript: 'ቢ... ሁለት!', englishLabel: 'B-2' },
  { file: '3.mp3', col: 'B', num: 3, amharicScript: 'ቢ... ሶስት!', englishLabel: 'B-3' },
  { file: '4.mp3', col: 'B', num: 4, amharicScript: 'ቢ... አራት!', englishLabel: 'B-4' },
  { file: '5.mp3', col: 'B', num: 5, amharicScript: 'ቢ... አምስት!', englishLabel: 'B-5' },
  { file: '6.mp3', col: 'B', num: 6, amharicScript: 'ቢ... ስድስት!', englishLabel: 'B-6' },
  { file: '7.mp3', col: 'B', num: 7, amharicScript: 'ቢ... ሰባት!', englishLabel: 'B-7' },
  { file: '8.mp3', col: 'B', num: 8, amharicScript: 'ቢ... ስምንት!', englishLabel: 'B-8' },
  { file: '9.mp3', col: 'B', num: 9, amharicScript: 'ቢ... ዘጠኝ!', englishLabel: 'B-9' },
  { file: '10.mp3', col: 'B', num: 10, amharicScript: 'ቢ... አስር!', englishLabel: 'B-10' },
  { file: '11.mp3', col: 'B', num: 11, amharicScript: 'ቢ... አስራ አንድ!', englishLabel: 'B-11' },
  { file: '12.mp3', col: 'B', num: 12, amharicScript: 'ቢ... አስራ ሁለት!', englishLabel: 'B-12' },
  { file: '13.mp3', col: 'B', num: 13, amharicScript: 'ቢ... አስራ ሶስት!', englishLabel: 'B-13' },
  { file: '14.mp3', col: 'B', num: 14, amharicScript: 'ቢ... አስራ አራት!', englishLabel: 'B-14' },
  { file: '15.mp3', col: 'B', num: 15, amharicScript: 'ቢ... አስራ አምስት!', englishLabel: 'B-15' },

  // Column I (16 - 30)
  { file: '16.mp3', col: 'I', num: 16, amharicScript: 'አይ... አስራ ስድስት!', englishLabel: 'I-16' },
  { file: '17.mp3', col: 'I', num: 17, amharicScript: 'አይ... አስራ ሰባት!', englishLabel: 'I-17' },
  { file: '18.mp3', col: 'I', num: 18, amharicScript: 'አይ... አስራ ስምንት!', englishLabel: 'I-18' },
  { file: '19.mp3', col: 'I', num: 19, amharicScript: 'አይ... አስራ ዘጠኝ!', englishLabel: 'I-19' },
  { file: '20.mp3', col: 'I', num: 20, amharicScript: 'አይ... ሃያ!', englishLabel: 'I-20' },
  { file: '21.mp3', col: 'I', num: 21, amharicScript: 'አይ... ሃያ አንድ!', englishLabel: 'I-21' },
  { file: '22.mp3', col: 'I', num: 22, amharicScript: 'አይ... ሃያ ሁለት!', englishLabel: 'I-22' },
  { file: '23.mp3', col: 'I', num: 23, amharicScript: 'አይ... ሃያ ሶስት!', englishLabel: 'I-23' },
  { file: '24.mp3', col: 'I', num: 24, amharicScript: 'አይ... ሃያ አራት!', englishLabel: 'I-24' },
  { file: '25.mp3', col: 'I', num: 25, amharicScript: 'አይ... ሃያ አምስት!', englishLabel: 'I-25' },
  { file: '26.mp3', col: 'I', num: 26, amharicScript: 'አይ... ሃያ ስድስት!', englishLabel: 'I-26' },
  { file: '27.mp3', col: 'I', num: 27, amharicScript: 'አይ... ሃያ ሰባት!', englishLabel: 'I-27' },
  { file: '28.mp3', col: 'I', num: 28, amharicScript: 'አይ... ሃያ ስምንት!', englishLabel: 'I-28' },
  { file: '29.mp3', col: 'I', num: 29, amharicScript: 'አይ... ሃያ ዘጠኝ!', englishLabel: 'I-29' },
  { file: '30.mp3', col: 'I', num: 30, amharicScript: 'አይ... ሰላሳ!', englishLabel: 'I-30' },

  // Column N (31 - 45)
  { file: '31.mp3', col: 'N', num: 31, amharicScript: 'ኤን... ሰላሳ አንድ!', englishLabel: 'N-31' },
  { file: '32.mp3', col: 'N', num: 32, amharicScript: 'ኤን... ሰላሳ ሁለት!', englishLabel: 'N-32' },
  { file: '33.mp3', col: 'N', num: 33, amharicScript: 'ኤን... ሰላሳ ሶስት!', englishLabel: 'N-33' },
  { file: '34.mp3', col: 'N', num: 34, amharicScript: 'ኤን... ሰላሳ አራት!', englishLabel: 'N-34' },
  { file: '35.mp3', col: 'N', num: 35, amharicScript: 'ኤን... ሰላሳ አምስት!', englishLabel: 'N-35' },
  { file: '36.mp3', col: 'N', num: 36, amharicScript: 'ኤን... ሰላሳ ስድስት!', englishLabel: 'N-36' },
  { file: '37.mp3', col: 'N', num: 37, amharicScript: 'ኤን... ሰላሳ ሰባት!', englishLabel: 'N-37' },
  { file: '38.mp3', col: 'N', num: 38, amharicScript: 'ኤን... ሰላሳ ስምንት!', englishLabel: 'N-38' },
  { file: '39.mp3', col: 'N', num: 39, amharicScript: 'ኤን... ሰላሳ ዘጠኝ!', englishLabel: 'N-39' },
  { file: '40.mp3', col: 'N', num: 40, amharicScript: 'ኤን... አርባ!', englishLabel: 'N-40' },
  { file: '41.mp3', col: 'N', num: 41, amharicScript: 'ኤን... አርባ አንድ!', englishLabel: 'N-41' },
  { file: '42.mp3', col: 'N', num: 42, amharicScript: 'ኤን... አርባ ሁለት!', englishLabel: 'N-42' },
  { file: '43.mp3', col: 'N', num: 43, amharicScript: 'ኤን... አርባ ሶስት!', englishLabel: 'N-43' },
  { file: '44.mp3', col: 'N', num: 44, amharicScript: 'ኤን... አርባ አራት!', englishLabel: 'N-44' },
  { file: '45.mp3', col: 'N', num: 45, amharicScript: 'ኤን... አርባ አምስት!', englishLabel: 'N-45' },

  // Column G (46 - 60)
  { file: '46.mp3', col: 'G', num: 46, amharicScript: 'ጂ... አርባ ስድስት!', englishLabel: 'G-46' },
  { file: '47.mp3', col: 'G', num: 47, amharicScript: 'ጂ... አርባ ሰባት!', englishLabel: 'G-47' },
  { file: '48.mp3', col: 'G', num: 48, amharicScript: 'ጂ... አርባ ስምንት!', englishLabel: 'G-48' },
  { file: '49.mp3', col: 'G', num: 49, amharicScript: 'ጂ... አርባ ዘጠኝ!', englishLabel: 'G-49' },
  { file: '50.mp3', col: 'G', num: 50, amharicScript: 'ጂ... ሃምሳ!', englishLabel: 'G-50' },
  { file: '51.mp3', col: 'G', num: 51, amharicScript: 'ጂ... ሃምሳ አንድ!', englishLabel: 'G-51' },
  { file: '52.mp3', col: 'G', num: 52, amharicScript: 'ጂ... ሃምሳ ሁለት!', englishLabel: 'G-52' },
  { file: '53.mp3', col: 'G', num: 53, amharicScript: 'ጂ... ሃምሳ ሶስት!', englishLabel: 'G-53' },
  { file: '54.mp3', col: 'G', num: 54, amharicScript: 'ጂ... ሃምሳ አራት!', englishLabel: 'G-54' },
  { file: '55.mp3', col: 'G', num: 55, amharicScript: 'ጂ... ሃምሳ አምስት!', englishLabel: 'G-55' },
  { file: '56.mp3', col: 'G', num: 56, amharicScript: 'ጂ... ሃምሳ ስድስት!', englishLabel: 'G-56' },
  { file: '57.mp3', col: 'G', num: 57, amharicScript: 'ጂ... ሃምሳ ሰባት!', englishLabel: 'G-57' },
  { file: '58.mp3', col: 'G', num: 58, amharicScript: 'ጂ... ሃምሳ ስምንት!', englishLabel: 'G-58' },
  { file: '59.mp3', col: 'G', num: 59, amharicScript: 'ጂ... ሃምሳ ዘጠኝ!', englishLabel: 'G-59' },
  { file: '60.mp3', col: 'G', num: 60, amharicScript: 'ጂ... ስልሳ!', englishLabel: 'G-60' },

  // Column O (61 - 75)
  { file: '61.mp3', col: 'O', num: 61, amharicScript: 'ኦ... ስልሳ አንድ!', englishLabel: 'O-61' },
  { file: '62.mp3', col: 'O', num: 62, amharicScript: 'ኦ... ስልሳ ሁለት!', englishLabel: 'O-62' },
  { file: '63.mp3', col: 'O', num: 63, amharicScript: 'ኦ... ስልሳ ሶስት!', englishLabel: 'O-63' },
  { file: '64.mp3', col: 'O', num: 64, amharicScript: 'ኦ... ስልሳ አራት!', englishLabel: 'O-64' },
  { file: '65.mp3', col: 'O', num: 65, amharicScript: 'ኦ... ስልሳ አምስት!', englishLabel: 'O-65' },
  { file: '66.mp3', col: 'O', num: 66, amharicScript: 'ኦ... ስልሳ ስድስት!', englishLabel: 'O-66' },
  { file: '67.mp3', col: 'O', num: 67, amharicScript: 'ኦ... ስልሳ ሰባት!', englishLabel: 'O-67' },
  { file: '68.mp3', col: 'O', num: 68, amharicScript: 'ኦ... ስልሳ ስምንት!', englishLabel: 'O-68' },
  { file: '69.mp3', col: 'O', num: 69, amharicScript: 'ኦ... ስልሳ ዘጠኝ!', englishLabel: 'O-69' },
  { file: '70.mp3', col: 'O', num: 70, amharicScript: 'ኦ... ሰባ!', englishLabel: 'O-70' },
  { file: '71.mp3', col: 'O', num: 71, amharicScript: 'ኦ... ሰባ አንድ!', englishLabel: 'O-71' },
  { file: '72.mp3', col: 'O', num: 72, amharicScript: 'ኦ... ሰባ ሁለት!', englishLabel: 'O-72' },
  { file: '73.mp3', col: 'O', num: 73, amharicScript: 'ኦ... ሰባ ሶስት!', englishLabel: 'O-73' },
  { file: '74.mp3', col: 'O', num: 74, amharicScript: 'ኦ... ሰባ አራት!', englishLabel: 'O-74' },
  { file: '75.mp3', col: 'O', num: 75, amharicScript: 'ኦ... ሰባ አምስት!', englishLabel: 'O-75' }
];

export const addisAiEventPrompts: { file: string; amharicScript: string; englishLabel: string }[] = [
  { file: 'start.mp3', amharicScript: 'ጨዋታው በይፋ ተጀምሯል! መልካም እድል!', englishLabel: 'Game Start' },
  { file: 'solo_win.mp3', amharicScript: 'ቢንጎ! ቢንጎ! እንኳን ደስ አለዎት! ሙሉ ፖቱን አሸንፈዋል!', englishLabel: 'Bingo Solo Win' },
  { file: 'split_win.mp3', amharicScript: 'ቢንጎ! የጋራ አሸናፊዎች! ብሩ በእኩል ተከፋፍሏል!', englishLabel: 'Bingo Split Win' },
  { file: 'opp_win.mp3', amharicScript: 'ቢንጎ! አሸናፊ ተገኝቷል! ቀጣዩ ዙር አሁን ይጀምራል!', englishLabel: 'Opponent Win' },
  { file: 'one_to_go.mp3', amharicScript: 'አንድ ቁጥር ብቻ ቀርቷል! በርቱ!', englishLabel: '1 Ball to Go' }
];
