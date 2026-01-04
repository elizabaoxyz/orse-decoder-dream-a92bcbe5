import { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
  char: string;
  opacity: number;
  createdAt: number;
}

const ASCII_CHARS = [':', '.', '+', '*', '#', '@', '█', '▓', '▒', '░', '■', '□'];

export const AsciiMouseEffect = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePos({ x, y });
      
      // Create new points around cursor
      const newPoints: Point[] = [];
      const radius = 60;
      const numPoints = 8;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (Math.PI * 2 * i) / numPoints + Math.random() * 0.5;
        const distance = Math.random() * radius;
        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance;
        
        newPoints.push({
          x: px,
          y: py,
          char: ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)],
          opacity: 0.3 + Math.random() * 0.7,
          createdAt: Date.now()
        });
      }
      
      setPoints(prev => [...prev.slice(-100), ...newPoints]);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
      setIsHovering(false);
      setPoints([]);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Fade out old points
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPoints(prev => 
        prev
          .map(p => ({
            ...p,
            opacity: Math.max(0, p.opacity - 0.05)
          }))
          .filter(p => p.opacity > 0 && now - p.createdAt < 2000)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {points.map((point, idx) => (
        <span
          key={`${point.createdAt}-${idx}`}
          className="absolute font-mono text-primary select-none transition-opacity duration-100"
          style={{
            left: point.x,
            top: point.y,
            opacity: point.opacity,
            fontSize: `${8 + Math.random() * 6}px`,
            transform: 'translate(-50%, -50%)',
            textShadow: `0 0 8px hsl(var(--primary) / 0.6)`,
          }}
        >
          {point.char}
        </span>
      ))}
    </div>
  );
};

export default AsciiMouseEffect;
