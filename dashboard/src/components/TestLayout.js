import React from 'react';
import './TestLayout.css';

const TestLayout = () => {
  return (
    <div className="test-container">
      {/* Top Panels Container */}
      <div className="test-top-panels">
        <div className="test-panel top-left-panel">Top Left Panel</div>
        <div className="test-panel top-right-panel">Top Right Panel</div>
      </div>

      {/* Bottom Panel with Buttons */}
      <div className="test-panel bottom-panel">
        <button className="test-button">Button 1</button>
        <button className="test-button">Button 2</button>
        <button className="test-button">Button 3</button>
        <button className="test-button">Button 4</button>
        <button className="test-button">Button 5</button>
      </div>
    </div>
  );
};

export default TestLayout; 