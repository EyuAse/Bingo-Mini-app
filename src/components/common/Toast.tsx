import React from 'react';
import { useApp } from '../../context/AppContext.tsx';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  // Determine message intent to provide the most helpful icon and color glow
  const lower = toastMessage.toLowerCase();
  let type: 'error' | 'warning' | 'success' | 'info' = 'info';
  let icon = 'fa-solid fa-circle-info';

  if (
    lower.includes('error') ||
    lower.includes('failed') ||
    lower.includes('insufficient') ||
    lower.includes('declined')
  ) {
    type = 'error';
    icon = 'fa-solid fa-circle-exclamation';
  } else if (
    lower.includes('warning') ||
    lower.includes('wait') ||
    lower.includes('too many') ||
    lower.includes('slow down') ||
    lower.includes('attempts') ||
    lower.includes('select') ||
    lower.includes('pick') ||
    lower.includes('caution') ||
    lower.includes('complete')
  ) {
    type = 'warning';
    icon = 'fa-solid fa-triangle-exclamation';
  } else if (
    lower.includes('win') ||
    lower.includes('success') ||
    lower.includes('placed') ||
    lower.includes('refund') ||
    lower.includes('joined') ||
    lower.includes('ready')
  ) {
    type = 'success';
    icon = 'fa-solid fa-circle-check';
  }

  return (
    <div
      className="bingo-toast-floating-container"
      id="bingo-toast"
      role="alert"
      aria-live="assertive"
    >
      <div className={`bingo-floating-toast-pill toast-type-${type}`}>
        <div className="toast-pill-icon-wrap">
          <i className={icon}></i>
        </div>
        <div className="toast-pill-msg-wrap">
          <span className="toast-pill-msg">{toastMessage}</span>
        </div>
      </div>
    </div>
  );
};
