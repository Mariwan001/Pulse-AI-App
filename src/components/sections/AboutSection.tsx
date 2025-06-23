"use client";

import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card'; 
import { Badge } from '@/components/ui/badge'; 
import { User, Cpu, Zap, Sparkles, FlaskConical, Wand2, Palette, Code2, Rocket, Brain, Lightbulb, Terminal } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

// Utility function for cn (tailwind-merge)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimelineItem {
  year: string;
  title: string;
  description: string;
  type: 'milestone' | 'achievement' | 'pivot';
  icon?: string;
}

interface AboutSectionProps {
  aboutText?: string;
  philosophy?: string;
  timelineItems?: TimelineItem[];
}

const AboutSection: React.FC<AboutSectionProps> = ({
  aboutText = "Well, hey there! I'm Mariwan, a software engineer with a passion for building innovative and engaging projects. I thrive on combining technology and creativity to create unique experiences that push boundaries.\n\nRight now, I'm developing CodePulse, an AI-driven chat system that is constantly evolving. Unlike traditional AI chat models, CodePulse is designed to become a truly humanized conversational AI capable of engaging in dynamic, natural, and intuitive interactions. My vision is to make AI feel more personal and immersive, continuously refining its ability to understand and respond like a real conversation partner.\n\nBeyond conversational AI, I'm deeply fascinated by AI-generated art and want to integrate creative capabilities into my model. I believe AI can go beyond simple automation it can be a powerful tool for producing stunning, unique visuals that merge artistic intuition with advanced algorithms. The goal is to make AI not just think but create in ways that surprise and inspire.\n\nEach day, I refine CodePulse, adding new features and improving its intelligence, responsiveness, and creative depth. This project is more than just code, it's a journey toward redefining how people interact with AI.\n\nI appreciate you taking the time to read this, and I can't wait to see where CodePulse goes next. Exciting things are ahead!",
  philosophy = "The truly ambitious do not chase dreams—they architect them. With discipline as the foundation, creativity as the blueprint, and smartness as the compass, they move with unwavering seriousness toward a vision shaped by ideals, not trends. Their path is not chaotic, but calculated—driven not by noise, but by clarity. In their world, every thought is intention, every action is precision, and every setback is fuel. They do not wait for the future they build it, one deliberate moment at a time.",
  timelineItems = [
    {
      year: "2024",
      title: "Senior Digital Alchemist",
      description: "Transmuting coffee into code with 99.7% efficiency",
      type: "milestone",
      icon: "FlaskConical"
    },
    {
      year: "2023",
      title: "UI Whisperer Certification",
      description: "Achieved fluency in speaking to buttons and convincing divs to behave",
      type: "achievement",
      icon: "Wand2"
    },
    {
      year: "2022",
      title: "The Great Refactor",
      description: "Rewrote the laws of physics to make animations smoother",
      type: "pivot",
      icon: "Palette"
    },
    {
      year: "2021",
      title: "Minimalism Maximalist",
      description: "Discovered how to say more with less, then said it beautifully",
      type: "milestone",
      icon: "Code2"
    }
  ]
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'philosophy' | 'timeline'>('about');
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    })
  };

  const glassEffect = "backdrop-blur-xl bg-white/5 border border-white/10";
  const shimmerEffect = "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000";

  const MobileCard = ({ children, className, icon: Icon = User, title, badgeText, badgeIcon: BadgeIcon, ...props }: { children: React.ReactNode; className?: string; icon?: React.ElementType; title: string; badgeText?: string; badgeIcon?: React.ElementType; }) => {
    return (
      <Card className={cn(
        "relative p-4 overflow-hidden",
        "bg-gradient-to-br from-slate-900/80 to-black/80 border border-white/10 rounded-3xl shadow-lg",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        "after:absolute after:inset-0 after:rounded-3xl after:border after:border-transparent hover:after:border-white/20 after:transition-colors after:duration-300",
        className
      )} {...props}>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-light text-white tracking-wide">{title}</h3>
            {badgeText && (
              <Badge variant="outline" className="border-white/20 text-white/70 bg-white/5">
                {BadgeIcon && <BadgeIcon className="w-2 h-2 mr-1" />}
                {badgeText}
              </Badge>
            )}
          </div>
          {children}
        </div>
      </Card>
    );
  };

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity }}
      className="flex flex-col justify-center relative py-16"
    >
      

      <motion.div
        className="w-full px-4 md:px-8 lg:px-12 relative z-10"
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-4"
        >
          <motion.h2
            className="text-3xl md:text-5xl font-thin text-white mb-3 tracking-wider"
            initial={{ letterSpacing: "0.5em", opacity: 0 }}
            animate={isInView ? { letterSpacing: "0.1em", opacity: 1 } : {}}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            About
          </motion.h2>
          <motion.div
            className="w-16 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </motion.div>



        {/* Mobile View with Tabs */}
        <div className="md:hidden w-full px-4 relative z-10">
          <div className="flex justify-around mb-6 p-1 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-sm">
            {(['about', 'philosophy', 'timeline'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "w-full py-2 px-4 text-sm font-light rounded-full transition-colors duration-300 focus:outline-none",
                  "capitalize",
                  activeTab === tab
                    ? "text-black bg-white"
                    : "text-white hover:bg-white/10"
                )}
              >
                {tab === 'timeline' ? 'Time-line' : tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {activeTab === 'about' && (
                <MobileCard icon={User} title="About Me" badgeText="Authentically Ironic" badgeIcon={Sparkles}>
                  <p className="text-slate-300 leading-relaxed text-sm font-light flex-1">{aboutText}</p>
                  <div className="mt-4 flex gap-2">
                    {['Perfectionist', 'Overthinker', 'Digital Poet'].map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-white/5 text-white/60 border-white/10">{tag}</Badge>
                    ))}
                  </div>
                </MobileCard>
              )}
              {activeTab === 'philosophy' && (
                <MobileCard icon={Brain} title="Philosophy" badgeText="Mindful Reflection">
                  <blockquote className="text-sm font-thin text-white leading-relaxed italic text-center">"{philosophy}"</blockquote>
                  <div className="mt-4 w-12 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto" />
                </MobileCard>
              )}
              {activeTab === 'timeline' && (
                <MobileCard icon={Zap} title="Time-line" badgeText="My Journey">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {timelineItems.map((item, index) => {
                      const IconComponent = { 'FlaskConical': FlaskConical, 'Wand2': Wand2, 'Palette': Palette, 'Code2': Code2, 'Rocket': Rocket, 'Brain': Brain, 'Lightbulb': Lightbulb }[item.icon || 'Terminal'] || Terminal;
                      return (
                        <div key={index} className="relative group">
                          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-2 h-full transition-all duration-300 hover:bg-white/10 hover:border-white/20 flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1 rounded-full bg-white/10 backdrop-blur-sm flex-shrink-0">
                                <IconComponent className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-sm font-thin text-white">{item.year}</span>
                            </div>
                            <div className="mb-2 flex-shrink-0">
                              <h4 className="text-sm font-medium text-white line-clamp-2">{item.title}</h4>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed flex-1">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </MobileCard>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop View (Grid) */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-fr w-full px-4 md:px-8 lg:px-12 relative z-10">
          {/* About Me Card */}
          <motion.div custom={0} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={cardVariants} className="lg:col-span-2">
            <Card className={cn(`${glassEffect} ${shimmerEffect} p-4 h-full transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10`)}>
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm"><User className="w-4 h-4 text-white" /></div>
                  <h3 className="text-lg font-light text-white tracking-wide">About Me</h3>
                  <Badge variant="outline" className="border-white/20 text-white/70 bg-white/5"><Sparkles className="w-2 h-2 mr-1" />Authentically Ironic</Badge>
                </div>
                <p className="text-slate-300 leading-relaxed text-sm font-light flex-1">{aboutText}</p>
                <div className="mt-4 flex gap-2">
                  {['Perfectionist', 'Overthinker', 'Digital Poet'].map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-white/5 text-white/60 border-white/10">{tag}</Badge>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Philosophy Card */}
          <motion.div custom={1} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={cardVariants}>
            <Card className={cn(`${glassEffect} ${shimmerEffect} p-4 h-full transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10`)}>
              <div className="h-full flex flex-col justify-between text-center">
                <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm mx-auto mb-4 w-fit"><Brain className="w-6 h-6 text-white" /></div>
                <h3 className="text-lg font-light text-white tracking-wide mb-4">Philosophy</h3>
                <Badge variant="outline" className="border-[1px] border-white/20 text-white/70 bg-white/5 text-sm px-2 mx-auto"><Sparkles className="w-2 h-2 mr-1" /><span className="whitespace-nowrap">Mindful Reflection</span></Badge>
                <blockquote className="text-sm font-thin text-white leading-relaxed italic overflow-hidden mt-4">"{philosophy}"</blockquote>
                <div className="mt-4 w-12 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto" />
              </div>
            </Card>
          </motion.div>

          {/* Timeline Card */}
          <motion.div custom={2} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={cardVariants} className="lg:col-span-3">
            <Card className={cn(`${glassEffect} ${shimmerEffect} p-6 transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/10`)}>
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm"><Zap className="w-6 h-6 text-white" /></div>
                  <h3 className="text-2xl font-light text-white tracking-wide">Experience Timeline</h3>
                  <Badge variant="outline" className="border-white/20 text-white/70 bg-white/5">Time Folded for Your Convenience</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {timelineItems.map((item, index) => {
                    const IconComponent = { 'FlaskConical': FlaskConical, 'Wand2': Wand2, 'Palette': Palette, 'Code2': Code2, 'Rocket': Rocket, 'Brain': Brain, 'Lightbulb': Lightbulb }[item.icon || 'Terminal'] || Terminal;
                    return (
                      <motion.div key={index} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }} className="relative group">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 h-full transition-all duration-300 hover:bg-white/10 hover:border-white/20 flex flex-col">
                          <div className="flex items-center gap-4 mb-4">
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: -5 }}
                              className="p-2 rounded-full bg-white/10 backdrop-blur-sm"
                            >
                              <IconComponent className="w-4 h-4 text-white" />
                            </motion.div>
                            <span className="text-lg font-thin text-white">{item.year}</span>
                          </div>
                          <div className="mb-2 flex-shrink-0">
                            <h4 className="text-base font-medium text-white line-clamp-2">{item.title}</h4>
                          </div>
                          <p className="text-slate-400 text-sm leading-relaxed flex-1">{item.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-2 h-2 bg-white rounded-full blur-sm"
        />
        <motion.div
          animate={{
            y: [0, 15, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-40 left-10 w-1 h-1 bg-slate-400 rounded-full blur-sm"
        />
      </motion.div>
    </motion.section>
  );
};

export default AboutSection;
