import React from 'react';
import { validateEthiopianPhone, formatEthiopianPhoneInput } from '../../services/ethiopianPhoneValidator';

interface EthiopianPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  showCarrierBadge?: boolean;
  id?: string;
}

export const EthiopianPhoneInput: React.FC<EthiopianPhoneInputProps> = ({
  value,
  onChange,
  placeholder = '091 123 4567',
  disabled = false,
  autoFocus = false,
  required = true,
  showCarrierBadge = true,
  id = 'ethiopian-phone-input'
}) => {
  const validation = validateEthiopianPhone(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatEthiopianPhoneInput(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="eth-phone-input-container">
      <div className={`eth-phone-input-box ${validation.isValid ? 'valid' : value ? 'invalid' : ''}`}>
        {/* Country Badge */}
        <div className="eth-flag-badge" title="Ethiopia (+251)">
          <span className="eth-flag-emoji">🇪🇹</span>
          <span className="eth-dial-code">+251</span>
        </div>

        {/* Input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          className="eth-phone-native-input"
        />

        {/* Carrier indicator Badge */}
        {showCarrierBadge && validation.carrier && (
          <div
            className={`eth-carrier-pill ${validation.carrier}`}
            title={`Detected Network: ${validation.carrierName}`}
          >
            <span className="carrier-dot"></span>
            <span className="carrier-label">{validation.carrierName}</span>
          </div>
        )}
      </div>

      {/* Validation / Helper Feedback */}
      {value && !validation.isValid && validation.errorMessage && (
        <span className="eth-phone-error-hint">
          <i className="fa-solid fa-circle-exclamation"></i> {validation.errorMessage}
        </span>
      )}
    </div>
  );
};
