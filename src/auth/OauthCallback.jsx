import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function OauthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      console.error('No authorization code found in URL');
      navigate('/home');
      return;
    }

    const exchangeCode = async () => {
      try {
        const redirectUri =
          import.meta.env.VITE_OAUTH_REDIRECT_URI ||
          `${window.location.origin}/oauth/callback`;

        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'SUCCESS') {
            login({
              token: data.token,
              userId: data.userId,
              email: data.email,
              fullName: data.fullName,
            });
            localStorage.setItem('isNewUser', String(data.isNewUser));

            const from = location.state?.from?.pathname || '/home';
            navigate(from, { replace: true });
          } else {
            console.error('OAuth exchange error:', data.message);
            navigate('/home');
          }
        } else {
          console.error('OAuth token exchange failed');
          navigate('/home');
        }
      } catch (err) {
        console.error('OAuth exchange network failure:', err);
        navigate('/home');
      }
    };

    exchangeCode();
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
        Securing connection...
      </div>
      <div style={{ fontSize: '14px', color: '#a1a1aa' }}>
        Authenticating with Google OAuth2 and building workspace reports.
      </div>
    </div>
  );
}

