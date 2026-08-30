import React, { useState, useRef, useEffect } from 'react';

interface CountryOption {
  flag: string;
  code: string;
  name: string;
  placeholder: string;
}

const countries: CountryOption[] = [
  { flag: '🇪🇹', code: '+251', name: 'Ethiopia (+251)', placeholder: '911 234567' },
  { flag: '🇬🇧', code: '+44', name: 'United Kingdom (+44)', placeholder: '7123 456789' },
  { flag: '🇰🇪', code: '+254', name: 'Kenya (+254)', placeholder: '712 345678' },
  { flag: '🇳🇬', code: '+234', name: 'Nigeria (+234)', placeholder: '801 234 5678' },
  { flag: '🇺🇸', code: '+1', name: 'United States (+1)', placeholder: '555 123-4567' }
];

interface CountryPickerProps {
  onCountryChange: (country: CountryOption) => void;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({ onCountryChange }) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(countries[0]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSelect = (country: CountryOption) => {
    setSelectedCountry(country);
    onCountryChange(country);
    setIsOpen(false);
  };

  return (
    <div
      className="country-code-picker"
      id="country-code-picker"
      ref={pickerRef}
      onClick={() => setIsOpen(prev => !prev)}
    >
      <span className="country-flag" id="selected-flag">{selectedCountry.flag}</span>
      <span className="country-dial-code" id="selected-dial-code">{selectedCountry.code}</span>
      <i className="fa-solid fa-chevron-down country-chevron"></i>

      <div className={`country-dropdown ${isOpen ? 'active' : ''}`} id="country-dropdown">
        {countries.map(c => (
          <div
            key={c.code}
            className="country-option"
            data-flag={c.flag}
            data-code={c.code}
            onClick={e => {
              e.stopPropagation();
              handleSelect(c);
            }}
          >
            <span className="country-flag">{c.flag}</span>
            <span className="country-option-name">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
