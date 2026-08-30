import React from 'react';
import { useApp } from '../../context/AppContext.tsx';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  return (
    <div className={`bingo-toast ${toastMessage ? 'active' : ''}`} id="bingo-toast">
      {toastMessage}
    </div>
  );
};
