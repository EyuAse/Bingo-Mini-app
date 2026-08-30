import React from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const NextCallSphere: React.FC = () => {
  const { currentCall, spherePop } = useBingo();

  return (
    <div className="sidebar-panel next-call-panel">
      <div className="sidebar-label">NEXT CALL</div>
      <div className={`next-call-sphere ${spherePop ? 'pop-anim' : ''}`} id="next-call-sphere">
        <div className="sphere-inner">
          <span className="next-call-number" id="next-call-num">
            {currentCall ? currentCall.num : '--'}
          </span>
        </div>
        <div className="sphere-glint"></div>
      </div>
      <div className="next-call-letter" id="next-call-label">
        {currentCall ? `${currentCall.col} ${currentCall.num}` : 'WAITING'}
      </div>
    </div>
  );
};
