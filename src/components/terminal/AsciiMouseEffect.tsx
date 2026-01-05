import { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
  char: string;
  opacity: number;
  createdAt: number;
  size: number;
}

const ASCII_CHARS = [":", ".", "+", "*", "#", "@", "█", "▓", "▒", "░", "■", "□"];

export const AsciiMouseEffect = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Only generate points while hovering to avoid unnecessary work.
      if (!isHovering) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

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
          createdAt: Date.now(),
          size: 8 + Math.random() * 6,
        });
      }

      setPoints((prev) => [...prev.slice(-100), ...newPoints]);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
      setIsHovering(false);
      setPoints([]);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isHovering]);

  // Fade out old points (avoid state updates when there are no points)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setPoints((prev) => {
        if (prev.length === 0) return prev;

        const next = prev
          .map((p) => ({
            ...p,
            opacity: Math.max(0, p.opacity - 0.06),
          }))
          .filter((p) => p.opacity > 0 && now - p.createdAt < 2000);

        return next.length === 0 ? [] : next;
      });
    }, 80);

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
            fontSize: `${point.size}px`,
            transform: "translate(-50%, -50%)",
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

