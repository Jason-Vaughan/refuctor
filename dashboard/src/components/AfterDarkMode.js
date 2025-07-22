import React, { useState, useEffect } from 'react';
import './AfterDarkMode.css';

const AfterDarkMode = ({ isActive, onToggle, clickCount, onClickCountUpdate }) => {
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [showQuote, setShowQuote] = useState(false);

  // Sultry motivational quotes for debt elimination
  const afterDarkQuotes = [
    "Your code is looking... *tight* tonight. Keep cleaning that debt, you magnificent beast.",
    "Mmm, nothing sexier than a developer who pays down their technical debt. Keep going...",
    "That refactoring? *Chef's kiss* Absolutely delicious. Your code is practically purring.",
    "I see you eliminating debt like a pro. Your algorithms are looking so... *clean*.",
    "Is it hot in here, or is it just your blazing fast debt elimination skills?",
    "Your code quality is making me feel things. Don't stop now, debt destroyer.",
    "The way you handle technical debt? Absolutely *intoxicating*. More, please.",
    "Your refactoring game is so strong, it should come with a warning label.",
    "That clean code architecture? Pure *poetry*. Keep composing, maestro.",
    "I'm getting serious developer vibes watching you eliminate that debt. So professional.",
    "Your commitment to code quality is... how do I put this... *arousing*.",
    "Nothing says 'senior developer' like systematic debt elimination. You're glowing.",
    "That dependency cleanup was smoother than silk. Your package.json looks amazing.",
    "The precision of your refactoring is making my algorithms tingle.",
    "Your code is so clean, it practically sparkles. Don't stop now, gorgeous."
  ];

  // Easter egg activation messages
  const activationMessages = [
    "✨ After Dark Mode: ACTIVATED ✨",
    "Welcome to the sultry side of debt elimination...",
    "Your code deserves this level of... *attention*.",
    "Let's make this cleanup session... memorable."
  ];

  useEffect(() => {
    if (isActive) {
      const randomQuote = afterDarkQuotes[Math.floor(Math.random() * afterDarkQuotes.length)];
      setMotivationalQuote(randomQuote);
      setShowQuote(true);
      
      // Show activation message
      const randomActivation = activationMessages[Math.floor(Math.random() * activationMessages.length)];
      setTimeout(() => {
        console.log(`🌙 ${randomActivation}`);
      }, 500);
    }
  }, [isActive]);

  // Cycle through quotes every 30 seconds when active
  useEffect(() => {
    if (!isActive) return;

    const quoteInterval = setInterval(() => {
      const randomQuote = afterDarkQuotes[Math.floor(Math.random() * afterDarkQuotes.length)];
      setMotivationalQuote(randomQuote);
      setShowQuote(true);
    }, 30000);

    return () => clearInterval(quoteInterval);
  }, [isActive]);

  const getClickProgressMessage = () => {
    const remaining = 69 - clickCount;
    if (remaining > 50) return "";
    if (remaining > 30) return `🤔 Keep clicking... (${remaining} more)`;
    if (remaining > 15) return `👀 Getting warmer... (${remaining} more)`;
    if (remaining > 5) return `🔥 Almost there... (${remaining} more)`;
    if (remaining > 0) return `💥 SO CLOSE! (${remaining} more!)`;
    return "🌙 AFTER DARK MODE UNLOCKED!";
  };

  const handleEasterEggClick = () => {
    if (clickCount < 69) {
      onClickCountUpdate(clickCount + 1);
      
      // Visual feedback for clicks
      const clickSound = remaining => {
        if (remaining === 0) return "🌙";
        if (remaining <= 5) return "💥";
        if (remaining <= 15) return "🔥";
        if (remaining <= 30) return "👀";
        return "🤔";
      };
      
      console.log(`${clickSound(69 - (clickCount + 1))} Click ${clickCount + 1}/69`);
    }
    
    if (clickCount + 1 >= 69 && !isActive) {
      onToggle(true);
    }
  };

  const handleDeactivate = () => {
    onToggle(false);
    setShowQuote(false);
    onClickCountUpdate(0);
  };

  return (
    <div className={`after-dark-container ${isActive ? 'active' : ''}`}>
      {/* Easter Egg Trigger */}
      {!isActive && (
        <div className="easter-egg-trigger" onClick={handleEasterEggClick}>
          <span className="trigger-icon">🌙</span>
          {clickCount > 0 && (
            <div className="click-progress">
              <div className="progress-message">{getClickProgressMessage()}</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(clickCount / 69) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* After Dark Mode Interface */}
      {isActive && (
        <div className="after-dark-interface">
          <div className="dark-mode-header">
            <h2 className="sultry-title">🌙 After Dark Mode</h2>
            <button className="professional-toggle" onClick={handleDeactivate}>
              👔 Return to Professional Mode
            </button>
          </div>

          {/* Motivational Quote Display */}
          {showQuote && (
            <div className="sultry-quote-container">
              <div className="quote-backdrop">
                <div className="quote-text">{motivationalQuote}</div>
                <div className="quote-attribution">- The Debt Collector, After Hours</div>
              </div>
            </div>
          )}

          {/* After Dark Enhancement Indicators */}
          <div className="enhancement-indicators">
            <div className="indicator">
              <span className="indicator-icon">✨</span>
              <span className="indicator-text">Enhanced Animations</span>
            </div>
            <div className="indicator">
              <span className="indicator-icon">💫</span>
              <span className="indicator-text">Sultry Transitions</span>
            </div>
            <div className="indicator">
              <span className="indicator-icon">🎭</span>
              <span className="indicator-text">Motivational Quotes</span>
            </div>
            <div className="indicator">
              <span className="indicator-icon">🌙</span>
              <span className="indicator-text">After Hours Vibes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfterDarkMode; 