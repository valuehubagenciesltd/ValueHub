import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import '../styles/ComingSoon.css';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function ComingSoon() {
  const THIRTEEN_DAYS_MS = 13 * 24 * 60 * 60 * 1000;

  const targetDate = new Date(Date.now() + THIRTEEN_DAYS_MS);

  const calculateTimeLeft = (): TimeLeft => {
    const difference = targetDate.getTime() - Date.now();

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
    <div className="countdown">
      <TimeUnit value={timeLeft.days} label="Days" delay={0} />
      <TimeUnit value={timeLeft.hours} label="Hours" delay={0.1} />
      <TimeUnit value={timeLeft.minutes} label="Minutes" delay={0.2} />
      <TimeUnit value={timeLeft.seconds} label="Seconds" delay={0.3} />
    </div>
  );
}