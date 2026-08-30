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
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    flagImg: '/assets/images/flag-et.png',
    country: 'Ethiopia'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flagImg: '/assets/images/flag-us.png',
    country: 'United States'
  }
];

interface LanguageDropdownProps {
  compact?: boolean;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ compact = false }) => {
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
    <div className={`custom-lang-dropdown ${compact ? 'compact' : ''}`} ref={dropdownRef}>
      {/* Trigger Button: Shows Real Country Flag Logo Image + Dropdown Arrow */}
      <button
        type="button"
        className={`lang-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title="Select Language / ቋንቋ ይምረጡ"
      >
        <img
          src={currentOption.flagImg}
          alt={currentOption.country}
          className="lang-flag-img"
        />
        <i className={`fa-solid fa-chevron-down lang-chevron ${isOpen ? 'rotate' : ''}`}></i>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="lang-dropdown-menu">
          <div className="lang-menu-header">Select Language / ቋንቋ ይምረጡ</div>
          {languageOptions.map(opt => {
            const isSelected = opt.code === lang;
            return (
              <div
                key={opt.code}
                className={`lang-option-row ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectLanguage(opt.code)}
              >
                <img src={opt.flagImg} alt={opt.country} className="option-flag-img" />
                <div className="option-text-group">
                  <span className="option-native-name">{opt.nativeName}</span>
                  <span className="option-en-name">{opt.name} ({opt.country})</span>
                </div>
                {isSelected && (
                  <i className="fa-solid fa-check option-check-icon"></i>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
