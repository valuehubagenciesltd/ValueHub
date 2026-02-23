import { useState, useEffect } from 'react';
import '../styles/ComingSoon.css';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// 🔴 SET YOUR REAL DEADLINE HERE
const DEADLINE = new Date('2026-03-08T00:00:00');

export default function ComingSoon() {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = DEADLINE.getTime() - Date.now();

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

  return (
    <div className="coming-soon-container">
      <div className="content-wrapper">
        <div className="content">
          <h1 className="title">ValueHub</h1>
          <h2 className="subtitle">Coming Soon</h2>

          <p className="description">
            We're building something amazing for you. Get ready for the launch!
          </p>

          <p className="deadline">
            <strong>Date ya mwisho:</strong>{' '}
            {DEADLINE.toLocaleDateString()}
          </p>

          <div className="countdown">
            <div className="time-box">
              <div>{String(timeLeft.days).padStart(2, '0')}</div>
              <span>Days</span>
            </div>

            <div className="time-box">
              <div>{String(timeLeft.hours).padStart(2, '0')}</div>
              <span>Hours</span>
            </div>

            <div className="time-box">
              <div>{String(timeLeft.minutes).padStart(2, '0')}</div>
              <span>Minutes</span>
            </div>

            <div className="time-box">
              <div>{String(timeLeft.seconds).padStart(2, '0')}</div>
              <span>Seconds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}