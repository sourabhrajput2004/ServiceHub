import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function ScrollProgress() {
  const barRef = useRef(null);
  const { pathname, search } = useLocation();
  const { tr } = useLanguage();

  useEffect(() => {
    let frame = null;
    const update = () => {
      frame = null;
      const page = document.scrollingElement || document.documentElement;
      const distance = Math.max(0, page.scrollHeight - page.clientHeight);
      const progress = distance > 0?  Math.min(1, Math.max(0, page.scrollTop / distance)) : 0;
      if (barRef.current) {
        barRef.current.style.setProperty('--scroll-progress', String(progress));
        barRef.current.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      }
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule, true);
    const observer = typeof ResizeObserver !== 'undefined'?  new ResizeObserver(schedule) : null;
    observer?.observe(document.documentElement);
    if (document.body) observer?.observe(document.body);
    update();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('load', schedule, true);
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [pathname, search]);

  return <div ref={barRef} className="scroll-progress" role="progressbar" aria-label={tr('Page scroll progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
    <span className="scroll-progress-fill" />
  </div>;
}
