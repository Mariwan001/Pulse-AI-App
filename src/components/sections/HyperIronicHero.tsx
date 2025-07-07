"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserPreferences } from "@/lib/types";
import AuthModal from '../auth/AuthModal';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Constants for the placeholder animation
const PLACEHOLDER_TEXTS = [
  "Ask me about the meaning of life...",
  "Generate a poem for a friend...",
  "Tell me a joke...",
  "What's the capital of France?",
  "Help me plan my day...",
  "Draft an email to my boss..."
];
const PLACEHOLDER_TYPING_SPEED_MS = 60;
const PLACEHOLDER_HOLD_MS = 2000;


// Glass Effect Component
interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
  ({ className, width = "w-[360px] lg:w-[900px]", height = "h-[40px]", ...props }, ref) => {
    return (
      <div 
        className="fixed md:absolute animate-slide-up top-0 left-1/2 right-1/2 z-50" 
        ref={ref} 
        {...props}
      >
        <div className="flex flex-col items-center justify-center w-full">
          <div className={cn("relative overflow-hidden rounded-b-2xl", width, height)}>
            <div className="pointer-events-none absolute bottom-0 z-10 h-full w-[900px] overflow-hidden border border-[#f5f5f51a] rounded-b-2xl">
              <div className="glass-effect h-full w-full" />
            </div>
            <svg>
              <defs>
                <filter id="fractal-noise-glass">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.12 0.12"
                    numOctaves="1"
                    result="warp"
                  />
                  <feDisplacementMap
                    xChannelSelector="R"
                    yChannelSelector="G"
                    scale="30"
                    in="SourceGraphic"
                    in2="warp"
                  />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    );
  }
);
Glass.displayName = "Glass";

// Text Shimmer Component
interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = motion(Component as any);

  const dynamicSpread = React.useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text',
        'text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]',
        '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]',
        'dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]',
        className
      )}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
      style={{
        '--spread': `${dynamicSpread}px`,
        backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
      } as React.CSSProperties}
    >
      {children}
    </MotionComponent>
  );
}

// Particles Component
interface MousePositionState { // Renamed to avoid conflict with function name
  x: number;
  y: number;
}

function useMousePosition(): MousePositionState { // Changed function name to use convention
  const [mousePosition, setMousePosition] = useState<MousePositionState>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
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

const Particles: React.FC<ParticlesProps> = ({
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
  const mousePosition = useMousePosition(); // Use the hook
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
  }, [color]); // Added color to dependency array as it's used in drawCircle

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
        mouse.current.x = x;
        mouse.current.y = y;
      }
    }
  };

  type Circle = {
    x: number;
    y: number;
    translateX: number;
    translateY: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    dx: number;
    dy: number;
    magnetism: number;
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

  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const pSize = Math.floor(Math.random() * 2) + size;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.1;
    const dy = (Math.random() - 0.5) * 0.1;
    const magnetism = 0.1 + Math.random() * 4;
    return {
      x,
      y,
      translateX,
      translateY,
      size: pSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism,
    };
  };

  const rgb = hexToRgb(color);

  const drawCircle = (circle: Circle, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.current.translate(translateX, translateY);
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
      context.current.fill();
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!update) {
        circles.current.push(circle);
      }
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h,
      );
    }
  };

  const drawParticles = () => {
    clearContext();
    const particleCount = quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  };

  const remapValue = (
    value: number,
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ): number => {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const animate = () => {
    clearContext();
    circles.current.forEach((circle: Circle, i: number) => {
      const edge = [
        circle.x + circle.translateX - circle.size,
        canvasSize.current.w - circle.x - circle.translateX - circle.size,
        circle.y + circle.translateY - circle.size,
        canvasSize.current.h - circle.y - circle.translateY - circle.size,
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(
        remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
      );
      if (remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha) {
          circle.alpha = circle.targetAlpha;
        }
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;
      circle.translateX +=
        (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) /
        ease;
      circle.translateY +=
        (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) /
        ease;

      drawCircle(circle, true);

      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        circles.current.splice(i, 1);
        const newCircle = circleParams();
        drawCircle(newCircle);
      }
    });
    window.requestAnimationFrame(animate);
  };

  return (
    <div
      className={cn("pointer-events-none", className)}
      ref={canvasContainerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};

// Container Scroll Component
export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>; // Added translate here as it's passed to Card in ContainerScroll
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div className=" h-full w-full  overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4 ">
        {children}
      </div>
    </motion.div>
  );
};

