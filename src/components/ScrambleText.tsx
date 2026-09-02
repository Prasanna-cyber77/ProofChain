import React, { useEffect, useState, useRef } from 'react';

const CHARS = '0123456789ABCDEF_#$%=+*~<>/[]';

interface ScrambleTextProps {
  text: string;
  className?: string;
  speed?: number;
  trigger?: any;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  className = '',
  speed = 25,
  trigger
}) => {
  const [displayText, setDisplayText] = useState(text);
  const iterationRef = useRef(0);
  const intervalRef = useRef<any>(null);

  const startScramble = () => {
    clearInterval(intervalRef.current);
    iterationRef.current = 0;

    intervalRef.current = setInterval(() => {
      setDisplayText(() => {
        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iterationRef.current) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');
      });

      if (iterationRef.current >= text.length) {
        clearInterval(intervalRef.current);
      }

      iterationRef.current += 1 / 2;
    }, speed);
  };

  useEffect(() => {
    startScramble();
    return () => clearInterval(intervalRef.current);
  }, [text, trigger]);

  return <span className={className}>{displayText}</span>;
};
