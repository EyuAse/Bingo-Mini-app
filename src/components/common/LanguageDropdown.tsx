import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '../../context/LanguageContext.tsx';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flagImg: string;
  country: string;
}

const languageOptions: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'EN',
    flagImg: '/assets/images/flag-et.png', // Default displays Ethiopian flag as shown in reference
    country: 'English'
  },
  {
    code: 'am',
    name: 'Amharic',
    nativeName: 'AM',
    flagImg: '/assets/images/flag-et.png',
    country: 'አማርኛ'
  }
];

interface LanguageDropdownProps {
  compact?: boolean;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = () => {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        <img
          src="/assets/images/flag-et.png"
          alt="Ethiopian Flag"
          className="real-flag-icon"
        />
        <span className="lang-code-bold">{lang.toUpperCase()}</span>
        <i className="fa-solid fa-chevron-down pill-chevron-mini"></i>
      </button>

      {isOpen && (
        <div className="custom-lang-menu-pop">
          <div
            className={`lang-option-row ${lang === 'en' ? 'selected' : ''}`}
            onClick={() => handleSelectLanguage('en')}
          >
            <img src="/assets/images/flag-us.png" alt="English" className="real-flag-mini" />
            <div className="lang-opt-labels">
              <span className="lang-opt-name">English</span>
              <span className="lang-opt-code">EN</span>
            </div>
            {lang === 'en' && <i className="fa-solid fa-check check-gold"></i>}
          </div>

          <div
            className={`lang-option-row ${lang === 'am' ? 'selected' : ''}`}
            onClick={() => handleSelectLanguage('am')}
          >
            <img src="/assets/images/flag-et.png" alt="Amharic" className="real-flag-mini" />
            <div className="lang-opt-labels">
              <span className="lang-opt-name">አማርኛ</span>
              <span className="lang-opt-code">AM</span>
            </div>
            {lang === 'am' && <i className="fa-solid fa-check check-gold"></i>}
          </div>
        </div>
      )}
    </div>
  );
};
