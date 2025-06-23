"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import AnimatedPlaceholderInput from "@/components/ui/animated-placeholder-input";
import { Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserPreferences } from "@/lib/types";

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

// Main Hero Component
interface HyperIronicHeroProps {
  userPreferences?: UserPreferences | null;
}

const HyperIronicHero: React.FC<HyperIronicHeroProps> = ({ userPreferences }) => {
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [showStaticPlaceholder, setShowStaticPlaceholder] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/chat?q=${encodeURIComponent(suggestion)}`);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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
    let intervalId: NodeJS.Timeout | null = null;

    const animatePlaceholder = () => {
      setIsTypingPlaceholder(true);
      const safeCurrentPlaceholderIndex = currentPlaceholderIndex % PLACEHOLDER_TEXTS.length;
      const currentText = PLACEHOLDER_TEXTS[safeCurrentPlaceholderIndex];

      let i = 0;
      setDisplayedPlaceholder('');

      intervalId = setInterval(() => {
        if (i < currentText.length) {
          setDisplayedPlaceholder((prev) => prev + currentText[i]);
          i++;
        } else {
          if (intervalId) clearInterval(intervalId);
          timeoutId = setTimeout(() => {
            setCurrentPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length);
          }, PLACEHOLDER_HOLD_MS);
        }
      }, PLACEHOLDER_TYPING_SPEED_MS);
    };

    animatePlaceholder();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isFocused, currentPlaceholderIndex, inputValue]);

  const handleSend = () => {
    if (inputValue.trim()) {
      router.push(`/chat?q=${encodeURIComponent(inputValue.trim())}&new_chat=true`);
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
            className="w-full max-w-2xl mb-16"
          >
            <div className="relative flex items-center w-full">
              <AnimatedPlaceholderInput
                ref={inputRef}
                type="text"
                className="w-full text-base md:text-lg lg:text-xl relative z-[1] flex-grow bg-transparent text-white border-zinc-600 focus:border-white ultra-smooth glass-morphism !ring-0 !ring-offset-0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Pulse AI anything..."
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    handleSend();
                  }
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
                    onClick={handleSend}
                    className="bg-white text-black hover:bg-neutral-200 h-10 w-10 ultra-smooth"
                    aria-label="Send message"
                  >
                    <Rocket className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

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
    </>
  );
};

export default HyperIronicHero;