import { useState, useEffect, useRef } from 'react';

interface UseAnimatedCounterOptions {
  duration?: number;
  delay?: number;
  easing?: 'linear' | 'easeOut' | 'easeInOut';
}

export const useAnimatedCounter = (
  targetValue: number,
  options: UseAnimatedCounterOptions = {}
) => {
  const { duration = 1500, delay = 0, easing = 'easeOut' } = options;
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number>();

  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  };

  useEffect(() => {
    const startValue = previousValue.current;
    const startTime = performance.now() + delay;
    
    const animate = (currentTime: number) => {
      if (currentTime < startTime) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFunctions[easing](progress);
      
      const currentValue = startValue + (targetValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = targetValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, delay, easing]);

  return displayValue;
};

// Component version for easier use in JSX
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export const AnimatedNumber = ({
  value,
  duration = 1500,
  delay = 0,
  formatter = (v) => Math.round(v).toString(),
  className = '',
}: AnimatedNumberProps) => {
  const animatedValue = useAnimatedCounter(value, { duration, delay });
  
  return (
    <span className={className}>
      {formatter(animatedValue)}
    </span>
  );
};
