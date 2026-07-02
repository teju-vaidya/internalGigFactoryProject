import React, { useState } from 'react';
import { Wrench, RefreshCw, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import './Maintenance.css';

export default function Maintenance() {
  const platformName = useAuthStore(state => state.platformName) || 'GigFactory';
  const supportEmail = useAuthStore(state => state.supportEmail) || 'support@gigfactory.in';
  const maintenanceMessage = useAuthStore(state => state.maintenanceMessage) || "We're performing scheduled maintenance. We'll be back shortly.";
  const fetchPublicSettings = useAuthStore(state => state.fetchPublicSettings);
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    // Artificially delay a tiny bit for a satisfying UI transition
    await new Promise(r => setTimeout(r, 800));
    await fetchPublicSettings();
    setChecking(false);
  };

  return (
    <div className="maintenance-container">
      <div className="maintenance-card">
        <div className="maintenance-icon-wrap">
          <div className="maintenance-icon-glow" />
          <Wrench className="maintenance-gears gear-main" />
        </div>

        <div className="maintenance-status-badge">
          <span className="status-dot" />
          <span>Under Maintenance</span>
        </div>

        <h1 className="maintenance-title">{platformName} is Updating</h1>
        
        <p className="maintenance-message">
          {maintenanceMessage}
        </p>

        <button 
          className="maintenance-btn" 
          onClick={handleCheck}
          disabled={checking}
        >
          <RefreshCw size={16} className={checking ? 'spin-fast' : ''} />
          <span>{checking ? 'Checking status…' : 'Try Again'}</span>
        </button>

        <div className="maintenance-footer">
          <p>
            Need urgent help? Reach out to <a href={`mailto:${supportEmail}`}><Mail size={12} className="inline align-middle mr-1" />{supportEmail}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
