"use client";

import React, { useRef, useEffect, useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return mousePosition;
}

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace("#", "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const hexInt = parseInt(hex, 16);
  const red = (hexInt >> 16) & 255;
  const green = (hexInt >> 8) & 255;
  const blue = hexInt & 255;
  return [red, green, blue];
}

class Circle {
  private context: CanvasRenderingContext2D;
  private canvasSize: { w: number; h: number };
  private color: string;
  private size: number;
  private staticity: number;
  private ease: number;
  private vx: number;
  private vy: number;
  public x: number;
  public y: number;
  private initialX: number;
  private initialY: number;

  constructor(
    context: CanvasRenderingContext2D,
    canvasSize: { w: number; h: number },
    color: string,
    size: number,
    staticity: number,
    ease: number,
    vx: number,
    vy: number
  ) {
    this.context = context;
    this.canvasSize = canvasSize;
    this.color = color;
    this.size = size;
    this.staticity = staticity;
    this.ease = ease;
    this.vx = vx;
    this.vy = vy;

    this.x = Math.random() * this.canvasSize.w;
    this.y = Math.random() * this.canvasSize.h;
    this.initialX = this.x;
    this.initialY = this.y;
  }

  draw(mouse: { x: number; y: number }) {
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.size, 0, 2 * Math.PI, false);
    this.context.fillStyle = this.color;
    this.context.fill();

    let dx = this.x - mouse.x;
    let dy = this.y - mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const forceDirectionX = dx / distance;
    const forceDirectionY = dy / distance;
    const maxDistance = 100;
    const force = (maxDistance - distance) / maxDistance;

    if (distance < maxDistance) {
      this.x += forceDirectionX * force * this.staticity;
      this.y += forceDirectionY * force * this.staticity;
    }

    this.x += (this.initialX - this.x) / this.ease;
    this.y += (this.initialY - this.y) / this.ease;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x > this.canvasSize.w) this.x = 0;
    if (this.x < 0) this.x = this.canvasSize.w;
    if (this.y > this.canvasSize.h) this.y = 0;
    if (this.y < 0) this.y = this.canvasSize.h;
  }
}

const AnimatedBackground: React.FC<ParticlesProps> = ({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mousePosition = useMousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
    initCanvas();
    animate();
    window.addEventListener("resize", initCanvas);

    return () => {
      window.removeEventListener("resize", initCanvas);
    };
  }, []);

  useEffect(() => {
    onMouseMove();
  }, [mousePosition.x, mousePosition.y]);

  useEffect(() => {
    initCanvas();
  }, [refresh]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const onMouseMove = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = mousePosition.x - rect.left - w / 2;
      const y = mousePosition.y - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
      if (inside) {
        mouse.current.x = mousePosition.x - rect.left;
        mouse.current.y = mousePosition.y - rect.top;
      }
    }
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0;
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  const drawParticles = () => {
    if (context.current) {
      const [r, g, b] = hexToRgb(color);
      const circleColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
      for (let i = 0; i < quantity; i++) {
        circles.current.push(
          new Circle(
            context.current,
            canvasSize.current,
            circleColor,
            size,
            staticity,
            ease,
            vx,
            vy
          )
        );
      }
    }
  };

  const animate = () => {
    if (context.current) {
      context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
      circles.current.forEach((circle) => circle.draw(mouse.current));
      requestAnimationFrame(animate);
    }
  };

  return (
    <div className={className} ref={canvasContainerRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default AnimatedBackground;
