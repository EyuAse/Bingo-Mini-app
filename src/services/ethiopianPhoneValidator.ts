import { EthiopianCarrier } from '../types/auth';

export interface PhoneValidationResult {
  isValid: boolean;
  cleanInput: string;
  nationalNumber: string;    // e.g. "0911234567" or "0712345678"
  canonicalNumber: string;   // e.g. "+251911234567" or "+251712345678"
  formattedDisplay: string;  // e.g. "+251 91 123 4567" or "091 123 4567"
  carrier: EthiopianCarrier | null;
  carrierName: string;
  carrierColor: string;
  errorMessage?: string;
}

/**
 * Validates and normalizes Ethiopian mobile numbers.
 * Supports:
 * - Ethio Telecom: 09XXXXXXXX, 9XXXXXXXX, +2519XXXXXXXX
 * - Safaricom Ethiopia: 07XXXXXXXX, 7XXXXXXXX, +2517XXXXXXXX
 */
export function validateEthiopianPhone(input: string): PhoneValidationResult {
  if (!input) {
    return {
      isValid: false,
      cleanInput: '',
      nationalNumber: '',
      canonicalNumber: '',
      formattedDisplay: '',
      carrier: null,
      carrierName: '',
      carrierColor: '',
      errorMessage: 'Phone number is required.'
    };
  }

  // Strip all whitespace, dashes, parens, and plus signs
  let digits = input.replace(/\D/g, '');

  // If starts with 251, strip the country code
  if (digits.startsWith('251')) {
    digits = digits.substring(3);
  }

  // If starts with 0, strip leading 0 to inspect prefix
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // At this point, valid Ethiopian numbers are 9 digits long and start with 9 or 7
  let carrier: EthiopianCarrier | null = null;
  let carrierName = '';
  let carrierColor = '';

  if (digits.startsWith('9')) {
    carrier = 'ethiotelecom';
    carrierName = 'Ethio Telecom';
    carrierColor = '#00833e'; // Ethio Telecom Green
  } else if (digits.startsWith('7')) {
    carrier = 'safaricom';
    carrierName = 'Safaricom';
    carrierColor = '#e60000'; // Safaricom Red
  }

  const isValid = digits.length === 9 && (digits.startsWith('9') || digits.startsWith('7'));

  const nationalNumber = digits ? `0${digits}` : '';
  const canonicalNumber = digits ? `+251${digits}` : '';

  // Format display: e.g., 091 234 5678 or +251 91 234 5678
  let formattedDisplay = '';
  if (digits.length >= 2) {
    const p1 = digits.substring(0, 2);
    const p2 = digits.substring(2, 5);
    const p3 = digits.substring(5, 9);
    formattedDisplay = `0${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`;
  } else {
    formattedDisplay = digits ? `0${digits}` : '';
  }

  let errorMessage: string | undefined;
  if (!isValid && digits.length > 0) {
    if (!digits.startsWith('9') && !digits.startsWith('7')) {
      errorMessage = 'Must start with 09 (Ethio Telecom) or 07 (Safaricom).';
    } else if (digits.length < 9) {
      errorMessage = `Incomplete number (${digits.length}/9 digits).`;
    } else if (digits.length > 9) {
      errorMessage = 'Too many digits for an Ethiopian mobile number.';
    }
  }

  return {
    isValid,
    cleanInput: digits,
    nationalNumber,
    canonicalNumber,
    formattedDisplay,
    carrier,
    carrierName,
    carrierColor,
    errorMessage
  };
}

/**
 * Format raw digit input for live input field masking
 */
export function formatEthiopianPhoneInput(rawInput: string): string {
  const digits = rawInput.replace(/\D/g, '');
  
  // If user pasted or typed full international +251
  let core = digits;
  if (core.startsWith('251')) core = core.substring(3);
  if (core.startsWith('0')) core = core.substring(1);

  // Limit to max 9 digits
  core = core.slice(0, 9);

  if (core.length === 0) return '';
  if (core.length <= 2) return `0${core}`;
  if (core.length <= 5) return `0${core.slice(0, 2)} ${core.slice(2)}`;
  return `0${core.slice(0, 2)} ${core.slice(2, 5)} ${core.slice(5, 9)}`;
}
