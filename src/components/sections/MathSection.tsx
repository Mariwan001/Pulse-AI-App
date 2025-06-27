import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, Home, Loader2, Upload, XCircle, Send, User, Bot, Sparkles, Heart, Zap, Brain, ChevronDown, FileText, UserCircle as HumanIcon, Lightbulb, Target, Trash, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sendMessage, sendHumanizedMessage } from '@/store/chat-store';
import MathRenderer from '@/components/ui/MathRenderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import ReactTextareaAutosize from 'react-textarea-autosize';

interface MathMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
}

interface MathSectionProps {
  onBackToHome: () => void;
}

const MathSection: React.FC<MathSectionProps> = ({ onBackToHome }) => {
  const [mathProblem, setMathProblem] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGreeting, setShowGreeting] = useState(true);
  const [mathMessages, setMathMessages] = useState<MathMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedHumanize, setExpandedHumanize] = useState<string | null>(null);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [showHumanizeOptions, setShowHumanizeOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);
  const [allHistory, setAllHistory] = useState<{id: string, messages: MathMessage[], timestamp: number, summary: string}[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [historyDialogVisible, setHistoryDialogVisible] = useState(false);

  const greetingText = "Welcome to your mathematical sanctuary... where every equation finds its perfect solution, and every problem becomes an opportunity for discovery. I'm here to guide you through the beautiful world of mathematics with precision, clarity, and understanding. Let's explore together... ✨";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mathMessages]);

  // Typewriter effect for greeting
  useEffect(() => {
    if (showGreeting && currentIndex < greetingText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(greetingText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else if (currentIndex >= greetingText.length) {
      const hideTimeout = setTimeout(() => {
        setShowGreeting(false);
      }, 3000);
      return () => clearTimeout(hideTimeout);
    }
  }, [currentIndex, greetingText, showGreeting]);

  // On mount, if there is a current chat, move it to history and clear
  useEffect(() => {
    const saved = localStorage.getItem('mathMessages');
    let loadedMessages: MathMessage[] = [];
    if (saved) {
      loadedMessages = JSON.parse(saved, (key, value) => {
        if (key === 'timestamp') return new Date(value);
        return value;
      });
      if (loadedMessages.length > 0) {
        // Move to history
        const summary = loadedMessages.find(m => m.role === 'user')?.content?.slice(0, 40) || 'Math Conversation';
        const all = localStorage.getItem('mathAllHistory');
        let allHistoryArr = all ? JSON.parse(all) : [];
        allHistoryArr = [
          { id: Date.now().toString(), messages: loadedMessages, timestamp: Date.now(), summary },
          ...allHistoryArr
        ];
        localStorage.setItem('mathAllHistory', JSON.stringify(allHistoryArr));
        localStorage.removeItem('mathMessages');
        setMathMessages([]);
        setAllHistory(allHistoryArr);
        setShowGreeting(true);
      }
    }
    // Load all history
    const all = localStorage.getItem('mathAllHistory');
    if (all) {
      setAllHistory(JSON.parse(all));
    }
  }, []);

  // Save to localStorage on every update
  useEffect(() => {
    localStorage.setItem('mathMessages', JSON.stringify(mathMessages));
  }, [mathMessages]);
  useEffect(() => {
    localStorage.setItem('mathAllHistory', JSON.stringify(allHistory));
  }, [allHistory]);

  useEffect(() => {
    setTimeout(() => setShowOverlay(true), 10);
    return () => setShowOverlay(false);
  }, []);

  // Animate modal in/out
  useEffect(() => {
    if (showClearDialog) {
      setClearDialogVisible(true);
    }
  }, [showClearDialog]);

  const handleCloseClearDialog = () => {
    setShowClearDialog(false);
    setTimeout(() => setClearDialogVisible(false), 400); // Match transition duration
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 4MB.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setIsImageUploading(true);
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImagePreview(reader.result as string);
        setIsImageUploading(false);
      };
      reader.onerror = () => {
        setIsImageUploading(false);
        toast({
          title: "Error reading file",
          description: "Could not read the selected image.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImagePreview(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMathSolve = async () => {
    if (!mathProblem.trim() && !selectedImagePreview) {
      toast({
        title: "No Problem Entered",
        description: "Please enter a mathematical problem or upload an image.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSolving(true);
    setIsGenerating(true);

    // Add user message to the conversation
    const userMessage: MathMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: mathProblem || 'Math problem from image',
      image: selectedImagePreview || undefined,
      timestamp: new Date(),
    };

    setMathMessages(prev => [...prev, userMessage]);

    // Create AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: MathMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMathMessages(prev => [...prev, aiMessage]);

    try {
      const prompt = selectedImagePreview 
        ? `Solve this math or physics problem from the uploaded image. Give a clear, step-by-step solution using LaTeX for all math.`
        : `Solve this math or physics problem: ${mathProblem}\n\nGive a clear, step-by-step solution using LaTeX for all math.`;

      // Make direct API call to math solver
      const response = await fetch('/api/ai/math-solver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: prompt,
          imageDataUri: selectedImagePreview || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const parsedChunk = JSON.parse(line);
            if (parsedChunk.type === 'text') {
              fullResponse += parsedChunk.content;
              // Update the AI message with streaming content
              setMathMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, content: fullResponse }
                    : msg
                )
              );
            }
          } catch (e) {
            console.error('Error parsing streaming chunk:', e);
          }
        }
      }
      
      if (!fullResponse.trim()) {
        setMathMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: '❌ Error: No response from the AI. Please try again or check your connection.' }
              : msg
          )
        );
      }
      
      toast({
        description: "Solution completed!",
        duration: 2000,
      });

      // Clear the input after sending
      setMathProblem('');
      handleRemoveImage();
    } catch (error) {
      console.error('Error solving math problem:', error);
      
      // Update AI message with error
      setMathMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: '❌ Error: Failed to solve math problem. Please try again.' }
            : msg
        )
      );

      toast({
        title: "Error",
        description: "Failed to solve math problem.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSolving(false);
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMathSolve();
    }
  };

  const handleSummarize = async (messageId: string, type: 'simple' | 'accurate') => {
    const message = mathMessages.find(msg => msg.id === messageId);
    if (!message || message.role !== 'assistant') return;

    setIsSummarizing(true);
    try {
      let summarizePrompt = '';
      
      if (type === 'accurate') {
        summarizePrompt = `Please provide an **EXTREMELY, EXTREMELY, DEEPLY, TOTALLY, SYSTEMATICALLY, TOO POWERFULLY ACCURATE** summary of this text. You must be **WISELY, SMARTLY, WITHOUT FORGETTING, MIXING THINGS UP, BE TOO SPECIFIC, EXTREMELY BE UNMISTAKENLY, NO WAY TO MAKE MISTAKES, AND IMPOSSIBLE TO MAKE MISTAKES**.

**ACCURATE SUMMARY REQUIREMENTS:**
- **PERFECT ACCURACY**: Every fact, detail, and point must be **100% ACCURATE**
- **COMPLETE COMPREHENSION**: Understand **EVERY SINGLE DETAIL** without forgetting anything
- **ZERO MIXING UP**: **NEVER MIX THINGS UP** or confuse different parts
- **EXTREME SPECIFICITY**: Be **TOO SPECIFIC** - no generalities, only precise details
- **UNMISTAKABLE PRECISION**: **NO WAY TO MAKE MISTAKES** in your summary
- **IMPOSSIBLE TO BE WRONG**: Your summary must be **IMPOSSIBLE TO MAKE MISTAKES**
- **COMPLETE COVERAGE**: Include **ALL IMPORTANT POINTS** with perfect accuracy
- **LOGICAL FLOW**: Maintain perfect logical structure and flow
- **SOURCE FIDELITY**: Stay **100% FAITHFUL** to the original content

Original text to summarize with EXTREME ACCURACY:
${message.content}

Provide an **EXTREMELY ACCURATE** summary:`;
      } else {
        summarizePrompt = `Please provide an **EXTREMELY, EXTREMELY, DEEPLY, TOTALLY, SYSTEMATICALLY, TOO POWERFULLY SIMPLE** summary of this text. Use the **SIMPLEST TERMS, SIMPLEST WORDS AND EXPLAINING, WISELY, SMARTLY, WITHOUT FORGETTING, MIXING THINGS UP, BE TOO SPECIFIC, EXTREMELY BE UNMISTAKENLY, NO WAY TO MAKE MISTAKES, AND IMPOSSIBLE TO MAKE MISTAKES**.

**SIMPLE SUMMARY REQUIREMENTS:**
- **ULTRA SIMPLE LANGUAGE**: Use the **SIMPLEST WORDS POSSIBLE** that anyone can understand
- **BASIC EXPLANATIONS**: Explain everything in the **MOST BASIC TERMS**
- **EVERYDAY LANGUAGE**: Use only **EVERYDAY, COMMON WORDS**
- **NO TECHNICAL TERMS**: Replace ALL complex terms with **SIMPLE ALTERNATIVES**
- **SHORT SENTENCES**: Use **VERY SHORT, CLEAR SENTENCES**
- **STEP-BY-STEP**: Break everything into **TINY, EASY PIECES**
- **CONVERSATIONAL TONE**: Make it sound like **TALKING TO A FRIEND**
- **ZERO JARGON**: **NO COMPLEX LANGUAGE** whatsoever
- **PERFECT CLARITY**: Make it **IMPOSSIBLE TO MISUNDERSTAND**

Original text to summarize in **ULTRA SIMPLE TERMS**:
${message.content}

Provide an **EXTREMELY SIMPLE** summary:`;
      }
      
      await sendMessage(summarizePrompt);
      
      toast({
        description: type === 'accurate' ? "Creating extremely accurate summary..." : "Creating ultra simple summary...",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error summarizing text:', error);
      toast({
        title: "Error",
        description: "Failed to summarize text.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleHumanize = async (messageId: string, type: 'concise' | 'comprehensive') => {
    const message = mathMessages.find(msg => msg.id === messageId);
    if (!message || message.role !== 'assistant') return;

    setIsHumanizing(true);
    setShowHumanizeOptions(false);
    try {
      let humanizePrompt = '';
      
      if (type === 'concise') {
        humanizePrompt = `Transform this response into a CONCISE, AUTHENTIC human expression. Make it brief but deeply personal and emotionally resonant.

**Short Humanize Protocol:**
- Express core emotions and thoughts in 2-3 sentences
- Use natural contractions and conversational tone
- Show genuine empathy and personal connection
- Maintain authenticity without artificial indicators
- Focus on the most impactful emotional response

Original message:
${message.content}

Respond with concise human authenticity:`;
      } else {
        humanizePrompt = `Transform this response into a COMPREHENSIVE, DEEPLY HUMAN expression. Create a rich, emotionally layered response that feels like talking to a close friend.

**Long Humanize Protocol:**
- Develop full emotional context and personal insights
- Use natural conversational flow with depth and nuance
- Express vulnerability, empathy, and genuine care
- Include personal reflections and meaningful connections
- Show realistic thinking processes and emotional complexity
- Use natural qualifiers, fillers, and authentic speech patterns
- Create a profound human connection through detailed expression

**IMPORTANT: Do NOT use text like "*pauses*", "*thinking*", "*sighs*", or any other artificial indicators. Write naturally as a real human would speak.**

Original message:
${message.content}

Respond with comprehensive human authenticity:`;
      }
      
      await sendHumanizedMessage(humanizePrompt);
      
      toast({
        description: `Applying ${type === 'concise' ? 'concise' : 'comprehensive'} humanization...`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error humanizing text:', error);
      toast({
        title: "Error",
        description: "Failed to humanize text.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsHumanizing(false);
    }
  };

  const handleSimplify = async (messageId: string) => {
    const message = mathMessages.find(msg => msg.id === messageId);
    if (!message || message.role !== 'assistant') return;

    setIsSimplifying(true);
    try {
      const simplifyPrompt = `Please explain this in the ULTRA ULTRA SIMPLEST terms possible, using completely different words and explanations. Avoid using ANY of the same terminology from the original text. Make it so simple that a 5-year-old could understand it.

**Rules:**
- Use the most basic, everyday words possible
- Replace ALL technical terms with simple alternatives
- Use completely different sentence structures
- Break everything into tiny, digestible pieces
- Use analogies and examples from everyday life
- Avoid any jargon or complex language
- Make it conversational and friendly

Original text to simplify:
${message.content}

Now explain this in ultra simple terms:`;
      
      await sendMessage(simplifyPrompt);
      
      toast({
        description: "Making it ultra simple...",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error simplifying text:', error);
      toast({
        title: "Error",
        description: "Failed to simplify text.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSimplifying(false);
    }
  };

  const toggleHumanizeOptions = () => {
    setShowHumanizeOptions(!showHumanizeOptions);
  };

  // Save current chat to history and clear chat
  const handleClearChat = (clearAll = false) => {
    if (clearAll) {
      setAllHistory([]);
      setMathMessages([]);
      localStorage.removeItem('mathMessages');
      localStorage.removeItem('mathAllHistory');
      setShowGreeting(true);
      return;
    }
    if (mathMessages.length > 0) {
      const summary = mathMessages.find(m => m.role === 'user')?.content?.slice(0, 40) || 'Math Conversation';
      setAllHistory(prev => [
        { id: Date.now().toString(), messages: mathMessages, timestamp: Date.now(), summary },
        ...prev
      ]);
      setMathMessages([]);
      setShowGreeting(true);
    }
  };

  // Restore a conversation from history
  const handleRestoreHistory = (id: string) => {
    const found = allHistory.find(h => h.id === id);
    if (found) {
      setMathMessages(found.messages);
      setShowGreeting(false);
      setShowHistory(false);
    }
  };

  const handleSmoothExit = () => {
    setShowOverlay(false);
    setTimeout(() => {
      onBackToHome();
    }, 500); // Match the transition duration
  };

  // Animate history modal in/out
  useEffect(() => {
    if (showHistory) {
      setHistoryDialogVisible(true);
    }
  }, [showHistory]);

  const handleCloseHistoryDialog = () => {
    setShowHistory(false);
    setTimeout(() => setHistoryDialogVisible(false), 400);
  };

  return (
    <>
      <div
        className={
          `fixed inset-0 z-[1000] flex flex-col h-screen w-screen bg-background transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            showOverlay ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`
        }
        style={{ willChange: 'opacity, transform' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Calculator className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Math Solver</h1>
              <p className="text-sm text-muted-foreground">Ultra-precision mathematical solutions</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSmoothExit}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground border border-border/60 hover:border-orange-400/80 rounded-lg px-3 py-1.5 transition-all duration-200 shadow-none focus:outline-none focus:ring-1 focus:ring-orange-300 hover:bg-black/90"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Button>
        </div>

        {/* Main Content - Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {/* Typewriter Greeting */}
          {showGreeting && mathMessages.length === 0 && (
            <div className="max-w-2xl mx-auto text-center mb-8">
              <div className="text-lg text-muted-foreground leading-relaxed">
                {displayedText}
                <span className="animate-pulse">|</span>
              </div>
            </div>
          )}
          {/* Math Messages */}
          <div className="max-w-4xl mx-auto space-y-4">
            {mathMessages.map((message) => (
              <div key={message.id} className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-orange-500" />
                  </div>
                )}
                
                <div className="group">
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-orange-500/10 border border-orange-500/20 text-foreground'
                        : 'bg-card border border-border/50 text-foreground'
                    }`}
                  >
                    {/* Image if present */}
                    {message.image && (
                      <div className="mb-3">
                        <Image 
                          src={message.image} 
                          alt="Math problem" 
                          width={300} 
                          height={200} 
                          className="rounded-md object-contain max-h-32" 
                        />
                      </div>
                    )}
                    
                    {/* Message content */}
                    {message.role === 'assistant' ? (
                      <MathRenderer content={message.content.replace(/\*\*|\*/g, '')} />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content.replace(/\*\*|\*/g, '')}
                      </div>
                    )}
                  </div>

                  {/* Action buttons for AI messages */}
                  {message.role === 'assistant' && !message.content.startsWith('📝') && !message.content.startsWith('💝') && !message.content.startsWith('✨') && (
                    <div className={cn(
                      "flex items-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 gap-1",
                      "justify-start"
                    )}>
                      {/* Summarize Button */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            disabled={isSummarizing}
                            className={cn(
                              "text-muted-foreground hover:text-foreground h-7 rounded-md bg-card/[.15] hover:bg-card/[.3]",
                              "shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                              "hover:shadow-[0_4px_16px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.15)]",
                              "border border-white/10 hover:border-white/20",
                              "backdrop-blur-sm",
                              isSummarizing ? "w-auto px-2 py-1 bg-purple-500/15" : "w-7 px-1 justify-center", 
                              "ultra-smooth-transition flex items-center"
                            )}
                            aria-label={isSummarizing ? "Summarizing..." : "Summarize text"}
                          >
                            {isSummarizing ? (
                              <div className="flex items-center gap-1.5">
                                <Loader2 size={15} className="animate-spin text-purple-600 shrink-0" />
                                <span className="text-xs text-purple-600 whitespace-nowrap">Summarizing...</span>
                              </div>
                            ) : (
                              <FileText size={16} />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => handleSummarize(message.id, 'simple')}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Sparkles size={16} className="text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-medium">Simple</span>
                              <span className="text-xs text-muted-foreground">Ultra simple terms</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSummarize(message.id, 'accurate')}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Target size={16} className="text-blue-600" />
                            <div className="flex flex-col">
                              <span className="font-medium">Accurate</span>
                              <span className="text-xs text-muted-foreground">Extremely precise</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Humanize Button */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          onClick={toggleHumanizeOptions}
                          disabled={isHumanizing}
                          className={cn(
                            "text-muted-foreground hover:text-foreground h-7 rounded-md bg-card/[.15] hover:bg-card/[.3]",
                            "shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                            "hover:shadow-[0_4px_16px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.15)]",
                            "border border-white/10 hover:border-white/20",
                            "backdrop-blur-sm",
                            isHumanizing ? "w-auto px-2 py-1 bg-pink-500/15" : "w-7 px-1 justify-center", 
                            "ultra-smooth-transition flex items-center"
                          )}
                          aria-label={isHumanizing ? "Humanizing..." : "Humanize text"}
                        >
                          {isHumanizing ? (
                            <div className="flex items-center gap-1.5">
                              <Loader2 size={15} className="animate-spin text-pink-600 shrink-0" />
                              <span className="text-xs text-pink-600 whitespace-nowrap">Humanizing...</span>
                            </div>
                          ) : (
                            <HumanIcon size={14} />
                          )}
                        </Button>
                        
                        {/* Smooth Options Transition */}
                        {showHumanizeOptions && (
                          <div className="absolute top-full left-0 mt-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-md shadow-lg z-10 overflow-hidden">
                            <div className="p-1">
                              <Button
                                variant="ghost"
                                onClick={() => handleHumanize(message.id, 'concise')}
                                className="w-full justify-start text-left h-auto p-2 hover:bg-accent/50 rounded-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <Zap size={14} className="text-yellow-600 shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium">Concise Humanize</span>
                                    <span className="text-xs text-muted-foreground">Brief, authentic</span>
                                  </div>
                                </div>
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleHumanize(message.id, 'comprehensive')}
                                className="w-full justify-start text-left h-auto p-2 hover:bg-accent/50 rounded-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <Brain size={14} className="text-pink-600 shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium">Comprehensive Humanize</span>
                                    <span className="text-xs text-muted-foreground">Deep, detailed</span>
                                  </div>
                                </div>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Simplify Button */}
                      <Button
                        variant="ghost"
                        onClick={() => handleSimplify(message.id)}
                        disabled={isSimplifying}
                        className={cn(
                          "text-muted-foreground hover:text-foreground h-7 rounded-md bg-card/[.15] hover:bg-card/[.3]",
                          "shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                          "hover:shadow-[0_4px_16px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.15)]",
                          "border border-white/10 hover:border-white/20",
                          "backdrop-blur-sm",
                          isSimplifying ? "w-auto px-2 py-1 bg-blue-500/15" : "w-7 px-1 justify-center", 
                          "ultra-smooth-transition flex items-center"
                        )}
                        aria-label={isSimplifying ? "Simplifying..." : "Simplify text"}
                      >
                        {isSimplifying ? (
                          <div className="flex items-center gap-1.5">
                            <Loader2 size={15} className="animate-spin text-blue-600 shrink-0" />
                            <span className="text-xs text-blue-600 whitespace-nowrap">Simplifying...</span>
                          </div>
                        ) : (
                          <Lightbulb size={16} />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-orange-500" />
                </div>
                <div className="bg-card border border-border/50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span className="text-sm text-muted-foreground">Solving with ultra-precision...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Section */}
        <div className="border-t border-border/50 p-4 bg-card/30 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              {/* Clear Chat Button */}
              <Button
                variant="outline"
                size="icon"
                title="Clear chat"
                onClick={() => { console.log('Open clear dialog'); setShowClearDialog(true); }}
                className="h-10 w-10 rounded-lg border-border/50 hover:border-red-500/50 hover:bg-red-500/10 group"
              >
                <Trash className="h-5 w-5 text-red-500 group-hover:text-white transition-colors duration-150" />
              </Button>
              {/* Chat History Button */}
              <Button
                variant="outline"
                size="icon"
                title="Chat history"
                onClick={() => { console.log('Open history dialog'); setShowHistory(true); }}
                className="h-10 w-10 rounded-lg border-border/50 hover:border-blue-500/50 hover:bg-blue-500/10 group"
              >
                <History className="h-5 w-5 text-blue-500 group-hover:text-white transition-colors duration-150" />
              </Button>
              {/* Image Upload Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSolving || isImageUploading}
                className="h-10 w-10 rounded-lg border-border/50 hover:border-orange-500/50 hover:bg-orange-500/10"
                title="Upload math/physics problem image"
              >
                {isImageUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </Button>

              {/* Text Input */}
              <ReactTextareaAutosize
                minRows={1}
                maxRows={6}
                placeholder="Type your mathematical problem..."
                value={mathProblem}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMathProblem(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-10 rounded-lg border border-border/50 focus:border-orange-500/50 px-3 py-2 resize-none transition-all duration-300 bg-background text-base leading-relaxed placeholder:text-muted-foreground overflow-hidden"
                disabled={isSolving || isImageUploading}
              />

              {/* Send Button */}
              <Button
                onClick={handleMathSolve}
                disabled={isSolving || (!mathProblem.trim() && !selectedImagePreview)}
                className="h-10 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSolving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Solving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    <span>Solve</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Hidden File Input */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              style={{ display: 'none' }} 
              disabled={isImageUploading || isSolving}
            />
          </div>
        </div>

        {/* Chat History Modal */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Math Chat History</DialogTitle>
              <DialogDescription>
                Click any conversation to restore it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allHistory.length === 0 && <div className="text-muted-foreground text-sm">No chat history yet.</div>}
              {allHistory.map(h => (
                <div key={h.id} className="p-2 border rounded hover:bg-accent/30 cursor-pointer" onClick={() => handleRestoreHistory(h.id)}>
                  <div className="font-medium text-sm">{h.summary}</div>
                  <div className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <DialogClose asChild>
              <Button variant="secondary" className="mt-2 w-full">Close</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Clear Chat Modal */}
        <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Clear Math Chat</DialogTitle>
              <DialogDescription>
                What would you like to clear?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => { handleClearChat(false); setShowClearDialog(false); }}
              >
                Clear Only Current Chat
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { handleClearChat(true); setShowClearDialog(false); }}
              >
                Clear All History
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowClearDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fallback Custom Modal for Clear Chat */}
        {clearDialogVisible && (
          <div className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center transition-opacity duration-400 ${showClearDialog ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className={`fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-400 sm:rounded-lg transition-all ${showClearDialog ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
              style={{ transition: 'all 0.4s cubic-bezier(.4,0,.2,1)' }}
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <div className="text-lg font-semibold leading-none tracking-tight">Clear Math Chat</div>
                <div className="text-sm text-muted-foreground">What would you like to clear?</div>
              </div>
              <div className="flex flex-col gap-3 py-2">
                <Button variant="destructive" className="w-full" onClick={() => { handleClearChat(false); handleCloseClearDialog(); }}>Clear Only Current Chat</Button>
                <Button variant="outline" className="w-full" onClick={() => { handleClearChat(true); handleCloseClearDialog(); }}>Clear All History</Button>
                <Button variant="secondary" className="w-full" onClick={handleCloseClearDialog}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
        {/* Fallback Custom Modal for History */}
        {historyDialogVisible && (
          <div className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center transition-opacity duration-400 ${showHistory ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className={`fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-400 sm:rounded-lg transition-all ${showHistory ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
              style={{ transition: 'all 0.4s cubic-bezier(.4,0,.2,1)' }}
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <div className="text-lg font-semibold leading-none tracking-tight">Math Chat History</div>
                <div className="text-sm text-muted-foreground">Click any conversation to restore it.</div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allHistory.length === 0 && <div className="text-muted-foreground text-sm">No chat history yet.</div>}
                {allHistory.map(h => (
                  <div key={h.id} className="p-2 border rounded hover:bg-accent/30 cursor-pointer" onClick={() => { handleRestoreHistory(h.id); handleCloseHistoryDialog(); }}>
                    <div className="font-medium text-sm">{h.summary}</div>
                    <div className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="mt-2 w-full" onClick={handleCloseHistoryDialog}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MathSection;