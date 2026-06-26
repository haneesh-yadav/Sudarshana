import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';


/**
 * LandingPage.jsx
 * Public marketing page for Sudarshana, built from the exact same
 * component vocabulary as the in-app pages (Home/ThreadsPage/etc):
 * kpi cards, status pills, pill tabs, feed/quicklink rows, btn-primary
 * / btn-secondary. No invented design system -- same panel/border/radius
 * tokens, same flat-hover-only interaction model, no gradients or glow.
 *
 * Usage:
 *   import LandingPage from './LandingPage';
 *   <Route path="/" element={<LandingPage />} />
 */

const CAPABILITIES = [
  { iconName: "psychology", label: "Behavioral NLP risk scoring" },
  { iconName: "verified_user", label: "SPF / DKIM / DMARC enforcement", tone: "green" },
  { iconName: "link", label: "SHA-256 chain validation", tone: "purple" },
  { iconName: "bolt", label: "Real-time, no added latency", tone: "accent" },
];

const THREAT_POINTS = [
  {
    iconName: "person_search",
    title: "Conversation hijacking",
    desc: "Bad actors monitor or infiltrate compromised mail servers to locate ongoing, high-stakes threads with vendors, legal counsel, or executives.",
  },
  {
    iconName: "psychology_alt",
    title: "Psychological manipulation",
    desc: "Once embedded, attackers introduce subtle shifts â€” artificial urgency, authority exploitation, or sudden routing/wire number changes.",
  },
  {
    iconName: "block",
    title: "The security gap",
    desc: "Messages look like normal text and ride on existing trust, so SEGs trigger zero signature or link-based alarms.",
  },
];

const LAYERS = [
  {
    iconName: "psychology",
    tone: "accent",
    tag: "Layer 01",
    title: "Behavioral NLP",
    desc: "Custom-trained models flag relational anomalies â€” tone shifts, urgency spikes, and commands that depart from a sender's baseline.",
  },
  {
    iconName: "verified_user",
    tone: "green",
    tag: "Layer 02",
    title: "Header & protocol inspection",
    desc: "Maps the mail transport path beneath the client layer, enforcing SPF, DKIM, and DMARC alignment to catch spoofing.",
  },
  {
    iconName: "link",
    tone: "purple",
    tag: "Layer 03",
    title: "Cryptographic thread locking",
    desc: "Each reply is hash-chained to its predecessor with SHA-256, making the conversation history tamper-evident.",
  },
];

const FLOW_STEPS = [
  { step: "01", iconName: "forum", title: "Thread ingested" },
  { step: "02", iconName: "psychology", title: "NLP risk pass" },
  { step: "03", iconName: "fact_check", title: "Header guard" },
  { step: "04", iconName: "link", title: "Chain validated" },
  { step: "05", iconName: "shield", title: "Verdict issued" },
];

const ADVANTAGES = [
  { iconName: "shield", title: "Zero-trust communication", desc: "Extends zero-trust beyond network access, directly into the text layer of corporate workflows." },
  { iconName: "tune", title: "Reduced false positives", desc: "Linguistic, protocol, and cryptographic signal are combined so SOCs aren't drowned in ungrounded alerts." },
  { iconName: "cloud_done", title: "Seamless integration", desc: "Deploys as a cloud-native API alongside Microsoft 365 and Google Workspace, with no added latency." },
];

const FAQS = [
  { q: "How is this different from a Secure Email Gateway?", a: "SEGs scan for malicious links and attachments. Sudarshana inspects the systemic context of a conversation â€” behavior, protocol alignment, and historical lineage â€” catching hijacks that look like ordinary text." },
  { q: "Does it require changes to our mail infrastructure?", a: "No. Sudarshana deploys as a cloud-native API integration with Microsoft 365 and Google Workspace, sitting alongside your existing stack." },
  { q: "What happens when the cryptographic chain breaks?", a: "A break in the SHA-256 cascade triggers an immediate alert to the SOC queue, before any action is taken on the thread." },
];

