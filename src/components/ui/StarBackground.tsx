import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

const StarBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateStars();
    };

    const generateStars = () => {
      const stars: Star[] = [];
      const starCount = Math.floor((canvas.width * canvas.height) / 6000);

      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.05 + 0.01,
        });
      }
      starsRef.current = stars;
    };

    const drawStars = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      starsRef.current.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(242, 247, 161, ${star.opacity})`;
        ctx.fill();
        
        // Gently move the stars
        star.y += star.speed;
        
        // Reset position if star moves off-screen
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(drawStars);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    drawStars();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default StarBackground;