// Icon Components
export const AppleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlSpace="preserve" 
    viewBox="0 0 512 512"
    className={className}
  >
    <path d="M256 6.3C114.6 6.3 0 120.9 0 262.3c0 113.3 73.3 209 175 242.9 12.8 2.2 17.6-5.4 17.6-12.2 0-6.1-.3-26.2-.3-47.7-64.3 11.8-81-15.7-86.1-30.1-2.9-7.4-15.4-30.1-26.2-36.2-9-4.8-21.8-16.6-.3-17 20.2-.3 34.6 18.6 39.4 26.2 23 38.7 59.8 27.8 74.6 21.1 2.2-16.6 9-27.8 16.3-34.2-57-6.4-116.5-28.5-116.5-126.4 0-27.8 9.9-50.9 26.2-68.8-2.6-6.4-11.5-32.6 2.6-67.8 0 0 21.4-6.7 70.4 26.2 20.5-5.8 42.2-8.6 64-8.6s43.5 2.9 64 8.6c49-33.3 70.4-26.2 70.4-26.2 14.1 35.2 5.1 61.4 2.6 67.8 16.3 17.9 26.2 40.6 26.2 68.8 0 98.2-59.8 120-116.8 126.4 9.3 8 17.3 23.4 17.3 47.4 0 34.2-.3 61.8-.3 70.4 0 6.7 4.8 14.7 17.6 12.2C438.7 471.3 512 375.3 512 262.3c0-141.4-114.6-256-256-256" style={{fillRule:'evenodd',clipRule:'evenodd',fill:'#fff'}}/>
  </svg>
);

export const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlSpace="preserve" 
    viewBox="0 0 512 512"
    className={className}
  >
    <path d="M501.8 261.8c0-18.2-1.6-35.6-4.7-52.4H256v99.1h137.8c-6.1 31.9-24.2 58.9-51.4 77V450h83.1c48.3-44.6 76.3-110.2 76.3-188.2" style={{ fill: '#4285f4' }}/>
    <path d="M256 512c69.1 0 127.1-22.8 169.4-61.9l-83.1-64.5c-22.8 15.4-51.9 24.7-86.3 24.7-66.6 0-123.1-44.9-143.4-105.4H27.5V371C69.6 454.5 155.9 512 256 512" style={{ fill: '#34a853' }}/>
    <path d="M112.6 304.6c-5.1-15.4-8.1-31.7-8.1-48.6s3-33.3 8.1-48.6v-66.1H27.5C10 175.7 0 214.6 0 256s10 80.3 27.5 114.7L93.8 319c0 .1 18.8-14.4 18.8-14.4" style={{ fill: '#fbbc05' }}/>
    <path d="M256 101.9c37.7 0 71.2 13 98 38.2l73.3-73.3C382.8 25.4 325.1 0 256 0 155.9 0 69.6 57.5 27.5 141.3l85.2 66.1c20.2-60.5 76.7-105.5 143.3-105.5" style={{ fill: '#ea4335' }}/>
    <path d="M0 0h512v512H0z" style={{ fill: 'none' }}/>
  </svg>
);