function Icon({ name, className = "" }) {
  return <span className={"material-icons-round " + className} aria-hidden="true">{name}</span>;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   NAV ITEMS â€” matches the landing page sections
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const NAV_LINKS = [
  { label: "Platform",     href: "#platform"     },
  { label: "How it works", href: "#how-it-works"  },
  { label: "Advantages",   href: "#advantages"   },
  { label: "FAQ",          href: "#faq"           },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CSS â€” landing page dark tokens, Header.jsx layout
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const HEADER_CSS = `
  /* â”€â”€ Shared icon render â”€â”€ */
  .tgh-icon {
    font-family: 'Material Icons Round';
    font-weight: normal; font-style: normal; line-height: 1;
    display: inline-flex; align-items: center; justify-content: center;
    -webkit-font-smoothing: antialiased; user-select: none;
  }

  @keyframes tgh-menu-down {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  /* â”€â”€ Bar â”€â”€ */
  .tgh-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 2000;
    height: 68px;
    display: flex; align-items: center;
    padding: 0 32px;
    font-family: 'Poppins', sans-serif;
    background: transparent;
    border-bottom: 1px solid transparent;
    box-sizing: border-box;
    transition: background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease;
  }
  .tgh-nav.scrolled {
    background: rgba(13, 13, 15, 0.55);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-color: rgba(255,255,255,0.07);
  }

  /* â”€â”€ Brand / logo â€” left â”€â”€ */
  .tgh-brand {
    display: flex; align-items: center; gap: 11px;
    flex-shrink: 0; cursor: pointer;
    text-decoration: none; color: inherit;
  }
  .tgh-brand-mark {
    width: 34px; height: 34px; border-radius: 10px;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .tgh-brand-mark img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }
  .tgh-brand-name {
    font-size: 15.5px; font-weight: 700; color: #fff;
    letter-spacing: 0.015em; white-space: nowrap;
  }

  /* â”€â”€ Centre nav â”€â”€ */
  .tgh-nav-center {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 0;
  }
  .tgh-nav-link {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 8px 16px; border-radius: 8px;
    font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,0.72); text-decoration: none;
    background: none; border: none; cursor: pointer;
    font-family: 'Poppins', sans-serif;
    transition: color 0.15s ease, background 0.15s ease;
    white-space: nowrap; letter-spacing: 0.005em;
  }
  .tgh-nav-link:hover {
    color: #fff;
    background: rgba(255,255,255,0.06);
  }
  .tgh-nav-chevron {
    font-size: 16px !important;
    opacity: 0.55;
    transition: opacity 0.15s;
  }
  .tgh-nav-link:hover .tgh-nav-chevron { opacity: 0.85; }

  /* â”€â”€ Right CTAs â”€â”€ */
  .tgh-nav-cta {
    display: flex; align-items: center; gap: 10px;
    flex-shrink: 0; margin-left: auto;
  }
  .tgh-btn-secondary {
    display: inline-flex; align-items: center; gap: 7px;
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.25);
    font-family: 'Poppins', sans-serif; font-size: 13.5px; font-weight: 500;
    padding: 8px 20px; border-radius: 10px; cursor: pointer;
    text-decoration: none; white-space: nowrap;
    transition: background 0.15s ease, border-color 0.15s ease;
    letter-spacing: 0.01em;
  }
  .tgh-btn-secondary:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.4);
  }
  .tgh-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    background: #FAF9F5; color: #30302E;
    border: 1px solid #FAF9F5;
    font-family: 'Poppins', sans-serif; font-size: 13.5px; font-weight: 500;
    padding: 8px 20px; border-radius: 10px; cursor: pointer;
    text-decoration: none; white-space: nowrap;
    transition: opacity 0.15s ease, transform 0.1s ease;
    letter-spacing: 0.01em;
  }
  .tgh-btn-primary:hover  { opacity: 0.88; }
  .tgh-btn-primary:active { transform: scale(0.98); }
  .tgh-btn-secondary .tgh-icon,
  .tgh-btn-primary   .tgh-icon { font-size: 14px; }

  .tgh-hamburger-wrap {
    display: none;
  }
  @media (max-width: 900px) {
    .tgh-hamburger-wrap { display: block; margin-left: auto; position: relative; }
  }

  /* â”€â”€ Hamburger (mobile) â”€â”€ */
  .tgh-hamburger {
    display: none;
    background: none; border: none; cursor: pointer;
    padding: 0 4px; height: 68px;
    align-items: center; justify-content: center;
    margin-left: auto;
  }
  .tgh-ham-icon { display: flex; flex-direction: column; gap: 5px; align-items: flex-end; }
  .tgh-ham-icon span {
    display: block; height: 2px; background: #fff;
    border-radius: 2px; transition: all 0.25s ease;
  }
  .tgh-ham-icon span:nth-child(1) { width: 22px; }
  .tgh-ham-icon span:nth-child(2) { width: 15px; }
  .tgh-ham-icon span:nth-child(3) { width: 19px; }
  .tgh-ham-open span:nth-child(1) { width: 20px; transform: translateY(7px) rotate(45deg); }
  .tgh-ham-open span:nth-child(2) { opacity: 0; width: 0; }
  .tgh-ham-open span:nth-child(3) { width: 20px; transform: translateY(-7px) rotate(-45deg); }

  /* â”€â”€ Mobile dropdown menu â”€â”€ */
  .tgh-mobile-menu {
    position: absolute; top: 68px; right: 0; width: 230px;
    background: #18181b;
    border: 1px solid rgba(255,255,255,0.1);
    border-top: 2px solid rgba(255,255,255,0.3);
    border-radius: 0 0 14px 14px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.55);
    z-index: 9999; overflow: hidden;
    animation: tgh-menu-down 0.2s ease forwards;
  }
  .tgh-mobile-link {
    display: flex; align-items: center;
    width: 100%; background: none; border: none;
    padding: 13px 18px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.75);
    cursor: pointer; text-align: left; text-decoration: none;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    transition: background 0.15s, color 0.15s;
    box-sizing: border-box;
  }
  .tgh-mobile-link:hover { background: rgba(255,255,255,0.05); color: #fff; }
  .tgh-mobile-link:last-child { border-bottom: none; }
  .tgh-mobile-divider {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.08);
    margin: 4px 0;
  }
  .tgh-mobile-cta {
    display: flex; flex-direction: column; gap: 8px;
    padding: 12px 14px;
  }
  .tgh-mobile-btn-outline {
    display: flex; align-items: center; justify-content: center;
    background: none; border: 1px solid rgba(255,255,255,0.25);
    border-radius: 10px; padding: 10px 16px;
    font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 500;
    color: #fff; cursor: pointer; text-decoration: none;
    transition: border-color 0.15s, background 0.15s;
  }
  .tgh-mobile-btn-outline:hover { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); }
  .tgh-mobile-btn-filled {
    display: flex; align-items: center; justify-content: center;
    background: #FAF9F5; color: #30302E;
    border: none; border-radius: 10px; padding: 10px 16px;
    font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; text-decoration: none;
    transition: opacity 0.15s;
  }
  .tgh-mobile-btn-filled:hover { opacity: 0.88; }

  /* â”€â”€ Responsive â”€â”€ */
  @media (max-width: 900px) {
    .tgh-nav-center { display: none !important; }
    .tgh-nav-cta    { display: none !important; }
    .tgh-hamburger  { display: flex !important; }
  }
  @media (max-width: 480px) {
    .tgh-nav { padding: 0 20px; }
    .tgh-brand-name { font-size: 14px; }
  }
`;

function LandingHeader({ onTrySudarshana, onScrollToSection }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const menuRef   = useRef(null);
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = location.pathname === "/login" || location.pathname === "/signup";

  /* scroll listener â€” target the .tg-landing overflow container, not window */
  useEffect(() => {
    const container = document.querySelector(".tg-landing");
    if (!container) return;
    const onScroll = () => setScrolled(container.scrollTop > 5);
    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  /* close mobile menu on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* close mobile menu on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleAnchor = (href) => {
    setMobileOpen(false);
    if (onScrollToSection) {
      onScrollToSection(href);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{HEADER_CSS}</style>

      <nav
        className={`tgh-nav${scrolled ? " scrolled" : ""}`}
      >

        {/* â”€â”€ Brand â€” left â”€â”€ */}
        <Link to="/" className="tgh-brand">
          <span className="tgh-brand-mark">
            <img src="sudarshana.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
          </span>
          <span className="tgh-brand-name">Sudarshana</span>
        </Link>

        {/* â”€â”€ Centre nav â€” hidden on login/signup â”€â”€ */}
        {!isLoginPage && (
          <div className="tgh-nav-center">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                className="tgh-nav-link"
                onClick={() => handleAnchor(link.href)}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        {/* â”€â”€ Right CTAs (desktop) â”€â”€ */}
        <div className="tgh-nav-cta">
          {isLoginPage ? (
            /* Login page: only Back to Home */
            <button
              className="tgh-btn-secondary"
              onClick={() => navigate("/")}
            >
              <span className="tgh-icon" style={{ fontSize: "14px" }}>arrow_back</span>
              Back to Home
            </button>
          ) : (
            /* Landing page: Contact sales + Try Claude */
            <>
              <button className="tgh-btn-primary" onClick={onTrySudarshana}>
                Try Sudarshana
              </button>
            </>
          )}
        </div>

        {/* â”€â”€ Hamburger + mobile menu â”€â”€ */}
        <div ref={menuRef} className="tgh-hamburger-wrap">
          <button
            className="tgh-hamburger"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            <div className={`tgh-ham-icon${mobileOpen ? " tgh-ham-open" : ""}`}>
              <span /><span /><span />
            </div>
          </button>

          {mobileOpen && (
            <div className="tgh-mobile-menu">
              {!isLoginPage && NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  className="tgh-mobile-link"
                  onClick={() => handleAnchor(link.href)}
                >
                  {link.label}
                </button>
              ))}
              {!isLoginPage && <hr className="tgh-mobile-divider" />}
              <div className="tgh-mobile-cta">
                {isLoginPage ? (
                  <button
                    className="tgh-mobile-btn-outline"
                    onClick={() => { navigate("/"); setMobileOpen(false); }}
                  >
                    â† Back to Home
                  </button>
                ) : (
                  <>
                    <button className="tgh-mobile-btn-filled" onClick={() => { onTrySudarshana(); setMobileOpen(false); }}>
                      Try Sudarshana
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

      </nav>
    </>
  );
}


export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const emailRef = useRef(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [googleClientId, setGoogleClientId] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'password'
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [devEmailCopied, setDevEmailCopied] = useState(false);
  const [demoScene, setDemoScene] = useState(0); // 0: inbox triage, 1: settings, 2: thread integrity
  const [demoCycle, setDemoCycle] = useState(0); // bumps each time a scene re-enters, to restart its CSS animations

  // Looping hero demo â€” cycles through three product scenes
  useEffect(() => {
    const SCENE_DURATIONS = [5800, 5200, 6200]; // ms shown per scene
    let idx = 0;
    let timer = setTimeout(advance, SCENE_DURATIONS[idx]);
    function advance() {
      idx = (idx + 1) % SCENE_DURATIONS.length;
      setDemoScene(idx);
      setDemoCycle((c) => c + 1);
      timer = setTimeout(advance, SCENE_DURATIONS[idx]);
    }
    return () => clearTimeout(timer);
  }, []);

  const DEVELOPER_EMAIL = "haneeshrao619@gmail.com";

  const copyDeveloperEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(DEVELOPER_EMAIL).then(() => {
      setDevEmailCopied(true);
      setTimeout(() => setDevEmailCopied(false), 2000);
    });
  };

  useEffect(() => {
    fetch('http://localhost:8080/api/auth/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.clientId) setGoogleClientId(data.clientId);
      })
      .catch((err) => console.error('Failed to load auth configuration', err));
  }, []);

  const handleContinueEmail = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return;

    setCheckingEmail(true);
    try {
      const response = await fetch('http://localhost:8080/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setStep('password');
        } else {
          setError('Account not found, please create account');
        }
      } else {
        setError('Could not verify email. Please try again.');
      }
    } catch (err) {
      setError('Connection to backend failed. Please ensure the server is running.');
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
          localStorage.setItem('isNewUser', 'false');
          navigate('/home');
        } else {
          setError(data.message || 'Login failed');
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection to backend failed');
    }
  };

  const handleGoogleOAuth = () => {
    if (!googleClientId || googleClientId === 'your-client-id') {
      alert(
        'Google Client ID is not configured on the backend. Please define GOOGLE_CLIENT_ID in your application environment or application.yml.'
      );
      return;
    }

    const redirectUri =
      import.meta.env.VITE_OAUTH_REDIRECT_URI ||
      `${window.location.origin}/oauth/callback`;
    const scope =
      'https://mail.google.com/ https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline&prompt=consent`;

    window.location.href = authUrl;
  };

  const scrollToEmail = () => {
    if (!emailRef.current) return;
    const container = document.querySelector('.tg-landing');
    if (container && container.scrollTop > 10) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
      // Poll until scroll fully stops, then focus
      let lastScrollTop = container.scrollTop;
      let stableCount = 0;
      const checkDone = setInterval(() => {
        if (container.scrollTop === lastScrollTop) {
          stableCount++;
          if (stableCount >= 3) {
            clearInterval(checkDone);
            emailRef.current?.focus();
          }
        } else {
          lastScrollTop = container.scrollTop;
          stableCount = 0;
        }
      }, 50);
    } else {
      emailRef.current.focus();
    }
  };

  // Smooth-scroll any CSS selector into the .tg-landing overflow container
  const scrollToSection = (selector) => {
    const container = document.querySelector('.tg-landing');
    const el = document.querySelector(selector);
    if (!el) return;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elemRect = el.getBoundingClientRect();
      const NAV_HEIGHT = 68; // matches .tgh-nav height
      const targetTop = container.scrollTop + elemRect.top - containerRect.top - NAV_HEIGHT;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="tg-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');

        html, body {
          margin: 0;
          padding: 0;
          background: #0f0f11;
        }
        #root {
          background: #0f0f11;
        }

        .tg-landing{
          /* Public marketing page â€” intentionally NOT themeable. These
             variables are pinned to fixed dark values here so that the
             in-app Appearance (Light/Dark/System) setting, which
             overwrites these same variable names on :root, never
             changes how this page looks. */
          --bg: #0f0f11;
          --panel: #1c1c1e;
          --panel-2: rgba(255,255,255,0.04);
          --panel-3: rgba(255,255,255,0.08);
          --border: rgba(255,255,255,0.1);
          --border-2: rgba(255,255,255,0.14);
          --text: #ffffff;
          --text-dim: #c4c4c9;
          --text-dimmer: #9a9aa5;
          --accent: #eef0e4;
          --accent-dim: rgba(255,255,255,0.12);
          --radius-lg: 14px;
          --green: #74e08a;
          --green-bg: rgba(116,224,138,0.15);
          --orange: #f5a64d;
          --orange-bg: rgba(245,166,77,0.15);
          --purple: #a98ce8;
          --purple-bg: rgba(169,140,230,0.15);
          --red: #ef6a5f;
          --red-bg: rgba(239,106,95,0.15);

          background: var(--bg);
          color: var(--text);
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
          width: 100%;
          height: 100vh;
          margin: 0;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
          /* Firefox */
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.18) transparent;
        }

        /* â”€â”€ Custom scrollbar (Webkit / Blink) â”€â”€ */
        .tg-landing::-webkit-scrollbar {
          width: 6px;
        }
        .tg-landing::-webkit-scrollbar-track {
          background: transparent;
        }
        .tg-landing::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          transition: background 0.2s ease;
        }
        .tg-landing::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.38);
        }
        .tg-landing::-webkit-scrollbar-thumb:active {
          background: rgba(255, 255, 255, 0.55);
        }
        .tg-landing::-webkit-scrollbar-corner {
          background: transparent;
        }
        .tg-landing *{ box-sizing: border-box; }
        .tg-landing .material-icons-round{
          font-family: 'Material Icons Round';
          font-weight: normal;
          font-style: normal;
          display: inline-block;
          line-height: 1;
          text-transform: none;
          letter-spacing: normal;
          white-space: nowrap;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .shell{ max-width: 1120px; margin: 0 auto; padding: 0 24px; }

        /* ---------- shared chrome (copied 1:1 from app pages) ---------- */
        .panel-card{
          background: var(--panel, #1c1c1e);
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          border-radius: var(--radius-lg, 14px);
          padding: 20px;
        }
        .chart-title{ font-size:13.5px; font-weight:700; }
        .chart-sub{ font-size:11.5px; color: var(--text-dimmer, #9a9aa5); margin-top:3px; }
        .page-sub{ font-size:13px; color: var(--text-dimmer, #9a9aa5); }

        .btn-primary{
          background: var(--accent, #eef0e4); color:#111; border:none;
          font-family:inherit; font-size:13px; font-weight:600;
          padding:10px 18px; border-radius:999px; cursor:pointer;
          display:inline-flex; align-items:center; gap:7px; text-decoration:none;
        }
        .btn-secondary{
          background: var(--panel-3, rgba(255,255,255,0.08));
          color: var(--text, #fff);
          border: 1px solid var(--border-2, rgba(255,255,255,0.14));
          font-family:inherit; font-size:13px; font-weight:600;
          padding:10px 18px; border-radius:999px; cursor:pointer;
          display:inline-flex; align-items:center; gap:7px; text-decoration:none;
        }
        .btn-primary:hover{ opacity:.92; }
        .btn-secondary:hover{ background: var(--panel-2, rgba(255,255,255,0.04)); }
        .btn-primary .material-icons-round, .btn-secondary .material-icons-round{ font-size:14px; }

        .tag-pill{
          display:inline-flex; align-items:center; gap:6px;
          background: var(--panel, #1c1c1e); border:1px solid var(--border, rgba(255,255,255,0.1));
          color: var(--text-dim, #c4c4c9); font-size:12px; font-weight:600;
          padding:6px 12px; border-radius:999px;
        }
        .tag-pill .material-icons-round{ font-size:13px; color: var(--accent, #eef0e4); }

        .status-pill{ font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px; white-space:nowrap; }
        .status-pill.verified{ background: var(--green-bg, rgba(116,224,138,0.15)); color: var(--green, #74e08a); }
        .status-pill.flagged{ background: var(--orange-bg, rgba(245,166,77,0.15)); color: var(--orange, #f5a64d); }
        .status-pill.quarantined{ background: var(--purple-bg, rgba(169,140,230,0.15)); color: var(--purple, #a98ce8); }
        .status-pill.critical{ background: var(--red-bg, rgba(239,106,95,0.15)); color: var(--red, #ef6a5f); }

        /* ---------- hero ---------- */
        .hero{ padding: 104px 0 56px; }
        .hero-inner{
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 48px;
        }
        .hero-left{ display:flex; flex-direction:column; align-items:center; }
        .hero h1{
          font-size: 42px; line-height:1.2; font-weight:700; letter-spacing:-0.02em;
          margin: 18px 0 24px; text-align:center;
          color: var(--text, #ffffff);
        }
        .hero p.lead{
          font-size: 14.5px; line-height:1.65; color: var(--text-dim, #c4c4c9);
          margin: 0 0 28px; text-align:center;
        }
        .hero-actions{ display:flex; align-items:center; gap:12px; margin-bottom: 0; }

        /* sign-in box */
        .hero-signin-box{
          display: flex; flex-direction: column; gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          padding: 16px;
          width: 100%; max-width: 380px;
        }
        .hero-google-btn{
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 10px;
          padding: 12px 18px;
          font-family: 'Poppins', sans-serif; font-size: 13.5px; font-weight: 600;
          color: #fff; text-decoration: none; cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .hero-google-btn:hover{ background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.22); }
        .hero-signin-or{
          display: flex; align-items: center; justify-content: center;
          font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.35);
          letter-spacing: 0.04em; padding: 2px 0;
        }
        .hero-email-input{
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 12px 16px;
          font-family: 'Poppins', sans-serif; font-size: 13px;
          color: #fff; outline: none; width: 100%;
          transition: border-color 0.15s;
        }
        .hero-email-input::placeholder{ color: rgba(255,255,255,0.28); }
        .hero-email-input:focus{ border-color: rgba(255,255,255,0.3); }
        .hero-email-input:-webkit-autofill,
        .hero-email-input:-webkit-autofill:hover,
        .hero-email-input:-webkit-autofill:focus{
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0 1000px rgba(255,255,255,0.05) inset;
          caret-color: #fff;
        }
        .hero-email-btn{
          display: flex; align-items: center; justify-content: center;
          background: #fff; color: #111;
          border-radius: 10px;
          padding: 12px 18px;
          font-family: 'Poppins', sans-serif; font-size: 13.5px; font-weight: 600;
          text-decoration: none; cursor: pointer;
          transition: opacity 0.15s;
        }
        .hero-email-btn:hover{ opacity: 0.88; }

        /* problem section actions */
        .problem-actions{ display:flex; align-items:center; gap:12px; margin-top: 24px; justify-content: center; }

        /* video panel */
        .hero-right{
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          background: #1c1c1e;
          aspect-ratio: 16/13.5;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-video-inner{
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 14px;
        }
        .hero-video-play{
          width: 52px; height: 52px; border-radius: 999px;
          background: rgba(255,255,255,0.1);
          border: 1.5px solid rgba(255,255,255,0.18);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.18s;
        }
        .hero-video-play:hover{ background: rgba(255,255,255,0.16); }
        .hero-video-play .material-icons-round{ font-size: 22px; color: #fff; }
        .hero-video-label{ font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: 0.02em; }

        /* mock UI inside video panel */
        .hero-mock{
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          background: #141416;
          font-family: 'Poppins', sans-serif;
        }
        .hero-mock-bar{
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: #1c1c1e;
          flex-shrink: 0;
        }
        .hero-mock-dot{ width:8px; height:8px; border-radius:999px; }
        .hero-mock-title{ font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.55); margin-left: 4px; }
        .hero-mock-badge{
          margin-left: auto; font-size: 10px; font-weight: 600;
          padding: 2px 8px; border-radius: 999px;
          background: rgba(239,106,95,0.18); color: #ef6a5f;
        }
        .hero-mock-body{ flex: 1; padding: 14px; display: flex; flex-direction: column; gap: 9px; overflow: hidden; }
        .hero-mock-row{
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 10px 12px;
        }
        .hero-mock-row.flagged{ border-color: rgba(239,106,95,0.25); background: rgba(239,106,95,0.06); }
        .hero-mock-avatar{
          width: 24px; height: 24px; border-radius: 999px; flex-shrink: 0;
          background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.5);
        }
        .hero-mock-meta{ flex:1; min-width:0; }
        .hero-mock-sender{ font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,0.75); }
        .hero-mock-snippet{ font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hero-mock-risk{
          font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px;
          flex-shrink: 0; align-self: center;
        }
        .hero-mock-risk.ok{ background: rgba(116,224,138,0.15); color: #74e08a; }
        .hero-mock-risk.warn{ background: rgba(245,166,77,0.15); color: #f5a64d; }
        .hero-mock-risk.crit{ background: rgba(239,106,95,0.18); color: #ef6a5f; }
        .hero-mock-alert{
          display: flex; align-items: center; gap: 8px;
          padding: 9px 12px; border-radius: 10px;
          background: rgba(239,106,95,0.1); border: 1px solid rgba(239,106,95,0.28);
          margin-top: auto; flex-shrink: 0;
        }
        .hero-mock-alert .material-icons-round{ font-size: 14px; color: #ef6a5f; }
        .hero-mock-alert-text{ font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,0.7); }
        .hero-mock-overlay{
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.38);
          cursor: pointer;
          transition: background 0.18s;
        }
        .hero-mock-overlay:hover{ background: rgba(0,0,0,0.28); }
        .hero-mock-play{
          width: 52px; height: 52px; border-radius: 999px;
          background: rgba(255,255,255,0.12);
          border: 1.5px solid rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center;
        }
        .hero-mock-play .material-icons-round{ font-size: 24px; color: #fff; }

        /* ---------- animated demo (replaces static play overlay) ---------- */
        .hero-mock-live{
          margin-left: auto; display:flex; align-items:center; gap:5px;
          font-size: 9.5px; font-weight: 700; letter-spacing: .04em;
          color: rgba(116,224,138,0.85);
        }
        .hero-mock-live-dot{
          width:5px; height:5px; border-radius:999px; background:#74e08a;
          animation: tgh-live-pulse 1.6s ease-in-out infinite;
        }
        @keyframes tgh-live-pulse{
          0%,100%{ opacity: 1; box-shadow: 0 0 0 0 rgba(116,224,138,0.5); }
          50%{ opacity: .45; box-shadow: 0 0 0 3px rgba(116,224,138,0); }
        }

        .hero-mock-ticker{
          display:flex; flex-direction:column; gap:6px;
          padding-bottom: 10px; margin-bottom: 4px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink:0;
        }
        .hero-mock-ticker-row{
          display:flex; align-items:center; gap:8px;
          font-size: 10.5px; color: rgba(255,255,255,0.32);
          opacity: 0;
          animation: tgh-step-in 0.4s ease forwards;
        }
        .hero-mock-ticker-row.done{ color: rgba(255,255,255,0.55); }
        .hero-mock-ticker-icon{
          width:14px; height:14px; border-radius:999px; flex-shrink:0;
          border: 1.5px solid rgba(255,255,255,0.22);
          display:flex; align-items:center; justify-content:center;
          position: relative;
        }
        .hero-mock-ticker-row.active .hero-mock-ticker-icon{
          border-color: rgba(245,166,77,0.7);
          animation: tgh-spin 0.9s linear infinite;
          border-top-color: transparent;
        }
        .hero-mock-ticker-row.done .hero-mock-ticker-icon{
          border-color: #74e08a; background: rgba(116,224,138,0.15);
        }
        .hero-mock-ticker-icon .material-icons-round{ font-size: 9px; color: #74e08a; }
        @keyframes tgh-spin{ to{ transform: rotate(360deg); } }
        @keyframes tgh-step-in{
          from{ opacity: 0; transform: translateY(3px); }
          to{ opacity: 1; transform: translateY(0); }
        }

        .hero-mock-rows{ display:flex; flex-direction:column; gap:9px; flex:1; min-height:0; }
        .hero-mock-row{
          opacity: 0;
          animation: tgh-row-in 0.45s ease forwards;
        }
        @keyframes tgh-row-in{
          from{ opacity: 0; transform: translateX(8px); }
          to{ opacity: 1; transform: translateX(0); }
        }
        .hero-mock-risk{
          opacity: 0;
          animation: tgh-badge-pop 0.35s cubic-bezier(.34,1.56,.64,1) forwards;
        }
        @keyframes tgh-badge-pop{
          from{ opacity: 0; transform: scale(0.4); }
          to{ opacity: 1; transform: scale(1); }
        }
        .hero-mock-row.flagged{
          animation: tgh-row-in 0.45s ease forwards, tgh-flag-glow 1.4s ease-in-out 2.1s 2;
        }
        @keyframes tgh-flag-glow{
          0%,100%{ box-shadow: 0 0 0 0 rgba(239,106,95,0); }
          50%{ box-shadow: 0 0 0 3px rgba(239,106,95,0.18); }
        }
        .hero-mock-alert{
          opacity: 0;
          animation: tgh-alert-in 0.4s ease forwards;
        }
        @keyframes tgh-alert-in{
          from{ opacity: 0; transform: translateY(6px); }
          to{ opacity: 1; transform: translateY(0); }
        }
        .hero-mock-alert .material-icons-round.pulse{
          animation: tgh-live-pulse 1s ease-in-out infinite;
        }

        /* ---------- scene indicator dots ---------- */
        .hero-mock-scenedots{
          display:flex; align-items:center; gap:5px; margin-left: 8px;
        }
        .hero-mock-scenedot{
          width:5px; height:5px; border-radius:999px;
          background: rgba(255,255,255,0.18);
          transition: background .25s ease, width .25s ease;
        }
        .hero-mock-scenedot.active{ background: rgba(255,255,255,0.65); width:13px; border-radius:999px; }

        /* ---------- settings scene ---------- */
        .hero-mock-tabs{
          display:flex; align-items:center; gap:4px;
          padding-bottom: 10px; margin-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .hero-mock-tab{
          font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.32);
          padding: 5px 9px; border-radius: 7px;
          opacity: 0; animation: tgh-step-in 0.35s ease forwards;
        }
        .hero-mock-tab.active{ background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); }
        .hero-mock-setting-row{
          display:flex; align-items:center; justify-content: space-between;
          padding: 9px 2px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          opacity: 0; animation: tgh-row-in 0.4s ease forwards;
        }
        .hero-mock-setting-label{ font-size: 11px; color: rgba(255,255,255,0.7); font-weight: 500; }
        .hero-mock-setting-sub{ font-size: 9.5px; color: rgba(255,255,255,0.32); margin-top: 2px; }
        .hero-mock-switch{
          width: 30px; height: 17px; border-radius: 999px; flex-shrink: 0;
          background: rgba(255,255,255,0.12); position: relative;
          transition: background 0.3s ease;
        }
        .hero-mock-switch::after{
          content:''; position:absolute; top:2px; left:2px;
          width: 13px; height: 13px; border-radius: 999px; background: #fff;
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
        }
        .hero-mock-switch.on{ background: #74e08a; }
        .hero-mock-switch.on::after{ transform: translateX(13px); }
        .hero-mock-switch.anim-on{
          animation: tgh-switch-on 0.3s ease forwards;
        }
        @keyframes tgh-switch-on{
          from{ background: rgba(255,255,255,0.12); }
          to{ background: #74e08a; }
        }

        /* ---------- thread integrity scene ---------- */
        .hero-mock-thread-head{
          display:flex; flex-direction:column; gap:3px; flex-shrink:0;
          padding-bottom: 10px; margin-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .hero-mock-thread-subject{ font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); }
        .hero-mock-thread-meta{ font-size: 9.5px; color: rgba(255,255,255,0.35); }
        .hero-mock-hashline{
          display:flex; align-items:center; gap: 0; margin: 14px 0 8px;
        }
        .hero-mock-hash-node{
          width: 16px; height: 16px; border-radius: 999px; flex-shrink: 0;
          background: rgba(116,224,138,0.18); border: 1.5px solid #74e08a;
          opacity: 0; animation: tgh-badge-pop 0.3s cubic-bezier(.34,1.56,.64,1) forwards;
        }
        .hero-mock-hash-node.bad{ background: rgba(239,106,95,0.18); border-color: #ef6a5f; }
        .hero-mock-hash-link{
          width: 26px; height: 2px; background: #74e08a; flex-shrink: 0;
          opacity: 0; animation: tgh-step-in 0.25s ease forwards;
        }
        .hero-mock-hash-link.bad{ background: #ef6a5f; }
        .hero-mock-hash-caption{
          font-size: 10.5px; color: rgba(255,255,255,0.4); line-height: 1.55;
          opacity: 0; animation: tgh-alert-in 0.4s ease forwards;
        }
        .hero-mock-thread-msgs{ display:flex; flex-direction:column; gap:8px; margin-top: 12px; }
        .hero-mock-thread-msg{
          display:flex; align-items:flex-start; gap:8px;
          opacity: 0; animation: tgh-row-in 0.4s ease forwards;
        }
        .hero-mock-thread-msg-dot{
          width:7px; height:7px; border-radius:999px; margin-top: 4px; flex-shrink: 0;
          background: #74e08a;
        }
        .hero-mock-thread-msg-dot.bad{ background: #ef6a5f; }
        .hero-mock-thread-msg-text{ font-size: 10.5px; color: rgba(255,255,255,0.55); line-height: 1.4; }
        .hero-mock-thread-msg-text b{ color: rgba(255,255,255,0.8); }

        @media (max-width: 900px){
          .hero-inner{ grid-template-columns: 1fr; gap: 36px; }
          .hero h1{ font-size: 34px; }
          .hero-right{ aspect-ratio: 16/19; }
        }
        @media (max-width: 560px){
          .hero h1{ font-size: 28px; }
        }

        /* ---------- kpi strip (identical to Home.jsx) ---------- */
        .kpi-strip{ display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; }
        .kpi-card{ background: var(--panel, #1c1c1e); border:1px solid var(--border, rgba(255,255,255,0.1)); border-radius: var(--radius-lg, 14px); padding:16px; }
        .kpi-top{ display:flex; align-items:center; gap:8px; color: var(--text-dimmer, #9a9aa5); font-size:11.5px; font-weight:500; }
        .kpi-icon{ width:26px; height:26px; border-radius:8px; background: var(--panel-3, rgba(255,255,255,0.08)); display:flex; align-items:center; justify-content:center; color: var(--text-dim, #c4c4c9); flex-shrink:0; }
        .kpi-icon .material-icons-round{ font-size:14px; }
        .kpi-icon.red{ background: var(--red-bg, rgba(239,106,95,0.15)); color: var(--red, #ef6a5f); }
        .kpi-icon.green{ background: var(--green-bg, rgba(116,224,138,0.15)); color: var(--green, #74e08a); }
        .kpi-icon.accent{ background: var(--accent-dim, rgba(255,255,255,0.12)); color: var(--accent, #eef0e4); }
        .kpi-value{ font-size:22px; font-weight:700; margin-top:14px; letter-spacing:-0.01em; }
        .kpi-label{ font-size:11.5px; color: var(--text-dimmer, #9a9aa5); margin-top:3px; }
        .cap-card{ display:flex; align-items:center; gap:10px; }
        .cap-card .kpi-icon{ flex-shrink:0; }
        .cap-label{ font-size:12.5px; font-weight:600; color: var(--text, #fff); line-height:1.4; }
        @media (max-width: 760px){ .kpi-strip{ grid-template-columns: repeat(2, 1fr); } }

        /* ---------- section ---------- */
        .section{ padding: 56px 0; border-top: 1px solid var(--border, rgba(255,255,255,0.1)); scroll-margin-top: 68px; }
        .section-head{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:10px; margin: 0 auto 32px; max-width: 620px; }
        .section-head h2{ font-size: 26px; font-weight:700; letter-spacing:-0.01em; margin: 6px 0 0; color: var(--text, #ffffff); }
        .section-head p{ font-size:13.5px; color: var(--text-dim, #c4c4c9); margin: 4px 0 0; max-width: 480px; }
        .section-head .status-pill{ margin-top: 4px; }

        /* ---------- threat / problem section redesigned ---------- */
        .problem-header {
          font-family: 'Poppins', sans-serif;
          font-size: 56px;
          font-weight: 400;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin: 0 0 40px;
          line-height: 1.15;
          display: flex;
          flex-direction: column;
          text-align: right;
        }

        .problem-top-split {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 64px;
          align-items: flex-start;
          margin-top: 16px;
          margin-bottom: 60px;
        }
        .problem-left-illust {
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          margin-top: -120px;
        }
        .problem-right-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .problem-right-content p {
          font-family: 'Poppins', sans-serif;
          font-size: 15.5px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 32px;
        }
        .btn-white-pill {
          background: #ffffff;
          color: #111111;
          border: none;
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          padding: 11px 26px;
          border-radius: 999px;
          cursor: pointer;
          transition: opacity 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .btn-white-pill:hover {
          opacity: 0.92;
        }
        .btn-white-pill svg {
          stroke: currentColor;
          fill: none;
        }
        
        .problem-three-cols {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          text-align: left;
          margin-top: 0px;
        }
        .problem-col {
          border-left: 1px solid rgba(255, 255, 255, 0.12);
          padding-left: 32px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .problem-col-icon {
          font-size: 28px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .problem-col-icon svg {
          stroke: currentColor;
          fill: none;
        }
        .problem-col-title {
          font-family: 'Poppins', sans-serif;
          font-size: 19px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 14px;
        }
        .problem-col-desc {
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.45);
        }
        
        @media (max-width: 900px) {
          .problem-header {
            font-size: 34px;
            margin-bottom: 24px;
            text-align: left;
          }
          .problem-top-split {
            grid-template-columns: 1fr;
            gap: 36px;
            margin-bottom: 48px;
          }
          .problem-left-illust {
            justify-content: center;
            margin-top: 0;
          }
          .problem-three-cols {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .problem-col {
            border-left: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-left: 0;
            padding-top: 24px;
          }
        }

        /* ---------- layer rows ---------- */
        .layers-list{
          display: flex;
          flex-direction: column;
          padding: 16px 0;
        }
        .layer-row{
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 48px;
          align-items: center;
          padding: 40px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .layer-row-left{
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .layer-row-icon{
          font-size: 24px;
          color: rgba(255,255,255,0.55);
          flex-shrink: 0;
        }
        .layer-row-left h3{
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          color: #fff;
          line-height: 1.3;
        }
        .layer-row-right{
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          gap: 18px;
        }
        .layer-row-right p{
          font-size: 14.5px;
          color: rgba(255,255,255,0.55);
          line-height: 1.7;
          margin: 0;
          text-align: left;
        }
        @media (max-width: 860px){
          .layer-row{
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 28px 0;
          }
        }

        /* ---------- platform banner ---------- */
        .platform-banner{
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 48px;
          padding: 64px 0 56px;
        }
        .platform-banner-left{
          text-align: left;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-left: -32px;
        }
        .platform-banner-left h2{
          font-size: 42px; font-weight: 700; letter-spacing: -0.02em;
          line-height: 1.15; margin: 0 0 16px; color: #fff;
          text-align: left;
        }
        .platform-banner-left p{
          font-size: 15px; color: rgba(255,255,255,0.55);
          line-height: 1.65; margin: 0 0 28px; max-width: 580px;
          text-align: left;
        }
        .platform-banner-actions{
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-start;
        }
        .platform-banner-right{
          display: flex; align-items: center; justify-content: center;
          position: relative; height: 220px;
        }
        /* decorative shapes */
        .plat-shape-circle{
          width: 110px; height: 110px; border-radius: 999px;
          background: #c1644a;
          position: absolute; top: 20px; right: 120px;
          display: flex; align-items: center; justify-content: center;
        }
        .plat-shape-square{
          width: 85px; height: 85px; border-radius: 14px;
          background: #c1644a;
          position: absolute; bottom: 20px; right: 60px;
        }
        .plat-connector{
          position: absolute; top: 68px; right: 88px;
          width: 120px; height: 100px;
          pointer-events: none;
        }
        .plat-squiggle{
          position: absolute; right: 0; top: 10px; bottom: 10px;
          width: 80px;
          pointer-events: none;
        }
        @media (max-width: 860px){
          .platform-banner{ grid-template-columns: 1fr; }
          .platform-banner-right{ display: none; }
          .platform-banner-left h2{ font-size: 32px; }
          .platform-banner-left{ margin-left: -16px; }
        }

        /* ---------- formula strip ---------- */
        .formula-row{
          margin-top: 12px; display:flex; align-items:center; justify-content:center; gap:12px; text-align:center;
          background: var(--panel, #1c1c1e); border:1px solid var(--border, rgba(255,255,255,0.1));
          border-radius: var(--radius-lg, 14px); padding:14px 16px;
        }
        .formula-row .material-icons-round{ font-size:16px; color: var(--purple, #a98ce8); flex-shrink:0; }
        .formula-code{ font-size:12.5px; font-weight:600; color: var(--text, #fff); }
        .formula-note{ font-size:11.5px; color: var(--text-dimmer, #9a9aa5); margin-top:2px; }

        /* ---------- how it works mind map ---------- */
        .how-inner{
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 64px;
          align-items: stretch;
        }
        .how-left-steps{
          display: flex;
          flex-direction: column;
          gap: 40px;
          justify-content: center;
        }
        .how-step-item{
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 32px;
        }
        .how-step-item:last-child{
          border-bottom: none;
          padding-bottom: 0;
        }
        .how-step-title{
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        .how-step-title .material-icons-round{
          font-size: 18px;
          color: var(--accent, #eef0e4);
        }
        .how-step-desc{
          font-size: 13.5px;
          color: rgba(255,255,255,0.55);
          line-height: 1.65;
        }
        .how-right-map{
          position: relative;
          height: 520px;
          background: rgba(255,255,255,0.01);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .map-center{
          position: absolute;
          left: 55%; top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1c1c1e;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 8px 16px;
          z-index: 10;
        }
        .map-center img{
          width: 22px; height: 22px;
          object-fit: cover;
          border-radius: 6px;
        }
        .map-center-text{
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
        }
        .map-category{
          position: absolute;
          transform: translate(-50%, -50%);
          font-size: 13.5px;
          font-weight: 700;
          color: #fff;
          z-index: 5;
          white-space: nowrap;
        }
        .map-node{
          position: absolute;
          transform: translate(-50%, -50%);
          font-size: 11.5px;
          color: rgba(255,255,255,0.45);
          z-index: 2;
          white-space: nowrap;
          transition: color 0.2s ease;
        }
        .map-node:hover{
          color: #fff;
        }
        @media (max-width: 900px){
          .how-inner{ grid-template-columns: 1fr; gap: 40px; }
          .how-right-map{ height: 420px; }
          .map-center{ left: 50%; }
        }

        /* ---------- advantages (cards grid pattern) ---------- */
        .advantages-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 40px;
        }
        .advantage-card {
          display: flex;
          flex-direction: column;
          background: #1c1c1e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          overflow: hidden;
          transition: transform 0.25s ease, border-color 0.25s ease;
          text-align: left;
        }
        .advantage-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }
        .card-top {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .card-top.bg-purple { background: #857bb5; }
        .card-top.bg-orange { background: #d87453; }
        .card-top.bg-blue   { background: #6395c4; }
        .card-bottom {
          padding: 28px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .card-date {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
          font-weight: 500;
        }
        .card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 16.5px;
          font-weight: 600;
          line-height: 1.45;
          color: #ffffff;
          margin-bottom: 24px;
          flex-grow: 1;
        }
        .card-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 16px;
        }
        .card-footer-icon {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }
        .card-footer-icon .material-icons-round {
          font-size: 16px;
        }

        @media (max-width: 900px) {
          .advantages-cards-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .card-top {
            height: 180px;
          }
        }

        /* ---------- integrations ---------- */
        .integrations-panel {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          background: #1c1c1e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          overflow: hidden;
          align-items: stretch;
          margin-top: 24px;
        }
        .integrations-left {
          background: #2b2c27;
          padding: 48px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: center;
          justify-items: center;
        }
        .integrations-logo-card {
          width: 76px;
          height: 76px;
          background: #ffffff;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transition: transform 0.2s ease;
        }
        .integrations-right {
          padding: 48px 56px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          text-align: left;
        }
        .integrations-right h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 34px;
          font-weight: 700;
          line-height: 1.25;
          color: #ffffff;
          margin: 0 0 16px;
          letter-spacing: -0.02em;
        }
        .integrations-right p {
          font-family: 'Poppins', sans-serif;
          font-size: 14.5px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin: 0 0 28px;
        }
        .btn-explore {
          background: #2d2d2d;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          padding: 10px 24px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }
        .btn-explore:hover {
          background: #383838;
          border-color: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 860px) {
          .integrations-panel {
            grid-template-columns: 1fr;
          }
          .integrations-left {
            padding: 32px;
            gap: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .integrations-logo-card {
            width: 68px;
            height: 68px;
            border-radius: 12px;
          }
          .integrations-right {
            padding: 36px 24px;
          }
          .integrations-right h2 {
            font-size: 28px;
          }
        }

        /* ---------- faq ---------- */
        .faq-icon-circle{
          width: 52px; height: 52px; border-radius: 999px;
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          color: #fff;
          font-size: 26px;
          font-family: 'Poppins', sans-serif;
          font-weight: 300;
          user-select: none;
        }
        .faq-main-title{
          font-size: 38px;
          font-weight: 700;
          color: #fff;
          font-family: 'Poppins', sans-serif;
          letter-spacing: -0.02em;
          margin: 0 auto 48px;
          text-align: center;
        }
        .faq-list{
          display: flex;
          flex-direction: column;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .faq-item{
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .faq-item:last-child{
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .faq-q-row{
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
          gap: 20px;
        }
        .faq-q-text{
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
        }
        .faq-toggle-btn{
          font-size: 22px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.55);
          user-select: none;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: transform 0.3s ease, color 0.2s ease;
        }
        .faq-toggle-btn.open {
          transform: rotate(45deg);
          color: rgba(255, 255, 255, 0.9);
        }
        .faq-a-wrap {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.35s ease, opacity 0.28s ease;
        }
        .faq-a-wrap.open {
          max-height: 400px;
          opacity: 1;
        }
        .faq-a-text{
          font-size: 14.5px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.7;
          padding-top: 16px;
          max-width: 820px;
        }

        /* ---------- cta ---------- */
        .cta-row{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; text-align:center; }
        .cta-row h2{ font-size: 22px; font-weight:700; margin:0 0 4px; }
        .cta-row p{ font-size:13.5px; color: var(--text-dimmer, #9a9aa5); margin:0; }
        .cta-actions{ display:flex; gap:10px; flex-shrink:0; justify-content:center; }

        /* ---------- footer redesigned ---------- */
        .new-footer {
          background: var(--bg, #0f0f11);
          padding: 48px 0 80px;
          font-family: 'Poppins', sans-serif;
        }
        .new-footer-card {
          background: #000000;
          border-radius: 40px;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          padding: 64px 64px 48px;
          color: #ffffff;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }
        .new-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 2.5fr;
          gap: 64px;
          align-items: flex-start;
          margin-bottom: 48px;
        }
        .new-footer-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 400px;
        }
        .new-footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .new-footer-logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: 8px;
        }
        .new-footer-brand-name {
          font-size: 22px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .new-footer-desc {
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 28px;
          text-align: left;
        }
        .new-footer-social-icons {
          display: flex;
          gap: 16px;
        }
        .new-footer-social-btn {
          color: rgba(255, 255, 255, 0.6);
          transition: color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .new-footer-social-btn:hover {
          color: #ffffff;
        }
        .new-footer-person-socials {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }
        .new-footer-person-social-btn {
          color: rgba(255, 255, 255, 0.45);
          transition: color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .new-footer-person-social-btn:hover {
          color: #ffffff;
        }
        button.new-footer-person-social-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font: inherit;
        }
        .new-footer-email-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .new-footer-email-toast {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          background: rgba(20, 20, 22, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 6px;
          pointer-events: none;
          animation: footer-toast-fade 0.15s ease;
        }
        @keyframes footer-toast-fade {
          from { opacity: 0; transform: translateX(-50%) translateY(3px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .new-footer-right-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          width: 100%;
        }
        .new-footer-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .new-footer-column h3 {
          font-size: 14.5px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 20px 0;
          letter-spacing: 0.01em;
        }
        .new-footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .new-footer-link {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .new-footer-link:hover {
          color: #ffffff;
        }
        .new-footer-divider {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 32px 0 24px;
        }
        .new-footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          flex-wrap: wrap;
          gap: 16px;
        }
        .new-footer-copyright {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }
        .new-footer-legal-links {
          display: flex;
          gap: 24px;
        }
        .new-footer-legal-link {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.15s ease;
        }
        .new-footer-legal-link:hover {
          color: #ffffff;
        }
        .new-footer-sticker-drawer {
          margin-top: 48px;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .bubble-text-outline {
          user-select: none;
        }
        .bubble-text-front {
          user-select: none;
        }
        @media (max-width: 860px) {
          .new-footer {
            padding: 40px 0 60px;
          }
          .new-footer-card {
            border-radius: 28px;
            padding: 40px 32px 32px;
          }
          .new-footer-grid {
            grid-template-columns: 1fr;
            gap: 48px;
            margin-bottom: 48px;
          }
          .new-footer-left {
            max-width: 100%;
          }
          .new-footer-right-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
          }
        }
        @media (max-width: 600px) {
          .new-footer-card {
            border-radius: 20px;
            padding: 32px 20px 24px;
          }
          .new-footer-right-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .new-footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .new-footer-legal-links {
            flex-direction: column;
            gap: 10px;
          }
        }

        /* ---------- extra small-phone polish ---------- */
        @media (max-width: 480px) {
          .hero{ padding: 88px 0 40px; }
          .section{ padding: 40px 0; }
          .section-head h2{ font-size: 22px; }
          .section-head p{ font-size: 13px; }

          .problem-header{ font-size: 28px; }
          .problem-col-title{ font-size: 17px; }

          .layer-row-left h3{ font-size: 19px; }
          .layer-row-icon{ font-size: 20px; }

          .platform-banner-left h2{ font-size: 24px; }
          .platform-banner-left p{ font-size: 13.5px; }

          .how-right-map{ height: 320px; }
          .map-center{ padding: 6px 12px; }
          .map-center img{ width: 18px; height: 18px; }
          .map-center-text{ font-size: 12px; }
          .map-category{ font-size: 11px; }
          .map-node{ font-size: 9px; }

          .kpi-strip{ gap: 8px; grid-template-columns: repeat(2, 1fr); }
          .kpi-card{ padding: 12px; }
          .kpi-value{ font-size: 19px; }

          .advantages-cards-grid{ gap: 16px; }
          .card-bottom{ padding: 20px; }
          .card-top{ height: 150px; }

          .integrations-left{
            grid-template-columns: repeat(2, 1fr);
            padding: 24px; gap: 14px;
          }
          .integrations-logo-card{ width: 58px; height: 58px; border-radius: 10px; }
          .integrations-right{ padding: 28px 20px; }
          .integrations-right h2{ font-size: 22px; }
          .integrations-right p{ font-size: 13.5px; }

          .faq-main-title{ font-size: 28px; margin-bottom: 32px; }
          .faq-icon-circle{ width: 44px; height: 44px; font-size: 22px; }
          .faq-q-text{ font-size: 14px; }

          .new-footer-brand-name{ font-size: 16px; }
        }

        ::selection{ background: var(--accent-dim, rgba(255,255,255,0.12)); }
      `}</style>

      <LandingHeader onTrySudarshana={scrollToEmail} onScrollToSection={scrollToSection} />


      {/* ---------- hero ---------- */}
      <header className="hero">
        <div className="shell">
          <div className="hero-inner">

            {/* Left: headline + copy + CTAs */}
            <div className="hero-left">
              <h1>Spot Fast.<br/>Stop Faster.</h1>
              <p className="lead">Detect & neutralise threats in Sudarshana</p>
              {/* Sign-in box */}
              <div className="hero-signin-box">
                <button onClick={handleGoogleOAuth} className="hero-google-btn" style={{ width: '100%' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="hero-signin-or"><span>OR</span></div>

                {error && <div className="error-message" style={{
                  background: "rgba(239, 106, 95, 0.08)",
                  border: "1px solid rgba(239, 106, 95, 0.4)",
                  color: "#ef6a5f",
                  fontSize: "12.5px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  marginBottom: "4px"
                }}>{error}</div>}

                {step === 'email' ? (
                  <form onSubmit={handleContinueEmail} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      ref={emailRef}
                      className="hero-email-input"
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button type="submit" className="hero-email-btn" style={{ border: 'none', cursor: 'pointer', width: '100%' }} disabled={checkingEmail}>
                      {checkingEmail ? 'Checkingâ€¦' : 'Continue with email'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="email"
                        className="hero-email-input"
                        style={{ flex: 1 }}
                        value={email}
                        readOnly
                      />
                      <button
                        type="button"
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px',
                          color: '#a1a1aa',
                          fontFamily: "'Poppins', system-ui, sans-serif",
                          fontSize: '14px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'background 0.15s, border-color 0.15s',
                          lineHeight: 1
                        }}
                        onClick={() => { setStep('email'); setPassword(''); setError(''); setShowPassword(false); }}
                        title="Change email"
                      >
                        âœ•
                      </button>
                    </div>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        className="hero-email-input"
                        style={{ paddingRight: '44px' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.45)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        <Icon name={showPassword ? "visibility_off" : "visibility"} className="tgh-icon" style={{ fontSize: '18px' }} />
                      </button>
                    </div>
                    <button type="submit" className="hero-email-btn" style={{ border: 'none', cursor: 'pointer', width: '100%' }}>
                      Sign In
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Right: animated live-demo panel (loops through 3 product scenes) */}
            <div className="hero-right">
              <div className="hero-mock" key={demoCycle}>
                <div className="hero-mock-bar">
                  <span className="hero-mock-dot" style={{background:"#ef6a5f"}} />
                  <span className="hero-mock-dot" style={{background:"#f5a64d"}} />
                  <span className="hero-mock-dot" style={{background:"#74e08a"}} />
                  <span className="hero-mock-title">Sudarshana</span>
                  <span className="hero-mock-live">
                    <span className="hero-mock-live-dot" /> LIVE
                  </span>
                </div>

                {/* ---- Scene 0: inbox triage ---- */}
                {demoScene === 0 && (
                  <div className="hero-mock-body">
                    <div className="hero-mock-ticker">
                      {[
                        { label: "Verifying SPF / DKIM / DMARC", start: 0.0 },
                        { label: "Running behavioral NLP scan", start: 0.7 },
                        { label: "Validating SHA-256 hash chain", start: 1.5 },
                      ].map((step) => (
                        <div className="hero-mock-ticker-row done" key={step.label} style={{ animationDelay: `${step.start}s` }}>
                          <span className="hero-mock-ticker-icon"><Icon name="check" /></span>
                          {step.label}
                        </div>
                      ))}
                    </div>
                    <div className="hero-mock-rows">
                      {[
                        { init:"VY", sender:"Vineet Yadav (CFO)", snippet:"Please confirm the updated wire details below...", risk:"crit", flagged:true, delay: 2.6 },
                        { init:"HY", sender:"Haneesh Yadav (Legal)", snippet:"Re: Contract amendment â€” see attached revisions", risk:"ok", flagged:false, delay: 2.95 },
                        { init:"KY", sender:"Kunal Yadav (Vendor)", snippet:"Following up on the invoice from last Thursday...", risk:"warn", flagged:false, delay: 3.3 },
                      ].map((row) => (
                        <div className={`hero-mock-row${row.flagged ? " flagged" : ""}`} key={row.sender} style={{ animationDelay: `${row.delay}s` }}>
                          <div className="hero-mock-avatar">{row.init}</div>
                          <div className="hero-mock-meta">
                            <div className="hero-mock-sender">{row.sender}</div>
                            <div className="hero-mock-snippet">{row.snippet}</div>
                          </div>
                          <span className={`hero-mock-risk ${row.risk}`} style={{ animationDelay: `${row.delay + 0.25}s` }}>
                            {row.risk === "crit" ? "HIGH" : row.risk === "warn" ? "MED" : "OK"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---- Scene 1: settings ---- */}
                {demoScene === 1 && (
                  <div className="hero-mock-body">
                    <div className="hero-mock-tabs">
                      {[
                        { label: "General", active: true, delay: 0 },
                        { label: "Account", active: false, delay: 0.08 },
                        { label: "Connectors", active: false, delay: 0.16 },
                        { label: "Plugins", active: false, delay: 0.24 },
                      ].map((t) => (
                        <span className={"hero-mock-tab" + (t.active ? " active" : "")} key={t.label} style={{ animationDelay: `${t.delay}s` }}>{t.label}</span>
                      ))}
                    </div>
                    {[
                      { label: "Real-time email sync", sub: "Outlook, Gmail, ProtonMail", on: true, delay: 0.4 },
                      { label: "Hijack simulation alerts", sub: "Notify on suspected takeover patterns", on: true, delay: 0.75 },
                      { label: "Header anomaly scoring", sub: "SPF / DKIM / DMARC strict mode", on: true, delay: 1.1 },
                      { label: "Weekly security digest", sub: "Sent every Monday at 9:00 AM", on: false, delay: 1.45 },
                    ].map((s) => (
                      <div className="hero-mock-setting-row" key={s.label} style={{ animationDelay: `${s.delay}s` }}>
                        <div>
                          <div className="hero-mock-setting-label">{s.label}</div>
                          <div className="hero-mock-setting-sub">{s.sub}</div>
                        </div>
                        <span
                          className={"hero-mock-switch" + (s.on ? " on anim-on" : "")}
                          style={{ animationDelay: `${s.delay + 0.3}s` }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* ---- Scene 2: thread integrity inspector ---- */}
                {demoScene === 2 && (
                  <div className="hero-mock-body">
                    <div className="hero-mock-thread-head">
                      <div className="hero-mock-thread-subject">Re: Q3 wire authorization â€” Acme Holdings</div>
                      <div className="hero-mock-thread-meta">Haneesh Yadav (CFO) Â· Vineet Yadav (Finance) Â· 4 messages</div>
                    </div>

                    <div className="hero-mock-hash-caption" style={{ animationDelay: "0.1s" }}>Cryptographic thread lock â€” SHA-256 chain validation</div>

                    <div className="hero-mock-hashline">
                      {[0,1,2,3].map((i) => {
                        const bad = i >= 2;
                        return (
                          <React.Fragment key={i}>
                            <span className={"hero-mock-hash-node" + (bad ? " bad" : "")} style={{ animationDelay: `${0.5 + i * 0.4}s` }} />
                            {i < 3 && <span className={"hero-mock-hash-link" + (bad ? " bad" : "")} style={{ animationDelay: `${0.7 + i * 0.4}s` }} />}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <div className="hero-mock-thread-msgs">
                      {[
                        { text: <><b>Vinnet Yadav</b> opened thread â€” baseline tone established</>, bad: false, delay: 2.2 },
                        { text: <><b>Haneesh Yadav</b> replied â€” routine approval, protocol normal</>, bad: false, delay: 2.6 },
                        { text: <><b>Unknown sender</b> â€” wire routing altered, hash mismatch at #3</>, bad: true, delay: 3.0 },
                      ].map((m, i) => (
                        <div className="hero-mock-thread-msg" key={i} style={{ animationDelay: `${m.delay}s` }}>
                          <span className={"hero-mock-thread-msg-dot" + (m.bad ? " bad" : "")} />
                          <span className="hero-mock-thread-msg-text">{m.text}</span>
                        </div>
                      ))}
                      <div className="hero-mock-alert" style={{ animationDelay: "3.6s" }}>
                        <Icon name="link_off" className="pulse" />
                        <span className="hero-mock-alert-text">Chain integrity broken â€” content altered after message 3</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          
        </div>
      </header>

      {/* ---------- problem ---------- */}
      <section className="section" id="problem">
        <div className="shell">
          <h2 className="problem-header">
            <span className="problem-header-line1">What Is the Core</span>
            <span className="problem-header-line2">Problem?</span>
          </h2>

          <div className="problem-top-split">
            <div className="problem-left-illust">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer ring */}
                <circle cx="60" cy="60" r="54" stroke="#df7453" strokeWidth="1.5" strokeOpacity="0.25"/>
                {/* Inner ring */}
                <circle cx="60" cy="60" r="40" stroke="#df7453" strokeWidth="1" strokeOpacity="0.15"/>
                {/* Envelope body */}
                <rect x="28" y="42" width="64" height="44" rx="6" fill="#1e1510" stroke="#df7453" strokeWidth="2"/>
                {/* Envelope flap â€” open/broken */}
                <path d="M28 48 L60 66 L92 48" stroke="#df7453" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Crack / break line through envelope */}
                <path d="M56 54 L58 62 L54 68 L56 76" stroke="#df7453" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
                {/* Small intrusion dot on crack */}
                <circle cx="55.5" cy="68" r="2.5" fill="#df7453" opacity="0.85"/>
                {/* Alert dot top-right */}
                <circle cx="84" cy="36" r="10" fill="#df7453"/>
                <rect x="83" y="30" width="2" height="7" rx="1" fill="white"/>
                <rect x="83" y="39" width="2" height="2" rx="1" fill="white"/>
              </svg>
            </div>
            <div className="problem-right-content">
              <p>
                SEGs scan for links and attachments. They miss attacks that consist purely of normal-looking text riding on existing trust. Deploy Sudarshana alongside your existing stack to close the security gap and protect thread integrity.
              </p>
            </div>
          </div>

          <div className="problem-three-cols">
            {/* Column 1 */}
            <div className="problem-col">
              <div className="problem-col-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div className="problem-col-title">Conversation hijacking</div>
              <div className="problem-col-desc">
                Bad actors monitor or infiltrate compromised mail servers to locate ongoing, high-stakes threads with vendors, legal counsel, or executives.
              </div>
            </div>

            {/* Column 2 */}
            <div className="problem-col">
              <div className="problem-col-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10c1 0 2 1 3 0s2-1 3 0" />
                </svg>
              </div>
              <div className="problem-col-title">Psychological manipulation</div>
              <div className="problem-col-desc">
                Once embedded, attackers introduce subtle shifts â€” artificial urgency, authority exploitation, or sudden routing/wire number changes.
              </div>
            </div>

            {/* Column 3 */}
            <div className="problem-col">
              <div className="problem-col-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div className="problem-col-title">The security gap</div>
              <div className="problem-col-desc">
                Messages look like normal text and ride on existing trust, so SEGs trigger zero signature or link-based alarms.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- platform / layers ---------- */}
      <section className="section" id="platform" style={{padding:0, borderTop:"1px solid rgba(255,255,255,0.1)"}}>
        <div className="shell">

          {/* Top banner row */}
          <div className="platform-banner">
            <div className="platform-banner-left">
              <h2>Secured by the<br/>Sudarshana Platform</h2>
              <p>Use our multi-layered engine to detect conversation hijacking, enforce protocol trust, and lock thread integrity â€” in real time.</p>
              <div className="platform-banner-actions">
                <button className="btn-white-pill" onClick={scrollToEmail}>
                  <span>Explore the platform</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
                <button className="btn-secondary" onClick={() => scrollToSection('#how-it-works')}>See how it works</button>
              </div>
            </div>
            <div className="platform-banner-right">
              {/* decorative SVG: globe (global reach / network) â€” animated rotation */}
              <style>{`
                @keyframes tg-globe-spin-ellipse {
                  0%   { transform: scaleX(1); }
                  25%  { transform: scaleX(0.15); }
                  50%  { transform: scaleX(1); }
                  75%  { transform: scaleX(0.15); }
                  100% { transform: scaleX(1); }
                }
                @keyframes tg-globe-spin-lat {
                  0%   { transform: translateY(0); }
                  25%  { transform: translateY(2px); }
                  50%  { transform: translateY(0); }
                  75%  { transform: translateY(-2px); }
                  100% { transform: translateY(0); }
                }
                @keyframes tg-globe-spin-dot {
                  0%   { opacity: 1; transform: scale(1); }
                  25%  { opacity: 0.25; transform: scale(0.5); }
                  50%  { opacity: 1; transform: scale(1); }
                  75%  { opacity: 0.25; transform: scale(0.5); }
                  100% { opacity: 1; transform: scale(1); }
                }
                .tg-globe-meridian {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: tg-globe-spin-ellipse 4s ease-in-out infinite;
                }
                .tg-globe-lat-curve {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: tg-globe-spin-lat 4s ease-in-out infinite;
                }
                .tg-globe-dot {
                  transform-box: fill-box;
                  transform-origin: center;
                  animation: tg-globe-spin-dot 4s ease-in-out infinite;
                }
                .tg-globe-dot:nth-of-type(2) { animation-delay: -0.3s; }
                .tg-globe-dot:nth-of-type(3) { animation-delay: -0.6s; }
                .tg-globe-dot:nth-of-type(4) { animation-delay: -0.9s; }
                .tg-globe-dot:nth-of-type(5) { animation-delay: -1.2s; }
                .tg-globe-dot:nth-of-type(6) { animation-delay: -1.5s; }
                .tg-globe-dot:nth-of-type(7) { animation-delay: -1.8s; }
                .tg-globe-dot:nth-of-type(8) { animation-delay: -2.1s; }
                .tg-globe-dot:nth-of-type(9) { animation-delay: -2.4s; }
                .tg-globe-dot:nth-of-type(10) { animation-delay: -2.7s; }
                .tg-globe-dot:nth-of-type(11) { animation-delay: -3s; }
                .tg-globe-dot:nth-of-type(12) { animation-delay: -3.3s; }
                .tg-globe-dot:nth-of-type(13) { animation-delay: -3.6s; }
                .tg-globe-dot:nth-of-type(14) { animation-delay: -0.4s; }
                .tg-globe-dot:nth-of-type(15) { animation-delay: -0.8s; }
                .tg-globe-dot:nth-of-type(16) { animation-delay: -1.1s; }
                .tg-globe-dot:nth-of-type(17) { animation-delay: -1.6s; }
                .tg-globe-dot:nth-of-type(18) { animation-delay: -2s; }
                .tg-globe-dot:nth-of-type(19) { animation-delay: -2.5s; }
                .tg-globe-dot:nth-of-type(20) { animation-delay: -2.9s; }
                .tg-globe-dot:nth-of-type(21) { animation-delay: -3.2s; }
                .tg-globe-dot:nth-of-type(22) { animation-delay: -3.7s; }
                .tg-globe-dot:nth-of-type(23) { animation-delay: -0.5s; }
                .tg-globe-dot:nth-of-type(24) { animation-delay: -1.4s; }
              `}</style>
              <svg width="340" height="220" viewBox="0 0 340 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                

                {/* globe icon, centered where the shield/email illustration used to sit */}
                <g transform="translate(80, 10) scale(0.8)">
                  <g fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="100" cy="100" r="55" />
                    <ellipse className="tg-globe-meridian" cx="100" cy="100" rx="22" ry="55" />
                    <line x1="46" y1="100" x2="154" y2="100" />
                    <line x1="53" y1="76" x2="147" y2="76" />
                    <line x1="53" y1="124" x2="147" y2="124" />
                    <path className="tg-globe-lat-curve" d="M48 82 Q100 100 152 82" />
                    <path className="tg-globe-lat-curve" d="M48 118 Q100 100 152 118" />
                  </g>
                  <g fill="#0d0d0f" stroke="white" strokeWidth="2.2">
                    {/* outer circle intersections */}
                    <circle className="tg-globe-dot" cx="100" cy="45" r="4.5" />
                    <circle className="tg-globe-dot" cx="146" cy="73" r="4.5" />
                    <circle className="tg-globe-dot" cx="146" cy="127" r="4.5" />
                    <circle className="tg-globe-dot" cx="100" cy="155" r="4.5" />
                    <circle className="tg-globe-dot" cx="54" cy="127" r="4.5" />
                    <circle className="tg-globe-dot" cx="54" cy="73" r="4.5" />
                    {/* equator line */}
                    <circle className="tg-globe-dot" cx="46" cy="100" r="4.5" />
                    <circle className="tg-globe-dot" cx="78" cy="100" r="4.5" />
                    <circle className="tg-globe-dot" cx="122" cy="100" r="4.5" />
                    <circle className="tg-globe-dot" cx="154" cy="100" r="4.5" />
                    {/* upper latitude line */}
                    <circle className="tg-globe-dot" cx="53" cy="76" r="4.5" />
                    <circle className="tg-globe-dot" cx="83" cy="76" r="4.5" />
                    <circle className="tg-globe-dot" cx="117" cy="76" r="4.5" />
                    <circle className="tg-globe-dot" cx="147" cy="76" r="4.5" />
                    {/* lower latitude line */}
                    <circle className="tg-globe-dot" cx="53" cy="124" r="4.5" />
                    <circle className="tg-globe-dot" cx="83" cy="124" r="4.5" />
                    <circle className="tg-globe-dot" cx="117" cy="124" r="4.5" />
                    <circle className="tg-globe-dot" cx="147" cy="124" r="4.5" />
                    {/* meridian ellipse */}
                    <circle className="tg-globe-dot" cx="100" cy="55" r="4.5" />
                    <circle className="tg-globe-dot" cx="100" cy="145" r="4.5" />
                    <circle className="tg-globe-dot" cx="122" cy="80" r="4.5" />
                    <circle className="tg-globe-dot" cx="122" cy="120" r="4.5" />
                    <circle className="tg-globe-dot" cx="78" cy="80" r="4.5" />
                    <circle className="tg-globe-dot" cx="78" cy="120" r="4.5" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <div>
          <div className="shell">
            <div className="layers-list">
              {LAYERS.map((l, i) => (
                <div className="layer-row" key={l.title}>
                  <div className="layer-row-left">
                    <Icon name={l.iconName} className="layer-row-icon" />
                    <h3>{l.title}</h3>
                  </div>
                  <div className="layer-row-right">
                    <p>{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ---------- how it works ---------- */}
      <section className="section" id="how-it-works">
        <div className="shell">
          <div className="section-head" style={{ marginBottom: '48px' }}>
            <div>
              <span className="page-sub">How it works</span>
              <h2>From inbox to verdict, end to end</h2>
            </div>
          </div>

          <div className="how-inner">
            {/* Left Steps Column */}
            <div className="how-left-steps">
              <div className="how-step-item">
                <div className="how-step-title">
                  <Icon name="psychology" />
                  <span>01. Relational NLP analysis</span>
                </div>
                <div className="how-step-desc">
                  Sudarshana analyzes conversational context, relation histories, and behavior shifts to detect relational abnormalities and spoofing.
                </div>
              </div>

              <div className="how-step-item">
                <div className="how-step-title">
                  <Icon name="verified_user" />
                  <span>02. Infrastructure verification</span>
                </div>
                <div className="how-step-desc">
                  Maps the physical transport layer to verify SPF, DKIM, and DMARC alignment, ensuring the sender identity is fully authenticated.
                </div>
              </div>

              <div className="how-step-item">
                <div className="how-step-title">
                  <Icon name="link" />
                  <span>03. Cryptographic thread locking</span>
                </div>
                <div className="how-step-desc">
                  Locks each message response in a tamper-evident SHA-256 cascade chain, making conversation histories immutable.
                </div>
              </div>
            </div>

            {/* Right Map Visual Column */}
            <div className="how-right-map">
              {/* Connecting lines using responsive SVG */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {/* Center to categories */}
                <line x1="55%" y1="50%" x2="38%" y2="35%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
                <line x1="55%" y1="50%" x2="75%" y2="60%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
                <line x1="55%" y1="50%" x2="35%" y2="72%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
                <line x1="55%" y1="50%" x2="70%" y2="28%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />

                {/* Linguistic NLP Category (38%, 35%) to children */}
                <line x1="38%" y1="35%" x2="42%" y2="18%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="38%" y1="35%" x2="28%" y2="24%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="38%" y1="35%" x2="24%" y2="44%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Protocol Alignment Category (75%, 60%) to children */}
                <line x1="75%" y1="60%" x2="88%" y2="46%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="75%" y1="60%" x2="84%" y2="72%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="75%" y1="60%" x2="70%" y2="82%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Thread Locking Category (35%, 72%) to children */}
                <line x1="35%" y1="72%" x2="22%" y2="62%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="35%" y1="72%" x2="20%" y2="82%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="35%" y1="72%" x2="38%" y2="88%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Active Sync Category (70%, 28%) to children */}
                <line x1="70%" y1="28%" x2="80%" y2="15%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="70%" y1="28%" x2="66%" y2="12%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              </svg>

              {/* Center Sudarshana Node */}
              <div className="map-center">
                <img src="sudarshana.png" alt="logo" />
                <span className="map-center-text">Sudarshana</span>
              </div>

              {/* Categories */}
              <div className="map-category" style={{ left: '38%', top: '35%' }}>Linguistic NLP</div>
              <div className="map-category" style={{ left: '75%', top: '60%' }}>Protocol alignment</div>
              <div className="map-category" style={{ left: '35%', top: '72%' }}>Thread locking</div>
              <div className="map-category" style={{ left: '70%', top: '28%' }}>Active Sync</div>

              {/* Child Nodes - NLP */}
              <div className="map-node" style={{ left: '42%', top: '18%' }}>Relational maps</div>
              <div className="map-node" style={{ left: '28%', top: '24%' }}>Tone anomalies</div>
              <div className="map-node" style={{ left: '24%', top: '44%' }}>Urgency spikes</div>

              {/* Child Nodes - Protocol */}
              <div className="map-node" style={{ left: '88%', top: '46%' }}>SPF check</div>
              <div className="map-node" style={{ left: '84%', top: '72%' }}>DKIM alignment</div>
              <div className="map-node" style={{ left: '70%', top: '82%' }}>DMARC status</div>

              {/* Child Nodes - Locking */}
              <div className="map-node" style={{ left: '22%', top: '62%' }}>SHA-256 cascade</div>
              <div className="map-node" style={{ left: '20%', top: '82%' }}>Tamper alert</div>
              <div className="map-node" style={{ left: '38%', top: '88%' }}>History lock</div>

              {/* Child Nodes - Active Sync */}
              <div className="map-node" style={{ left: '80%', top: '15%' }}>Gmail pull</div>
              <div className="map-node" style={{ left: '66%', top: '12%' }}>SOC queue</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- advantages ---------- */}
      <section className="section" id="advantages">
        <div className="shell">
          <div className="section-head" style={{ textAlign: 'center', marginBottom: '32px', maxWidth: 'none' }}>
            <div>
              <h2 style={{ fontSize: '38px', fontWeight: '700', letterSpacing: '-0.02em', marginTop: '8px' }}>
                Built for SOC teams, not alert fatigue
              </h2>
            </div>
          </div>
          
          <div className="advantages-cards-grid">
            {/* Card 1: Zero-trust communication */}
            <div className="advantage-card">
              <div className="card-top bg-purple">
                <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%' }}>
                  {/* Click rays */}
                  <line x1="145" y1="35" x2="140" y2="25" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="157" y1="40" x2="167" y2="35" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="160" y1="52" x2="170" y2="57" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Hand line-art */}
                  <path d="M78 128 C74 120, 82 115, 88 128 M88 128 C86 118, 94 112, 100 128 M100 128 C98 120, 106 116, 112 128 M112 128 C118 126, 126 128, 126 138 M78 128 C78 100, 84 90, 94 90 C104 90, 104 110, 104 128 M78 128 C64 128, 55 140, 70 148 C85 156, 140 148, 150 128 C158 108, 152 75, 140 68 C128 60, 124 95, 124 110" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Mouse cursor pointing up-left */}
                  <path d="M125 45 L150 58 L142 61 L152 78 L144 82 L134 65 L125 70 Z" fill="white" stroke="black" strokeWidth="3.5" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="card-bottom">
                <div className="card-title" style={{ marginBottom: 0 }}>
                  Zero-trust communication: extends zero-trust beyond network access, directly into the text layer of corporate workflows.
                </div>
              </div>
            </div>

            {/* Card 2: Reduced false positives */}
            <div className="advantage-card">
              <div className="card-top bg-orange">
                <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%' }}>
                  {/* Triangle lines */}
                  <line x1="100" y1="55" x2="70" y2="105" stroke="black" strokeWidth="4" />
                  <line x1="100" y1="55" x2="130" y2="105" stroke="black" strokeWidth="4" />
                  <line x1="70" y1="105" x2="130" y2="105" stroke="black" strokeWidth="4" />
                  
                  {/* Three white circle disks with black borders */}
                  <circle cx="100" cy="55" r="16" fill="white" stroke="black" strokeWidth="4" />
                  <circle cx="70" cy="105" r="16" fill="white" stroke="black" strokeWidth="4" />
                  <circle cx="130" cy="105" r="16" fill="white" stroke="black" strokeWidth="4" />
                  
                  {/* Small black dots inside */}
                  <circle cx="100" cy="55" r="5" fill="black" />
                  <circle cx="70" cy="105" r="5" fill="black" />
                  <circle cx="130" cy="105" r="5" fill="black" />
                  
                  {/* Inner triangle or lines connecting them */}
                  <circle cx="100" cy="88" r="4" fill="black" />
                  <line x1="100" y1="55" x2="100" y2="88" stroke="black" strokeWidth="3" />
                  <line x1="70" y1="105" x2="100" y2="88" stroke="black" strokeWidth="3" />
                  <line x1="130" y1="105" x2="100" y2="88" stroke="black" strokeWidth="3" />
                </svg>
              </div>
              <div className="card-bottom">
                <div className="card-title" style={{ marginBottom: 0 }}>
                  Reduced false positives: linguistic, protocol, and cryptographic signal are combined so SOCs aren't drowned in ungrounded alerts.
                </div>
              </div>
            </div>

            {/* Card 3: Seamless integration */}
            <div className="advantage-card">
              <div className="card-top bg-blue">
                <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%' }}>
                  {/* Back page */}
                  <g transform="translate(10, -5) rotate(4 100 80)">
                    <path d="M75 35 L115 35 L130 50 L130 110 L75 110 Z" fill="white" stroke="black" strokeWidth="3.5" strokeLinejoin="round" />
                    <path d="M115 35 L115 50 L130 50" fill="white" stroke="black" strokeWidth="3.5" strokeLinejoin="round" />
                  </g>
                  
                  {/* Front page */}
                  <g transform="translate(-10, 5) rotate(-2 100 80)">
                    <path d="M70 40 L110 40 L125 55 L125 115 L70 115 Z" fill="white" stroke="black" strokeWidth="3.5" strokeLinejoin="round" />
                    <path d="M110 40 L110 55 L125 55" fill="white" stroke="black" strokeWidth="3.5" strokeLinejoin="round" />
                    {/* </> symbol */}
                    <path d="M82 72 L76 77 L82 82 M100 72 L106 77 L100 82" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="93" y1="70" x2="89" y2="84" stroke="black" strokeWidth="3" strokeLinecap="round" />
                  </g>
                </svg>
              </div>
              <div className="card-bottom">
                <div className="card-title" style={{ marginBottom: 0 }}>
                  Seamless integration: deploys as a cloud-native API alongside Microsoft 365 and Google Workspace, with no added latency.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- integrations ---------- */}
      <section className="section" id="integrations">
        <div className="shell">
          <div className="integrations-panel">
            <div className="integrations-left">

              {/* Card 1: Google */}
              <div className="integrations-logo-card">
                <svg viewBox="0 0 100 100" style={{ width: '44px', height: '44px' }}>
                  <path d="M85 51.5 C85 48.5, 84.7 45.5, 84.2 42.5 L50 42.5 L50 58.5 L69.6 58.5 C68.8 63.5, 66 67.8, 61.8 70.6 L73.8 79.9 C80.8 73.5, 85 63.8, 85 51.5 Z" fill="#4285F4" />
                  <path d="M50 87 C59.9 87, 68.3 83.7, 73.8 79.9 L61.8 70.6 C58.5 72.8, 54.5 74.2, 50 74.2 C40.4 74.2, 32.3 67.7, 29.4 58.9 L17 68.5 C23 80.5, 35.5 87, 50 87 Z" fill="#34A853" />
                  <path d="M29.4 58.9 C28.6 56.6, 28.2 54.1, 28.2 51.5 C28.2 48.9, 28.6 46.4, 29.4 44.1 L17 34.5 C13.8 40.9, 12 48, 12 51.5 C12 55, 13.8 62.1, 17 68.5 L29.4 58.9 Z" fill="#FBBC05" />
                  <path d="M50 28.8 C55.4 28.8, 60.2 30.7, 64 34.3 L74.5 23.8 C68.3 18, 59.9 14.5, 50 14.5 C35.5 14.5, 23 21, 17 33 L29.4 42.6 C32.3 33.8, 40.4 28.8, 50 28.8 Z" fill="#EA4335" />
                </svg>
              </div>

              {/* Card 2: Microsoft */}
              <div className="integrations-logo-card">
                <svg viewBox="0 0 100 100" style={{ width: '44px', height: '44px' }}>
                  <rect x="15" y="15" width="31" height="31" fill="#F25022" />
                  <rect x="54" y="15" width="31" height="31" fill="#7FBA00" />
                  <rect x="15" y="54" width="31" height="31" fill="#00A1F1" />
                  <rect x="54" y="54" width="31" height="31" fill="#FFB900" />
                </svg>
              </div>

              {/* Card 3: Apple Mail */}
              <div className="integrations-logo-card">
                <svg viewBox="0 0 100 100" style={{ width: '48px', height: '48px' }}>
                  <defs>
                    <linearGradient id="appleMailGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#5AC8FA" />
                      <stop offset="1" stopColor="#0A84FF" />
                    </linearGradient>
                  </defs>
                  <rect x="6" y="6" width="88" height="88" rx="18" fill="url(#appleMailGrad)" />
                  <rect x="20" y="32" width="60" height="40" rx="5" fill="white" />
                  <path d="M22 33 L50 56 L78 33" stroke="#0A84FF" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Card 4: Outlook */}
              <div className="integrations-logo-card">
                <svg viewBox="0 0 100 100" style={{ width: '48px', height: '48px' }}>
                  <rect x="8" y="8" width="84" height="84" rx="14" fill="#0A2767" />
                  <rect x="46" y="22" width="40" height="56" rx="3" fill="#0364B8" />
                  <rect x="46" y="22" width="40" height="14" fill="#28A8EA" />
                  <rect x="46" y="64" width="40" height="14" fill="#0078D4" />
                  <ellipse cx="36" cy="50" rx="24" ry="22" fill="#1490DF" />
                  <ellipse cx="36" cy="50" rx="13" ry="12" fill="white" />
                </svg>
              </div>

              {/* Card 5: Yahoo Mail */}
              <div className="integrations-logo-card">
                <svg viewBox="0 0 100 100" style={{ width: '48px', height: '48px' }}>
                  <rect x="6" y="6" width="88" height="88" rx="16" fill="#5F01D1" />
                  <path d="M30 28 L46 56 L46 74 L56 74 L56 56 L72 28 L60 28 L51 45 L42 28 Z" fill="white" />
                  <circle cx="73" cy="68" r="7" fill="#6001D2" stroke="white" strokeWidth="3" />
                </svg>
              </div>

              {/* Card 6: ProtonMail */}
              <div className="integrations-logo-card">
                <svg viewBox="0 0 100 100" style={{ width: '48px', height: '48px' }}>
                  <rect x="6" y="6" width="88" height="88" rx="16" fill="#6D4AFF" />
                  <path d="M25 32 L50 53 L75 32" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <rect x="25" y="32" width="50" height="34" rx="4" stroke="white" strokeWidth="6" fill="none" />
                </svg>
              </div>

              {/* Card 7: Zoho Mail */}
              <div className="integrations-logo-card">
                <div style={{
                  width: "52px",
                  height: "52px",
                  backgroundColor: "#C8202F",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span style={{ color: "white", fontWeight: 900, fontSize: "22px", fontFamily: "-apple-system, sans-serif" }}>Z</span>
                </div>
              </div>

              

              {/* Card 8: Thunderbird */}
              <div className="integrations-logo-card">
                <svg viewBox="0 0 100 100" style={{ width: '48px', height: '48px' }}>
                  <circle cx="50" cy="50" r="44" fill="#1A2B3D" />
                  <path d="M50 18 C35 18, 24 30, 24 47 C24 58, 30 66, 38 70 L34 82 L50 74 L66 82 L62 70 C70 66, 76 58, 76 47 C76 30, 65 18, 50 18 Z" fill="#0A84FF" />
                  <path d="M50 30 C42 30, 36 38, 36 47 C36 53, 39 58, 44 61 L50 70 L56 61 C61 58, 64 53, 64 47 C64 38, 58 30, 50 30 Z" fill="#00DDFF" />
                </svg>
              </div>

              {/* Card 9: AOL Mail */}
              <div className="integrations-logo-card">
                <svg viewBox="0 0 100 100" style={{ width: '50px', height: '50px' }}>
                  <rect x="6" y="6" width="88" height="88" rx="16" fill="#3D3D3D" />
                  <text x="50" y="60" fill="#3399FF" fontSize="26" fontWeight="800" fontFamily="-apple-system, sans-serif" textAnchor="middle">Aol.</text>
                </svg>
              </div>

              

              
            </div>
            <div className="integrations-right">
              <h2>Sudarshana connects to your security ecosystem</h2>
              <p>Linguistic anomalies, transport protocols, and active mail sync, all in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- faq ---------- */}
      <section className="section" id="faq">
        <div className="shell" style={{ maxWidth: '820px' }}>
          
          <div className="faq-icon-circle">?</div>
          <h2 className="faq-main-title">FAQ</h2>

          <div className="faq-list">
            {FAQS.map((f, index) => {
              const isOpen = activeFaq === index;
              return (
                <div className="faq-item" key={f.q}>
                  <div className="faq-q-row" onClick={() => setActiveFaq(isOpen ? null : index)}>
                    <span className="faq-q-text">{f.q}</span>
                    <span className={`faq-toggle-btn${isOpen ? ' open' : ''}`}>+</span>
                  </div>
                  <div className={`faq-a-wrap${isOpen ? ' open' : ''}`}>
                    <div className="faq-a-text">{f.a}</div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      

      {/* ---------- footer ---------- */}
      {/* ---------- footer ---------- */}
      <footer className="new-footer">
        <div className="shell" style={{ maxWidth: '1280px' }}>
          <div className="new-footer-card">
            <div className="new-footer-grid">
              <div className="new-footer-left">
                <div className="new-footer-brand">
                  <img src="sudarshana.png" alt="Sudarshana Logo" className="new-footer-logo" />
                  <span className="new-footer-brand-name">Sudarshana</span>
                </div>
                <p className="new-footer-desc">
                  Sudarshana empowers security teams to prevent hijacks and secure conversations â€” making threat visibility clear, understandable, and actionable.
                </p>
              </div>
              
              <div className="new-footer-right-grid">
                <div className="new-footer-column">
                  <h3>Mentor/Guide</h3>
                  <ul className="new-footer-links">
                    <li>
                      <span className="new-footer-link">Dr. Rakshit Tandon</span>
                      <div className="new-footer-person-socials">
                        <a className="new-footer-person-social-btn" href="https://x.com/tandonrakshit" target="_blank" rel="noopener noreferrer" title="X">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                        <a className="new-footer-person-social-btn" href="https://www.instagram.com/rakshit.tandon" target="_blank" rel="noopener noreferrer" title="Instagram">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                        </a>
                        <a className="new-footer-person-social-btn" href="https://www.linkedin.com/in/rakshittandon" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="new-footer-column">
                  <h3>Developer</h3>
                  <ul className="new-footer-links">
                    <li>
                      <span className="new-footer-link">Haneesh Yadav</span>
                      <div className="new-footer-person-socials">
                        <a className="new-footer-person-social-btn" href="https://www.linkedin.com/in/haneesh-yadav" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                        <a className="new-footer-person-social-btn" href="https://github.com/haneesh-yadav" target="_blank" rel="noopener noreferrer" title="GitHub">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        </a>
                        <div className="new-footer-email-wrap">
                          <button type="button" className="new-footer-person-social-btn" onClick={copyDeveloperEmail} title="Copy email">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          </button>
                          {devEmailCopied && <span className="new-footer-email-toast">Email Copied</span>}
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="new-footer-column">
                  <h3>Terms and policies</h3>
                  <ul className="new-footer-links">
                    <li><a className="new-footer-link" href="#">Privacy Policy</a></li>
                    <li><a className="new-footer-link" href="#">Terms of Service</a></li>
                    <li><a className="new-footer-link" href="#">Cookies Settings</a></li>
                    <li><a className="new-footer-link" href="#">Usage policy</a></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <hr className="new-footer-divider" />
            
            <div className="new-footer-bottom">
              <span className="new-footer-copyright">
                Â© 2026 Sudarshana. All rights reserved.
              </span>
              <div className="new-footer-legal-links">
                <a className="new-footer-legal-link" >GPCSSI 2026</a>
              </div>
            </div>
            
          </div>
        </div>
      </footer>
  </div>
  );
}

