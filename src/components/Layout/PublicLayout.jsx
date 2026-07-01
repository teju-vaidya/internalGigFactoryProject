import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import gigfactoryLogo from "../../assets/logo.png";
import "./PublicLayout.css";

export default function PublicLayout({ children }) {
  const navigate = useNavigate();
  const fetchPublicSettings = useAuthStore(state => state.fetchPublicSettings);
  const platformName = useAuthStore(state => state.platformName) || 'GigFactory';
  const termsUrl = useAuthStore(state => state.termsUrl);
  const privacyUrl = useAuthStore(state => state.privacyUrl);

  useEffect(() => {
    fetchPublicSettings();
  }, [fetchPublicSettings]);

  return (
    <div className="public-layout-container">
      {/* Premium Header */}
      <header className="public-header">
        <div className="public-header-inner ">
          <Link to="/public-projects" className="public-logo-container">
            <img src={gigfactoryLogo} alt="GigFactory Logo" className="public-logo-img" />
          </Link>

          <div className="public-header-actions">
            <Link to="/public-projects" className="public-nav-link">
              Browse Projects
            </Link>
            <button
              onClick={() => navigate("/")}
              className="public-login-btn"
            >
              <LogIn size={15} />
              <span className="btn-text">Login / Register</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="public-main-content">
        <div className="public-content-inner">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="public-footer-inner">
          <p>© {new Date().getFullYear()} {platformName}. All rights reserved.</p>
          <div className="public-footer-links">
            <a href={privacyUrl || "#"} target={privacyUrl ? "_blank" : undefined} rel="noopener noreferrer" className="public-footer-link">Privacy Policy</a>
            <span className="footer-separator">·</span>
            <a href={termsUrl || "#"} target={termsUrl ? "_blank" : undefined} rel="noopener noreferrer" className="public-footer-link">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