export const SupabaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlSpace="preserve" 
    viewBox="0 0 512 512"
    className={className}
  >
    <defs>
      <linearGradient id="supabaseGradient" x1="237.109" x2="419.106" y1="223.219" y2="146.89" gradientTransform="matrix(1 0 0 -1 0 513)" gradientUnits="userSpaceOnUse">
        <stop offset="0" style={{ stopColor: '#249361' }}/>
        <stop offset="1" style={{ stopColor: '#3ecf8e' }}/>
      </linearGradient>
      <linearGradient id="supabaseGradientDark" x1="245.829" x2="328.829" y1="411.681" y2="255.438" gradientTransform="matrix(1 0 0 -1 0 513)" gradientUnits="userSpaceOnUse">
        <stop offset="0" style={{ stopColor: '#000' }}/>
        <stop offset="1" style={{ stopColor: '#000', stopOpacity: 0 }}/>
      </linearGradient>
    </defs>
    <path d="M297.6 501c-12.9 16.3-39.2 7.4-39.5-13.4L253.6 183h204.8c37.1 0 57.8 42.8 34.7 71.9z" style={{ fill: 'url(#supabaseGradient)' }}/>
    <path d="M297.6 501c-12.9 16.3-39.2 7.4-39.5-13.4L253.6 183h204.8c37.1 0 57.8 42.8 34.7 71.9z" style={{ fill: 'url(#supabaseGradientDark)', fillOpacity: 0.2 }}/>
    <path d="M214.4 11c12.9-16.3 39.2-7.4 39.5 13.4l2 304.5H53.7c-37.1 0-57.8-42.8-34.7-71.9z" style={{ fill: '#3ecf8e' }}/>
  </svg>
);

export const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    xmlSpace="preserve" 
    viewBox="0 0 512 512"
    className={className}
  >
    <path d="M256 6.3C114.6 6.3 0 120.9 0 262.3c0 113.3 73.3 209 175 242.9 12.8 2.2 17.6-5.4 17.6-12.2 0-6.1-.3-26.2-.3-47.7-64.3 11.8-81-15.7-86.1-30.1-2.9-7.4-15.4-30.1-26.2-36.2-9-4.8-21.8-16.6-.3-17 20.2-.3 34.6 18.6 39.4 26.2 23 38.7 59.8 27.8 74.6 21.1 2.2-16.6 9-27.8 16.3-34.2-57-6.4-116.5-28.5-116.5-126.4 0-27.8 9.9-50.9 26.2-68.8-2.6-6.4-11.5-32.6 2.6-67.8 0 0 21.4-6.7 70.4 26.2 20.5-5.8 42.2-8.6 64-8.6s43.5 2.9 64 8.6c49-33.3 70.4-26.2 70.4-26.2 14.1 35.2 5.1 61.4 2.6 67.8 16.3 17.9 26.2 40.6 26.2 68.8 0 98.2-59.8 120-116.8 126.4 9.3 8 17.3 23.4 17.3 47.4 0 34.2-.3 61.8-.3 70.4 0 6.7 4.8 14.7 17.6 12.2C438.7 471.3 512 375.3 512 262.3c0-141.4-114.6-256-256-256" style={{fillRule:'evenodd',clipRule:'evenodd',fill:'#fff'}}/>
  </svg>
);

const SignInIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 -0.5 25 25" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M15.014 8.46835C14.7204 8.17619 14.2455 8.17737 13.9533 8.47099C13.6612 8.76462 13.6624 9.23949 13.956 9.53165L15.014 8.46835ZM16.971 12.5317C17.2646 12.8238 17.7395 12.8226 18.0317 12.529C18.3238 12.2354 18.3226 11.7605 18.029 11.4683L16.971 12.5317ZM18.029 12.5317C18.3226 12.2395 18.3238 11.7646 18.0317 11.471C17.7395 11.1774 17.2646 11.1762 16.971 11.4683L18.029 12.5317ZM13.956 14.4683C13.6624 14.7605 13.6612 15.2354 13.9533 15.529C14.2455 15.8226 14.7204 15.8238 15.014 15.5317L13.956 14.4683ZM17.5 12.75C17.9142 12.75 18.25 12.4142 18.25 12C18.25 11.5858 17.9142 11.25 17.5 11.25V12.75ZM3.5 11.25C3.08579 11.25 2.75 11.5858 2.75 12C2.75 12.4142 3.08579 12.75 3.5 12.75V11.25ZM13.956 9.53165L16.971 12.5317L18.029 11.4683L15.014 8.46835L13.956 9.53165ZM16.971 11.4683L13.956 14.4683L15.014 15.5317L18.029 12.5317L16.971 11.4683ZM17.5 11.25H3.5V12.75H17.5V11.25Z" fill="currentColor"/>
    <path d="M9.5 15C9.5 17.2091 11.2909 19 13.5 19H17.5C19.7091 19 21.5 17.2091 21.5 15V9C21.5 6.79086 19.7091 5 17.5 5H13.5C11.2909 5 9.5 6.79086 9.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LoginIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M10.8447 8.09467C10.5518 8.38756 10.5518 8.86244 10.8447 9.15533L12.5643 10.875H4.375C3.96079 10.875 3.625 11.2108 3.625 11.625C3.625 12.0392 3.96079 12.375 4.375 12.375H12.5643L10.8447 14.0947C10.5518 14.3876 10.5518 14.8624 10.8447 15.1553C11.1376 15.4482 11.6124 15.4482 11.9053 15.1553L14.9053 12.1553C15.1982 11.8624 15.1982 11.3876 14.9053 11.0947L11.9053 8.09467C11.6124 7.80178 11.1376 7.80178 10.8447 8.09467Z" fill="currentColor"/>
    <path d="M12.375 5.87745C12.375 6.3254 12.6492 6.71725 12.966 7.03401L15.966 10.034C16.8447 10.9127 16.8447 12.3373 15.966 13.216L12.966 16.216C12.6492 16.5327 12.375 16.9246 12.375 17.3726V19.625C16.7933 19.625 20.375 16.0433 20.375 11.625C20.375 7.20672 16.7933 3.625 12.375 3.625V5.87745Z" fill="currentColor"/>
  </svg>
);

// Main Hero Component
interface HyperIronicHeroProps {
  userPreferences?: UserPreferences | null;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  authMode: 'signup' | 'login' | 'reset';
  setAuthMode: (mode: 'signup' | 'login' | 'reset') => void;
}

const ShineText: React.FC<{ children: string }> = ({ children }) => {
  return (
    <span className="shine-text">
      {children.split('').map((char, i) => (
        char === ' '
          ? <span key={i} className="shine-letter" style={{ animationDelay: `${i * 0.04}s` }}>&nbsp;</span>
          : <span key={i} className="shine-letter" style={{ animationDelay: `${i * 0.04}s` }}>{char}</span>
      ))}
    </span>
  );
};

