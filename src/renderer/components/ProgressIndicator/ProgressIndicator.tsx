import React from 'react';
import './ProgressIndicator.css';

export interface ProgressIndicatorProps {
  visible: boolean;
  message: string;
  details?: string;
  progress?: number; // 0-100, undefined = indeterminate
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  visible,
  message,
  details,
  progress
}) => {
  if (!visible) return null;

  return (
    <div className="progress-overlay">
      <div className="progress-modal">
        <div className="progress-spinner-container">
          {progress !== undefined ? (
            <div className="progress-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${progress}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">
                  {Math.round(progress)}%
                </text>
              </svg>
            </div>
          ) : (
            <div className="progress-spinner"></div>
          )}
        </div>
        <div className="progress-text">
          <div className="progress-message">{message}</div>
          {details && <div className="progress-details">{details}</div>}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
