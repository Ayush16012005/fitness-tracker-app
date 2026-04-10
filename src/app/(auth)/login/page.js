'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import styles from './login.module.css';

function Pupil({ size = 12, maxDistance = 5, pupilColor = 'black', forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };

    const rect = pupilRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const position = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className={styles.pupil}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    />
  );
}

function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = 'white',
  pupilColor = 'black',
  isBlinking = false,
  forceLookX,
  forceLookY,
}) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };

    const rect = eyeRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const position = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className={styles.eyeball}
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
      }}
    >
      {!isBlinking && (
        <div
          className={styles.pupil}
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const [remember, setRemember] = useState(true);
  const { signIn, signInWithProvider } = useAuth();
  const router = useRouter();
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let blinkTimeout;
    let closeTimeout;

    const scheduleBlink = (setter) => {
      blinkTimeout = window.setTimeout(() => {
        setter(true);
        closeTimeout = window.setTimeout(() => {
          setter(false);
          scheduleBlink(setter);
        }, 150);
      }, Math.random() * 4000 + 3000);
    };

    scheduleBlink(setIsPurpleBlinking);

    return () => {
      window.clearTimeout(blinkTimeout);
      window.clearTimeout(closeTimeout);
    };
  }, []);

  useEffect(() => {
    let blinkTimeout;
    let closeTimeout;

    const scheduleBlink = (setter) => {
      blinkTimeout = window.setTimeout(() => {
        setter(true);
        closeTimeout = window.setTimeout(() => {
          setter(false);
          scheduleBlink(setter);
        }, 150);
      }, Math.random() * 4000 + 3000);
    };

    scheduleBlink(setIsBlackBlinking);

    return () => {
      window.clearTimeout(blinkTimeout);
      window.clearTimeout(closeTimeout);
    };
  }, []);

  useEffect(() => {
    if (!isTyping) {
      setIsLookingAtEachOther(false);
      return undefined;
    }

    setIsLookingAtEachOther(true);
    const timer = window.setTimeout(() => setIsLookingAtEachOther(false), 800);
    return () => window.clearTimeout(timer);
  }, [isTyping]);

  useEffect(() => {
    if (!(password.length > 0 && showPassword)) {
      setIsPurplePeeking(false);
      return undefined;
    }

    let intervalTimeout;
    let hideTimeout;
    let cancelled = false;

    const schedulePeek = () => {
      intervalTimeout = window.setTimeout(() => {
        if (cancelled) return;
        setIsPurplePeeking(true);
        hideTimeout = window.setTimeout(() => {
          if (cancelled) return;
          setIsPurplePeeking(false);
          schedulePeek();
        }, 800);
      }, Math.random() * 3000 + 2000);
    };

    schedulePeek();

    return () => {
      cancelled = true;
      window.clearTimeout(intervalTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [password, showPassword]);

  const calculatePosition = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
    };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.visualPanel}>
        <div className={styles.brandRow}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandBadge}>
              <Sparkles size={18} />
            </span>
            <span>FitTrack</span>
          </Link>
          <div className={styles.themeShell}>
            <ThemeToggle />
          </div>
        </div>

        <div className={styles.sceneWrap}>
          <div className={styles.scene}>
            <div
              ref={purpleRef}
              className={`${styles.character} ${styles.purple}`}
              style={{
                '--purple-height': isTyping || (password.length > 0 && !showPassword) ? '440px' : '400px',
                transform:
                  password.length > 0 && showPassword
                    ? 'skewX(0deg)'
                    : isTyping || (password.length > 0 && !showPassword)
                      ? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
                      : `skewX(${purplePos.bodySkew}deg)`,
              }}
            >
              <div
                className={styles.eyes}
                style={{
                  gap: '32px',
                  left: password.length > 0 && showPassword ? '20px' : isLookingAtEachOther ? '55px' : `${45 + purplePos.faceX}px`,
                  top: password.length > 0 && showPassword ? '35px' : isLookingAtEachOther ? '65px' : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2d2d2d"
                  isBlinking={isPurpleBlinking}
                  forceLookX={password.length > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={password.length > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2d2d2d"
                  isBlinking={isPurpleBlinking}
                  forceLookX={password.length > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={password.length > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>
            </div>

            <div
              ref={blackRef}
              className={`${styles.character} ${styles.black}`}
              style={{
                transform:
                  password.length > 0 && showPassword
                    ? 'skewX(0deg)'
                    : isLookingAtEachOther
                      ? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(20px)`
                      : isTyping || (password.length > 0 && !showPassword)
                        ? `skewX(${blackPos.bodySkew * 1.5}deg)`
                        : `skewX(${blackPos.bodySkew}deg)`,
              }}
            >
              <div
                className={styles.eyes}
                style={{
                  gap: '24px',
                  left: password.length > 0 && showPassword ? '10px' : isLookingAtEachOther ? '32px' : `${26 + blackPos.faceX}px`,
                  top: password.length > 0 && showPassword ? '28px' : isLookingAtEachOther ? '12px' : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2d2d2d"
                  isBlinking={isBlackBlinking}
                  forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2d2d2d"
                  isBlinking={isBlackBlinking}
                  forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                />
              </div>
            </div>

            <div
              ref={orangeRef}
              className={`${styles.character} ${styles.orange}`}
              style={{ transform: password.length > 0 && showPassword ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew}deg)` }}
            >
              <div
                className={styles.eyes}
                style={{
                  gap: '32px',
                  left: password.length > 0 && showPassword ? '50px' : `${82 + orangePos.faceX}px`,
                  top: password.length > 0 && showPassword ? '85px' : `${90 + orangePos.faceY}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2d2d2d" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2d2d2d" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
              </div>
            </div>

            <div
              ref={yellowRef}
              className={`${styles.character} ${styles.yellow}`}
              style={{ transform: password.length > 0 && showPassword ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew}deg)` }}
            >
              <div
                className={styles.eyes}
                style={{
                  gap: '24px',
                  left: password.length > 0 && showPassword ? '20px' : `${52 + yellowPos.faceX}px`,
                  top: password.length > 0 && showPassword ? '35px' : `${40 + yellowPos.faceY}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2d2d2d" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2d2d2d" forceLookX={password.length > 0 && showPassword ? -5 : undefined} forceLookY={password.length > 0 && showPassword ? -4 : undefined} />
              </div>
              <div
                className={styles.mouth}
                style={{
                  left: password.length > 0 && showPassword ? '10px' : `${40 + yellowPos.faceX}px`,
                  top: password.length > 0 && showPassword ? '88px' : `${88 + yellowPos.faceY}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.footerLinks}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formShell}>
          <div className={styles.mobileBrand}>
            <Link href="/" className={styles.mobileBrandInner}>
              <span className={styles.mobileBadge}>
                <Sparkles size={18} />
              </span>
              <span>FitTrack</span>
            </Link>
            <ThemeToggle />
          </div>

          <div className={styles.header}>
            <h1>Welcome back!</h1>
            <p>Sign in to continue tracking workouts, goals, and your latest progress.</p>
          </div>

          <div className={styles.formCard}>
            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <div className={styles.inputWrap}>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    placeholder="anna@gmail.com"
                    value={email}
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <div className={styles.inputWrap}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${styles.input} ${styles.passwordInput}`}
                    placeholder="********"
                    value={password}
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className={styles.row}>
                <label className={styles.remember} htmlFor="remember">
                  <input id="remember" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                  <span>Remember for 30 days</span>
                </label>
                <a href="#" className={styles.forgot}>
                  Forgot password?
                </a>
              </div>

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Signing in...' : 'Log in'}
              </button>
            </form>

            <div style={{ marginTop: '16px' }}>
              <button type="button" className={styles.secondaryButton} onClick={() => signInWithProvider('google')}>
                <Mail size={18} />
                <span>Log in with Google</span>
              </button>
            </div>

            <p className={styles.switchText}>
              Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