const HyperIronicHero: React.FC<HyperIronicHeroProps> = ({ userPreferences, authOpen, setAuthOpen, authMode, setAuthMode }) => {
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [showStaticPlaceholder, setShowStaticPlaceholder] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [redirected, setRedirected] = useState(false);

  // Personalized suggestions based on user preferences
  const getPersonalizedSuggestions = () => {
    const baseSuggestions = [
      "Explain quantum computing simply",
      "Draft an email for a new project",
      "What are healthy dinner ideas?",
      "Tell me a fun fact",
      "Write a poem about a cat",
      "Suggest a good book to read",
      "How does photosynthesis work?",
      "Plan a weekend trip to the mountains",
      "Brainstorm names for a new coffee shop",
      "Summarize the plot of Hamlet",
      "What's the weather like in Paris?",
      "Give me a recipe for chocolate chip cookies",
      "Generate a list of startup ideas for 2024",
      "Translate 'hello world' to Spanish",
      "Who won the last FIFA World Cup?",
      "Recommend a good sci-fi movie",
      "Explain the theory of relativity in simple terms",
      "Write a short story about a time-traveling cat"
    ];

    if (userPreferences?.userName) {
      // Add personalized suggestions
      const personalizedSuggestions = [
        `Hello ${userPreferences.userName}, can you help me with...`,
        `What would ${userPreferences.aiName || 'AI'} recommend for ${userPreferences.userName}?`,
        `Give ${userPreferences.userName} some advice on...`,
        `Create a personalized greeting for ${userPreferences.userName}`
      ];
      
      return [...personalizedSuggestions, ...baseSuggestions];
    }

    return baseSuggestions;
  };

  const suggestions = getPersonalizedSuggestions();

  const handleSuggestionClick = async (suggestion: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('handleSuggestionClick session:', session);
    if (session && session.user && session.user.email) {
      router.push(`/chat?q=${encodeURIComponent(suggestion)}`);
    } else {
      toast({
        title: 'Please log in or sign up',
        description: 'You need to be signed in to use Pulse AI chat.',
      });
      setAuthMode('login');
      setAuthOpen(true);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      setAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('DEBUG: session from supabase.auth.getSession()', session);
      setIsAuthenticated(!!(session && session.user && typeof session.user.email === 'string' && session.user.email.length > 0));
      setAuthLoading(false);
    };
    checkSession();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      checkSession();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router, redirected]);

  // Animated Placeholder Effect
  useEffect(() => {
    if (isFocused || !PLACEHOLDER_TEXTS || PLACEHOLDER_TEXTS.length === 0) {
      if (!inputValue) {
        setDisplayedPlaceholder('');
      }
      setIsTypingPlaceholder(false);
      return;
    }

    setShowStaticPlaceholder(false);

    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;
    const currentTextRaw = PLACEHOLDER_TEXTS[currentPlaceholderIndex % PLACEHOLDER_TEXTS.length];
    const currentText = typeof currentTextRaw === 'string' ? currentTextRaw : '';
    setDisplayedPlaceholder("");
    setIsTypingPlaceholder(true);

    function typeSentence(idx: number) {
      if (isCancelled) return;
      if (idx < currentText.length) {
        const char = currentText[idx];
        if (typeof char === 'string') {
          setDisplayedPlaceholder((prev) => prev + char);
        }
        timeoutId = setTimeout(() => typeSentence(idx + 1), PLACEHOLDER_TYPING_SPEED_MS);
      } else {
        setIsTypingPlaceholder(false);
        timeoutId = setTimeout(() => {
          setCurrentPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
        }, PLACEHOLDER_HOLD_MS);
      }
    }

    typeSentence(0);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isFocused, currentPlaceholderIndex, inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    // Check if user is authenticated and has an email and id
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user || !user.email || !user.id) {
      toast({
        title: 'Please log in or sign up',
        description: 'You need to be signed in to use Pulse AI chat.',
      });
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    // Only send the message if authenticated
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: inputValue.trim(), 
          userEmail: user.email,
          userId: user.id // Always pass userId
        })
      });
      
      console.log('HyperIronicHero: API response status:', response.status);
      console.log('HyperIronicHero: API response ok:', response.ok);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('HyperIronicHero: Raw response text:', responseText);
        console.log('HyperIronicHero: Response text length:', responseText.length);
        console.log('HyperIronicHero: Response text first 100 chars:', responseText.substring(0, 100));
        
        try {
          const data = JSON.parse(responseText);
          console.log('HyperIronicHero: Parsed JSON data:', data);
          
          if (data.session_id) {
            console.log('HyperIronicHero: Found session_id, redirecting to:', `/chat?q=${encodeURIComponent(inputValue.trim())}&session_id=${data.session_id}`);
            
            // Store the message in sessionStorage as backup
            sessionStorage.setItem('pendingMessage', inputValue.trim());
            sessionStorage.setItem('pendingSessionId', data.session_id);
            
            // Store user email for session persistence
            sessionStorage.setItem('userEmail', user.email);
            if (user.id) {
              sessionStorage.setItem('userId', user.id);
            }
            
            router.push(`/chat?q=${encodeURIComponent(inputValue.trim())}&session_id=${data.session_id}`);
          } else {
            console.error('HyperIronicHero: No session_id in response');
            router.push('/chat');
          }
        } catch (parseError) {
          console.error('HyperIronicHero: JSON parse error:', parseError);
          console.log('HyperIronicHero: Raw response that failed to parse:', responseText);
          router.push('/chat');
        }
      } else {
        console.error('HyperIronicHero: API response not ok:', response.status, response.statusText);
        router.push('/chat');
      }
    } catch (fetchError) {
      console.error('HyperIronicHero: Fetch error:', fetchError);
      router.push('/chat');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowStaticPlaceholder(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!inputValue) {
      setShowStaticPlaceholder(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        /* ... existing styles ... */
        .glass-effect {
          background: rgba(0, 0, 0, 0.2);
          background: repeating-radial-gradient(
            circle at 50% 50%,
            rgb(255 255 255 / 0),
            rgba(255, 255, 255, 0.2) 10px,
            rgb(255 255 255) 31px
          );
          filter: url(#fractal-noise-glass);
          background-size: 6px 6px;
          backdrop-filter: blur(0px);
        }

        @keyframes slide-up {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .kinetic-text {
          background: linear-gradient(
            45deg,
            #c0c0c0,
            #ffffff,
            #e5e5e5,
            #f8f8f8,
            #c0c0c0
          );
          background-size: 400% 400%;
          animation: kinetic-flow 4s ease-in-out infinite;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @keyframes kinetic-flow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ultra-smooth {
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .whisper-in {
          animation: whisper-in 2s ease-out forwards;
        }

        @keyframes whisper-in {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .shine-text {
          display: inline-block;
          position: relative;
        }
        .shine-letter {
          display: inline-block;
          transition: color 0.3s;
        }
        .shine-text:hover .shine-letter {
          animation: shine 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes shine {
          0% { color: inherit; text-shadow: none; }
          40% { color: #fffbe6; text-shadow: 0 0 8px #fffbe6, 0 0 16px #fffbe6; }
          100% { color: inherit; text-shadow: none; }
        }

        /* Icon hover effects */
        .apple-icon {
          color: white;
          transition: color 0.3s ease;
        }
        .group:hover .apple-icon {
          color: black;
        }

        .google-icon {
          transition: all 0.3s ease;
        }
        .google-icon .google-blue {
          fill: black;
          transition: fill 0.3s ease;
        }
        .google-icon .google-green {
          fill: black;
          transition: fill 0.3s ease;
        }
        .google-icon .google-yellow {
          fill: black;
          transition: fill 0.3s ease;
        }
        .google-icon .google-red {
          fill: black;
          transition: fill 0.3s ease;
        }
        .google-icon:hover .google-blue {
          fill: #4285f4;
        }
        .google-icon:hover .google-green {
          fill: #34a853;
        }
        .google-icon:hover .google-yellow {
          fill: #fbbc05;
        }
        .google-icon:hover .google-red {
          fill: #ea4335;
        }

        .supabase-icon {
          color: white;
          transition: color 0.3s ease;
        }
        .supabase-icon:hover {
          color: #3ecf8e;
        }

        /* Ironic mode button animation */
        .ironic-btn {
          position: relative;
          overflow: hidden;
        }
        .ironic-btn::after {
          content: '';
          position: absolute;
          left: 0; top: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, #fff2, #fff0 60%, #fff2);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        .ironic-btn:hover::after {
          opacity: 1;
          animation: ironic-shimmer 1.2s linear infinite;
        }
        @keyframes ironic-shimmer {
          0% { background-position: -100px; }
          100% { background-position: 200px; }
        }

        /* Smooth text transition effects */
        .smooth-text-change {
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}</style>
      
      <div className="w-full min-h-screen relative">
        {/* Glass Effect at Top */}
        {/* <Glass className="z-20" /> */}

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-thin mb-6 tracking-wider">
              Pulse AI
            </h1>
            <p className="text-2xl md:text-4xl font-light text-zinc-300 tracking-[0.2em]">
              AI-POWERED CREATIVITY
            </p>
          </motion.div>

          {/* Ironic Subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="whisper-in text-center mb-8"
          >
            <p className="text-lg md:text-xl text-zinc-400 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
              Transform ideas into reality with intelligent AI assistance.
              <br />
              <span className="text-zinc-500 text-sm italic">
                (Where creativity meets artificial intelligence)
              </span>
            </p>
          </motion.div>

          {/* Input Field Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="w-full max-w-2xl mb-6"
          >
            <div className="relative flex items-center w-full">
              <ReactTextareaAutosize
                minRows={1}
                maxRows={6}
                ref={inputRef as any}
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                placeholder={displayedPlaceholder || "Ask Pulse AI anything..."}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
                    e.preventDefault();
                    await handleSend();
                  }
                }}
                className="w-full text-sm md:text-base lg:text-lg relative z-[1] flex-grow bg-transparent text-white border-zinc-600 focus:border-white ultra-smooth glass-morphism !ring-0 !ring-offset-0 resize-none transition-all duration-300 placeholder:text-zinc-400 min-h-[48px] max-h-[180px] leading-[1.5] rounded-md text-left placeholder:text-left placeholder:pl-2 placeholder:text-base py-3 pl-3 overflow-hidden pr-2 text-[16px]"
                style={{
                  textAlign: 'left',
                }}
              />
              {inputValue.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="ml-2 z-[1]"
                >
                  <Button
                    variant="default"
                    size="icon"
                    onClick={async () => { await handleSend(); }}
                    className="bg-white text-black hover:bg-neutral-200 h-10 w-10 ultra-smooth"
                    aria-label="Send message"
                  >
                    <Rocket className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Auth Mode Buttons - now after input, before provider buttons */}
          { (!authLoading && !isAuthenticated) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="flex flex-row items-center justify-center gap-6 w-full mb-12 mt-16"
          >
            <Button
              onClick={() => { setMode('signup'); setAuthMode('signup'); setAuthOpen(true); }}
              className={cn(
                "group w-48 h-12 text-lg glass-morphism ultra-smooth border border-white/20 shadow-[0_2px_16px_rgba(255,255,255,0.08)] active:scale-95 px-0 py-0 text-white font-semibold rounded-xl backdrop-blur-lg bg-white/10 transition-colors",
                mode === 'signup' ? 'bg-white/20 border-white/40' : ''
              )}
              style={{ fontWeight: 600 }}
              variant="ghost"
            >
              <span className="flex items-center justify-center gap-3 w-full">
                <SignInIcon className="w-10 h-10" />
                <ShineText>{mode === 'signup' ? 'Sign up' : 'Sign up'}</ShineText>
              </span>
            </Button>
            <Button
              onClick={() => { setMode('login'); setAuthMode('login'); setAuthOpen(true); }}
              className={cn(
                "group w-48 h-12 text-lg glass-morphism ultra-smooth border border-white/20 shadow-[0_2px_16px_rgba(255,255,255,0.08)] active:scale-95 px-0 py-0 text-white font-semibold rounded-xl backdrop-blur-lg bg-white/10 transition-colors",
                mode === 'login' ? 'bg-white/20 border-white/40' : ''
              )}
              style={{ fontWeight: 600 }}
              variant="ghost"
            >
              <span className="flex items-center justify-center gap-3 w-full">
                <LoginIcon className="w-10 h-10" />
                <ShineText>{mode === 'login' ? 'Log in' : 'Log in'}</ShineText>
              </span>
            </Button>
          </motion.div>
          )}

          {/* Suggestions Marquee */}
          <motion.div
            className="w-full mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            <div className="relative overflow-hidden marquee-fade-container">
              <div className="flex animate-marquee-fast md:animate-marquee whitespace-nowrap">
                {[...suggestions, ...suggestions].map((suggestion, index) => (
                  <motion.div
                    key={`suggestion-${index}`}
                    className="relative flex-shrink-0 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 mx-2 w-auto"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <p className="text-sm text-white/80 font-light whitespace-normal text-center">{suggestion}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <AuthModal
        open={authOpen}
        mode={authMode}
        onOpenChange={(open) => {
          setAuthOpen(open);
          if (open) {
            setAuthMode(mode);
          }
          // No reload or polling needed; UI will update based on session state
        }}
        onModeChange={setAuthMode}
      />
    </>
  );
};

export default HyperIronicHero;