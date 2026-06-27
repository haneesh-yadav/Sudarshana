import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Intercept all fetch requests to inject JWT bearer token and handle 401 logouts
// API calls use a relative path (/api/...) so Vite's proxy forwards them to the backend server.
// For production deployments, set VITE_API_BASE_URL to the backend URL (e.g. https://api.yourdomain.com).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const originalFetch = window.fetch;

window.fetch = async (input, init) => {
  const token = localStorage.getItem('token');
  
  let targetInput = input;
  // Map relative /api/ paths to the full backend URL if VITE_API_BASE_URL is set
  if (API_BASE_URL && typeof input === 'string' && input.startsWith('/api/')) {
    targetInput = API_BASE_URL + input;
  }

  const isApiCall = typeof targetInput === 'string' && targetInput.includes('/api/');

  if (token && isApiCall) {
    init = init || {};
    init.headers = init.headers || {};
    
    if (init.headers instanceof Headers) {
      if (!init.headers.has('Authorization')) {
        init.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(init.headers)) {
      const hasAuth = init.headers.some(h => h[0].toLowerCase() === 'authorization');
      if (!hasAuth) {
        init.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      if (!init.headers['Authorization'] && !init.headers['authorization']) {
        init.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  const response = await originalFetch(targetInput, init);
    
    // Automatically trigger logout on API 401 errors
    if (response.status === 401 && isApiCall && !targetInput.includes('/api/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('selectedUserId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userFullName');
      localStorage.removeItem('isNewUser');
      
      window.dispatchEvent(new Event('tg-user-changed'));
      window.location.href = '/';
    }
    return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

