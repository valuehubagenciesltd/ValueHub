import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import '../styles/ComingSoon.css';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const THIRTEEN_DAYS_MS = 13 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'valuehub-launch-date';

export default function ComingSoon() {
  const getOrCreateTargetDate = (): number => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return Number(stored);
    }

    const newTarget = Date.now() + THIRTEEN_DAYS_MS;
    localStorage.setItem(STORAGE_KEY, String(newTarget));
    return newTarget;
  };

  const targetDateRef = useRef<number>(getOrCreateTargetDate());

  const calculateTimeLeft = (): TimeLeft => {
    const difference = targetDateRef.current - Date.now();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({
    value,
    label,
    delay,
  }: {
    value: number;
    label: string;
    delay: number;
  }) => (
    <div
      className="time-unit"
      style={{ '--delay': `${delay}s` } as CSSProperties}
    >
      <div className="time-value">
        {String(value).padStart(2, '0')}
      </div>
      <div className="time-label">{label}</div>
    </div>
  );

  return (
    <div className="coming-soon-container">
      <div className="content-wrapper">
        <div className="animated-background"></div>

        <div className="content">
          <h1 className="title">ValueHub</h1>
          <h2 className="subtitle">Coming Soon</h2>

          <p className="description">
            We're building something amazing for you. Get ready for the launch!
          </p>

          <div className="countdown">
            <TimeUnit value={timeLeft.days} label="Days" delay={0} />
            <div className="separator">:</div>
            <TimeUnit value={timeLeft.hours} label="Hours" delay={0.1} />
            <div className="separator">:</div>
            <TimeUnit value={timeLeft.minutes} label="Minutes" delay={0.2} />
            <div className="separator">:</div>
            <TimeUnit value={timeLeft.seconds} label="Seconds" delay={0.3} />
          </div>
        </div>

        <div className="floating-elements">
          <div className="float-item float-1"></div>
          <div className="float-item float-2"></div>
          <div className="float-item float-3"></div>
          <div className="float-item float-4"></div>
        </div>
      </div>
    </div>
  );
}