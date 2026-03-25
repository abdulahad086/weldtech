import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

const SplitText = ({
  text="",
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  textAlign = 'center',
  tag: Tag = 'p'
}) => {
  const containerRef = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  useGSAP(() => {
    if (!containerRef.current || !fontsLoaded) return;
    const chars = containerRef.current.querySelectorAll('.split-char');
    if (!chars.length) return;
    gsap.fromTo(chars, 
      { ...from },
      { ...to, duration, ease, stagger: delay / 1000 }
    );
  }, { scope: containerRef, dependencies: [fontsLoaded, text] });

  const characters = String(text).split('').map((char, index) => {
    if (char === ' ') return <span key={index} style={{ display: 'inline-block', width: '0.3em' }}>&nbsp;</span>;
    return <span key={index} className="split-char" style={{ display: 'inline-block', willChange: 'transform, opacity' }}>{char}</span>;
  });

  return (
    <Tag ref={containerRef} className={className} style={{ textAlign, margin: 0, overflow: 'hidden' }}>
      {characters}
    </Tag>
  );
};
export default SplitText;