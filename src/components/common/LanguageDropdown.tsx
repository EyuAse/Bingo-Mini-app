import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '../../context/LanguageContext.tsx';
import { EthiopiaFlag, UKFlag } from './FlagIcons.tsx';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flagIcon: React.ReactNode;
  country: string;
}

export const LanguageDropdown: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languageOptions: LanguageOption[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'EN',
      flagIcon: <UKFlag width={22} height={15} />,
      country: 'English'
    },
    {
      code: 'am',
      name: 'Amharic',
      nativeName: 'አማ',
      flagIcon: <EthiopiaFlag width={22} height={15} />,
      country: 'አማርኛ'
    }
  ];

  const currentOption = languageOptions.find(opt => opt.code === lang) || languageOptions[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: Language) => {
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div className="custom-lang-pill-container" ref={dropdownRef}>
      <button
        type="button"
        className="btn-custom-lang-pill"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Select Language"
      >
        <span className="real-flag-box">{currentOption.flagIcon}</span>
        <span className="lang-code-bold">{currentOption.nativeName}</span>
        <i className="fa-solid fa-chevron-down pill-chevron-mini"></i>
      </button>

      {isOpen && (
        <div className="custom-lang-menu-pop">
          {languageOptions.map(opt => (
            <div
              key={opt.code}
              className={`lang-option-row ${lang === opt.code ? 'selected' : ''}`}
              onClick={() => handleSelectLanguage(opt.code)}
            >
              <span className="real-flag-box">{opt.flagIcon}</span>
              <div className="lang-opt-labels">
                <span className="lang-opt-name">{opt.name}</span>
                <span className="lang-opt-code">{opt.country}</span>
              </div>
              {lang === opt.code && <i className="fa-solid fa-check check-gold"></i>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
