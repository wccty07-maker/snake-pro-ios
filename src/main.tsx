import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Synchronize --app-height with actual viewport height on iOS / Android mobile screens
function setupViewportHeight() {
  const update = () => {
    const vh = Math.max(
      window.innerHeight || 0,
      document.documentElement.clientHeight || 0,
      window.visualViewport ? window.visualViewport.height : 0
    );
    if (vh > 0) {
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    }
  };
  update();
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('orientationchange', update, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', update, { passive: true });
  }
}
setupViewportHeight();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
