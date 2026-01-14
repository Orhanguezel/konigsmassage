// src/layout/ScrollProgress.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronUp } from "react-icons/fi";

const CIRCUMFERENCE = 308.66; // 2πr (r≈49)

function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const wrapRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ticking = false;

    const calc = () => {
      const total = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const p = (window.scrollY / total) * 100;
      setProgress(Math.max(0, Math.min(100, p)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(calc);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    calc(); // initial

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const onClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const dashOffset = CIRCUMFERENCE - (progress * CIRCUMFERENCE) / 100;

  return (
    <button
      ref={wrapRef}
      className={`progress-wrap${progress > 0 ? " active-progress" : ""}`}
      onClick={onClick}
      aria-label="Back to top"
      title="Back to top"
      type="button"
    >
      {/* Dairesel ilerleme */}
      <svg
        className="progress-circle"
        width="100%"
        height="100%"
        viewBox="-1 -1 102 102"
        aria-hidden="true"
      >
        <path
          d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"
          stroke="#3887FE"
          strokeWidth="4"
          fill="none"
          style={{
            strokeDasharray: `${CIRCUMFERENCE}px`,
            strokeDashoffset: `${dashOffset}px`,
            transition: "stroke-dashoffset 80ms linear",
          }}
        />
      </svg>

      {/* React Icons — Font Awesome yerine */}
      <span className="progress-icon" aria-hidden="true">
        <FiChevronUp size={20} />
      </span>

      {/* Sadece bu bileşene özel minimal stil */}
      <style jsx>{`
        .progress-wrap {
          position: fixed;
          right: 18px;
          bottom: 18px;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
          cursor: pointer;
          outline: none;
          border: 0;
          padding: 0;
          display: grid;
          place-items: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
          z-index: 999;
        }
        .progress-wrap.active-progress {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .progress-wrap:not(.active-progress) {
          transform: translateY(8px);
        }
        .progress-circle {
          position: absolute;
          inset: 0;
        }
        .progress-icon {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #3887fe;
        }
        .progress-wrap:hover .progress-icon {
          color: #1e6ff6;
        }
      `}</style>
    </button>
  );
}

export default ScrollProgress;
