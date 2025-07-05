import React, { useState, useEffect } from 'react';
import './AfterDarkMode.css';

/**
 * After Dark Mode - Easter Egg activated by 69 clicks
 * Enhanced animations, sultry transitions, and motivational quotes
 */
const AfterDarkMode = ({ isActive, onToggle, onExit }) => {
  const [sultryQuotes] = useState([
    "Your code is so clean... it's making me hot 🔥",
    "Refactor me like one of your French modules 💋",
    "Is that a debt-free status or are you just happy to see me? 😏",
    "Your commit history is longer than my attention span 💅",
    "Let's make this codebase... intimate 🌹",
    "I like my dependencies like I like my coffee... minimal ☕",
    "You had me at 'zero technical debt' 💕",
    "Your code architecture is... stimulating 🏗️",
    "Debt-free and loving it, baby 💃"
  ]);

  const [currentQuote, setCurrentQuote] = useState(0);
  const [showQuote, setShowQuote] = useState(false);

  useEffect(() => {
    if (isActive) {
      const quoteInterval = setInterval(() => {
        setShowQuote(true);
        setTimeout(() => setShowQuote(false), 4000);
        setCurrentQuote(prev => (prev + 1) % sultryQuotes.length);
      }, 8000);

      return () => clearInterval(quoteInterval);
    }
  }, [isActive, sultryQuotes.length]);

  if (!isActive) return null;

  return (
    <div className="after-dark-overlay">
      {/* Sultry Background Effects */}
      <div className="sultry-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Sultry Header */}
      <div className="after-dark-header">
        <h1 className="sultry-title">
          🌙 After Dark Mode 🌙
        </h1>
        <p className="sultry-subtitle">
          Where debt cleanup gets... intimate
        </p>
        
        <button 
          className="exit-button"
          onClick={onExit}
          title="Exit After Dark Mode"
        >
          ❌ Exit
        </button>
      </div>

      {/* Floating Motivational Quote */}
      {showQuote && (
        <div className="floating-quote">
          <div className="quote-bubble">
            💋 {sultryQuotes[currentQuote]}
          </div>
        </div>
      )}

      {/* Enhanced Debt Stats with Sultry Styling */}
      <div className="sultry-stats">
        <div className="stat-card sultry">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-label">Hotness Level</div>
            <div className="stat-value">BLAZING</div>
          </div>
        </div>

        <div className="stat-card sultry">
          <div className="stat-icon">💋</div>
          <div className="stat-content">
            <div className="stat-label">Code Appeal</div>
            <div className="stat-value">IRRESISTIBLE</div>
          </div>
        </div>

        <div className="stat-card sultry">
          <div className="stat-icon">🌹</div>
          <div className="stat-content">
            <div className="stat-label">Romance Level</div>
            <div className="stat-value">PASSIONATE</div>
          </div>
        </div>
      </div>

      {/* Sultry Action Buttons */}
      <div className="sultry-actions">
        <button className="sultry-button primary">
          💕 Seduce the Bugs Away
        </button>
        <button className="sultry-button secondary">
          🌙 Whisper Sweet Optimizations
        </button>
        <button className="sultry-button tertiary">
          💃 Dance with the Dependencies
        </button>
      </div>

      {/* Professional Mode Toggle */}
      <div className="mode-toggle">
        <button 
          className="professional-toggle"
          onClick={onToggle}
          title="Switch to Professional Mode"
        >
          👔 Professional Mode
        </button>
        <span className="mode-hint">
          Switch back to corporate-friendly UI
        </span>
      </div>

      {/* Background Music Controls (Visual Only) */}
      <div className="music-controls">
        <div className="now-playing">
          🎵 Now Playing: "Smooth Code Jazz - Debt-Free Nights"
        </div>
        <div className="music-buttons">
          <button className="music-btn">⏮️</button>
          <button className="music-btn">⏸️</button>
          <button className="music-btn">⏭️</button>
        </div>
      </div>

      {/* Sultry Footer */}
      <div className="sultry-footer">
        <p>
          "In the dark of night, when the commits are quiet and the PRs are merged,
          that's when real code magic happens... ✨"
        </p>
        <div className="signature">
          — The Debt Collector, After Hours
        </div>
      </div>
    </div>
  );
};

export default AfterDarkMode; 