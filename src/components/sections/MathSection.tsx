import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, Home, Loader2, Upload, Send, User, Bot, Sparkles, Zap, Brain,  FileText, UserCircle as HumanIcon, Lightbulb, Target, Trash, History, ClipboardCopy, ClipboardCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MathRenderer from '@/components/ui/MathRenderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { Menu, Transition } from '@headlessui/react';

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
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [showHumanizeOptions, setShowHumanizeOptions] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);
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
        // Only add to history if not already present (avoid duplicates on repeated refreshes)
        const isDuplicate = allHistoryArr.length > 0 && JSON.stringify(allHistoryArr[0].messages) === JSON.stringify(loadedMessages);
        if (!isDuplicate) {
          allHistoryArr = [
            { id: Date.now().toString(), messages: loadedMessages, timestamp: Date.now(), summary },
            ...allHistoryArr
          ];
          localStorage.setItem('mathAllHistory', JSON.stringify(allHistoryArr));
        }
        localStorage.removeItem('mathMessages');
        setMathMessages([]);
        setAllHistory(allHistoryArr);
        setShowGreeting(true); // Show greeting for new clean page
      }
    } else {
      // Load all history
      const all = localStorage.getItem('mathAllHistory');
      if (all) {
        setAllHistory(JSON.parse(all));
      }
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
    const messageToSummarize = mathMessages.find(m => m.id === messageId);
    if (!messageToSummarize) return;

    setIsSummarizing(true);
    try {
      let summarizePrompt = '';
      if (type === 'accurate') {
        summarizePrompt = `Please provide an EXTREMELY ACCURATE and DETAILED summary of the following text. Capture all key points, nuances, and important details. The summary should be comprehensive and precise, reflecting the full depth of the original content.\n\nOriginal text:\n${messageToSummarize.content}`;
      } else {
        summarizePrompt = `Please summarize the following text in ULTRA SIMPLE terms. Use basic vocabulary and short sentences. Explain it as if you were talking to a 5-year-old.\n\nOriginal text:\n${messageToSummarize.content}`;
      }

      const response = await fetch('/api/math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: summarizePrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize');
      }
      
      const data = await response.json();

      const summarizedMessage: MathMessage = {
        id: `summary-${Date.now()}`,
        role: 'assistant',
        content: `📝 **Summary (${type}):**\n\n${data.solution}`,
        timestamp: new Date(),
      };
      setMathMessages(prev => [...prev, summarizedMessage]);
      toast({ description: 'Summary completed!', duration: 2000 });
    } catch (error) {
      toast({ title: "Error", description: "Failed to get summary.", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleHumanize = async (messageId: string, type: 'concise' | 'comprehensive') => {
    const messageToHumanize = mathMessages.find(m => m.id === messageId);
    if (!messageToHumanize) return;

    setIsHumanizing(true);
    setShowHumanizeOptions(false);
    try {
      let humanizePrompt = '';
      if (type === 'concise') {
        humanizePrompt = `Transform this response into a CONCISE, AUTHENTIC human expression. Make it brief but deeply personal and emotionally resonant.\n\n**Short Humanize Protocol:**\n- Express core emotions and thoughts in 2-3 sentences\n- Use natural contractions and conversational tone\n- Show genuine empathy and personal connection\n- Maintain authenticity without artificial indicators\n- Focus on the most impactful emotional response\n\nOriginal message:\n${messageToHumanize.content}\n\nRespond with concise human authenticity:`;
      } else { // comprehensive
        humanizePrompt = `Transform this response into a COMPREHENSIVE, DEEPLY HUMAN expression. Create a rich, emotionally layered response that feels like talking to a close friend.\n\n**Long Humanize Protocol:**\n- Develop full emotional context and personal insights\n- Use natural conversational flow with depth and nuance\n- Express vulnerability, empathy, and genuine care\n- Include personal reflections and meaningful connections\n- Show realistic thinking processes and emotional complexity\n- Use natural qualifiers, fillers, and authentic speech patterns\n- Create a profound human connection through detailed expression\n\n**IMPORTANT: Do NOT use text like "*pauses*", "*thinking*", "*sighs*", or any other artificial indicators. Write naturally as a real human would speak.**\n\nOriginal message:\n${messageToHumanize.content}\n\nRespond with comprehensive human authenticity:`;
      }
      
      const response = await fetch('/api/math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: humanizePrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to humanize');
      }
      
      const data = await response.json();

      const humanizedMessage: MathMessage = {
        id: `humanized-${Date.now()}`,
        role: 'assistant',
        content: `💝 **Humanized (${type}):**\n\n${data.solution}`,
        timestamp: new Date(),
      };
      setMathMessages(prev => [...prev, humanizedMessage]);
      toast({ description: 'Humanization completed!', duration: 2000 });
    } catch (error) {
      toast({ title: "Error", description: "Failed to get humanized text.", variant: "destructive" });
    } finally {
      setIsHumanizing(false);
    }
  };

  const handleSimplify = async (messageId: string) => {
    const messageToSimplify = mathMessages.find(m => m.id === messageId);
    if (!messageToSimplify) return;

    setIsSimplifying(true);
    try {
      const simplifyPrompt = `Please explain this in the ULTRA ULTRA SIMPLEST terms possible, using completely different words and explanations. Avoid using ANY of the same terminology from the original text. Make it so simple that a 5-year-old could understand it.\n\n**Rules:**\n- Use the most basic, everyday words possible\n- Replace ALL technical terms with simple alternatives\n- Use completely different sentence structures\n- Break everything into tiny, digestible pieces\n- Use analogies and examples from everyday life\n- Avoid any jargon or complex language\n- Make it conversational and friendly\n\nOriginal text to simplify:\n${messageToSimplify.content}\n\nNow explain this in ultra simple terms:`;
      
      const response = await fetch('/api/math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: simplifyPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to simplify');
      }
      
      const data = await response.json();

      const simplifiedMessage: MathMessage = {
        id: `simplified-${Date.now()}`,
        role: 'assistant',
        content: `✨ **Simplified:**\n\n${data.solution}`,
        timestamp: new Date(),
      };
      setMathMessages(prev => [...prev, simplifiedMessage]);
      toast({ description: 'Simplification completed!', duration: 2000 });
    } catch (error) {
      toast({ title: "Error", description: "Failed to get simplified text.", variant: "destructive" });
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

  const handleDeleteHistory = (id: string) => {
    const updatedHistory = allHistory.filter(h => h.id !== id);
    setAllHistory(updatedHistory);
    localStorage.setItem('mathAllHistory', JSON.stringify(updatedHistory));
  };

  return (
    <>
      <div
        className={
          `fixed inset-0 z-[1000] flex flex-col h-screen w-screen bg-background transition-all duration-500 ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; ${
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
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="New Chat"
              className={
                "h-8 w-8 rounded-md bg-background/50 hover:bg-background/80 text-muted-foreground/70 hover:text-foreground " +
                "shadow-[inset_0_1px_0_hsl(var(--foreground)_/_0.1),0_1px_2px_hsl(var(--foreground)_/_0.05)] " +
                "hover:shadow-[inset_0_1px_0_hsl(var(--foreground)_/_0.15),0_2px_4px_hsl(var(--foreground)_/_0.08)] " +
                "border border-border/30 hover:border-border/60 ultra-smooth-transition"
              }
              onClick={() => {
                // Move current chat to history if not empty
                if (mathMessages.length > 0) {
                  const summary = mathMessages.find(m => m.role === 'user')?.content?.slice(0, 40) || 'Math Conversation';
                  const all = localStorage.getItem('mathAllHistory');
                  let allHistoryArr = all ? JSON.parse(all) : [];
                  const isDuplicate = allHistoryArr.length > 0 && JSON.stringify(allHistoryArr[0].messages) === JSON.stringify(mathMessages);
                  if (!isDuplicate) {
                    allHistoryArr = [
                      { id: Date.now().toString(), messages: mathMessages, timestamp: Date.now(), summary },
                      ...allHistoryArr
                    ];
                    localStorage.setItem('mathAllHistory', JSON.stringify(allHistoryArr));
                  }
                  localStorage.removeItem('mathMessages');
                  setAllHistory(allHistoryArr);
                }
                setMathMessages([]);
                setShowGreeting(true);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4m8-4v4m-9 4h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zm2 4h4" /></svg>
            </Button>
            <Button
              variant="ghost"
              onClick={handleSmoothExit}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground border border-border/60 hover:border-orange-400/80 rounded-lg px-3 py-1.5 transition-all duration-200 shadow-none focus:outline-none focus:ring-1 focus:ring-orange-300 hover:bg-black/90"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Button>
          </div>
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
                {message.role === 'assistant' && message.content.trim() && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-orange-500" />
                  </div>
                )}
                <div className="group">
                  {/* Only render AI message if it has content */}
                  {(message.role === 'assistant' ? message.content.trim() : true) && (
                    <div
                      className={cn(
                        // Use inline-flex and fit-content for user messages
                        message.role === 'user'
                          ? 'inline-flex items-center bg-blue-500/10 border border-blue-500/20 text-foreground rounded-lg px-4 py-2 max-w-fit min-w-0 break-words'
                          : 'bg-card border border-border/50 text-foreground rounded-lg p-4 max-w-[80%] min-w-0 break-words'
                      )}
                      style={message.role === 'user' ? { alignSelf: 'flex-end' } : {}}
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
                  )}
                  {/* Action buttons for AI messages */}
                  {message.role === 'assistant' && !message.content.startsWith('📝') && !message.content.startsWith('💝') && !message.content.startsWith('✨') && (
                    <div className={cn(
                      "flex items-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 gap-1",
                      "justify-start"
                    )}>
                      {/* Copy Button */}
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          if (!message.content) return;
                          try {
                            await navigator.clipboard.writeText(message.content.trim());
                            setIsCopied(message.id);
                            toast({
                              description: "Content copied!",
                              duration: 2000,
                            });
                            setTimeout(() => setIsCopied(null), 2000);
                          } catch (err) {
                            toast({
                              title: "Error",
                              description: "Failed to copy content.",
                              variant: "destructive",
                              duration: 3000,
                            });
                            setIsCopied(null);
                          }
                        }}
                        className={cn(
                          "text-muted-foreground hover:text-foreground h-7 rounded-md bg-card/[.15] hover:bg-card/[.3] shadow-[0_1px_2px_hsl(var(--foreground)_/_0.07)] hover:shadow-[0_1px_3px_hsl(var(--foreground)_/_0.1)]",
                          isCopied === message.id ? "w-auto px-2 py-1 bg-green-500/15" : "w-7 px-1 justify-center",
                          "ultra-smooth-transition flex items-center"
                        )}
                        aria-label={isCopied === message.id ? "Copied" : "Copy message"}
                        disabled={!message.content}
                      >
                        {isCopied === message.id ? (
                          <div className="flex items-center gap-1.5">
                            <ClipboardCheck size={15} className="text-green-600 shrink-0" />
                            <span className="text-xs text-green-600 whitespace-nowrap">Copied!</span>
                          </div>
                        ) : (
                          <ClipboardCopy size={16} />
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
              {/* Input + Tools + Solve row for mobile */}
              <div className="flex flex-row sm:hidden items-center gap-2 w-full">
                <ReactTextareaAutosize
                  minRows={1}
                  maxRows={6}
                  placeholder="Type your mathematical problem..."
                  value={mathProblem}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMathProblem(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-9 rounded-md border border-border/50 focus:border-orange-500/50 px-2 py-1 resize-none transition-all duration-300 bg-background text-[16px] leading-relaxed placeholder:text-muted-foreground overflow-hidden"
                  disabled={isSolving || isImageUploading}
                />
                <Menu as="div" className="relative">
                  <Menu.Button as={Button} className="h-9 w-9 min-w-0 rounded-md border-2 border-orange-500 bg-background/80 text-xs font-medium p-0 flex items-center justify-center shadow-sm">
                    Tools
                  </Menu.Button>
                  <Transition
                    as={React.Fragment}
                    enter="transition duration-200 ease-out"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition duration-150 ease-in"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute left-0 bottom-full w-32 rounded-md shadow-lg bg-background ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <Menu.Item>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Clear chat"
                          onClick={() => { setShowClearDialog(true); }}
                          className="w-full flex items-center gap-2 px-3 py-2 border-none bg-transparent hover:bg-red-500/10 text-red-500 justify-start"
                        >
                          <Trash className="h-5 w-5" />
                          <span>Clear</span>
                        </Button>
                      </Menu.Item>
                      <Menu.Item>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Chat history"
                          onClick={() => { setShowHistory(true); }}
                          className="w-full flex items-center gap-2 px-3 py-2 border-none bg-transparent hover:bg-blue-500/10 text-blue-500 justify-start"
                        >
                          <History className="h-5 w-5" />
                          <span>History</span>
                        </Button>
                      </Menu.Item>
                      <Menu.Item>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSolving || isImageUploading}
                          className="w-full flex items-center gap-2 px-3 py-2 border-none bg-transparent hover:bg-orange-500/10 text-orange-500 justify-start"
                          title="Upload math/physics problem image"
                        >
                          {isImageUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5" />
                          )}
                          <span>Image</span>
                        </Button>
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
                <Button
                  onClick={handleMathSolve}
                  disabled={isSolving || (!mathProblem.trim() && !selectedImagePreview)}
                  className="h-9 w-9 min-w-0 rounded-md bg-orange-500 hover:bg-orange-600 text-white p-0 flex items-center justify-center"
                >
                  {isSolving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {/* Individual Buttons for Desktop */}
              <div className="hidden sm:flex items-center gap-3 w-full">
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
                <Button
                  variant="outline"
                  size="icon"
                  title="Clear chat"
                  onClick={() => { setShowClearDialog(true); }}
                  className="h-10 w-10 rounded-lg border-border/50 hover:border-red-500/50 hover:bg-red-500/10 group"
                >
                  <Trash className="h-5 w-5 text-red-500 group-hover:text-white transition-colors duration-150" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  title="Chat history"
                  onClick={() => { setShowHistory(true); }}
                  className="h-10 w-10 rounded-lg border-border/50 hover:border-blue-500/50 hover:bg-blue-500/10 group"
                >
                  <History className="h-5 w-5 text-blue-500 group-hover:text-white transition-colors duration-150" />
                </Button>
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
                <div key={h.id} className="p-2 border rounded flex items-center justify-between hover:bg-accent/30">
                  <div className="flex-1 cursor-pointer" onClick={() => handleRestoreHistory(h.id)}>
                    <div className="font-medium text-sm">{h.summary}</div>
                    <div className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    className="ml-2 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleDeleteHistory(h.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </Button>
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
                  <div key={h.id} className="p-2 border rounded flex items-center justify-between hover:bg-accent/30">
                    <div className="flex-1 cursor-pointer" onClick={() => { handleRestoreHistory(h.id); handleCloseHistoryDialog(); }}>
                      <div className="font-medium text-sm">{h.summary}</div>
                      <div className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete"
                      className="ml-2 text-red-500 hover:bg-red-500/10"
                      onClick={() => handleDeleteHistory(h.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
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