import type { FC, ReactNode } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  BrainCircuit as AiIcon, 
  Loader2, 
  User, 
  ClipboardCopy, 
  ClipboardCheck, 
  Lightbulb,
  FileText,
  Sparkles,
  Target,
  UserCircle as HumanIcon,
  Zap,
  Brain,
  Mic
} from 'lucide-react';
import NextImage from 'next/image'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { sendMessage, sendHumanizedMessage } from '@/store/chat-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChatStore } from '@/store/chat-store';
import { supabase } from '@/lib/supabaseClient';


interface ChatMessageItemProps {
  message: Message;
}

const ChatMessageItem: FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [showHumanizeOptions, setShowHumanizeOptions] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const { messages, userId, userEmail, avatarUrl } = useChatStore();

  // Determine if this user message is from the current user
  const isCurrentUserMsg = isUser && (
    (message.userId && userId && message.userId === userId) ||
    (message.userEmail && userEmail && message.userEmail === userEmail)
  );

  // Diagnostic logging
  if (typeof window !== 'undefined') {
    console.log('[ChatMessageItem] message:', message);
    console.log('[ChatMessageItem] current userId:', userId, 'userEmail:', userEmail, 'avatarUrl:', avatarUrl);
    console.log('[ChatMessageItem] isCurrentUserMsg:', isCurrentUserMsg, 'avatar shown:', isCurrentUserMsg ? (avatarUrl || '/placeholder-user.jpg') : '/placeholder-user.jpg');
  }

  const handleCopy = async () => {
    if (!message.text && !message.aiGeneratedImageUrl && !message.imageDataUri) return;
    
    let textToCopy = message.text || '';
    if (message.aiGeneratedImageUrl) {
      textToCopy += `\n[AI Generated Image: ${message.aiGeneratedImageUrl}]`; // Or just the URL
    }
    if (message.imageDataUri) {
      textToCopy += `\n[User Image: ${message.imageFileName || 'attached image'}]`;
    }

    try {
      await navigator.clipboard.writeText(textToCopy.trim());
      setIsCopied(true);
      toast({
        description: "Content copied!",
        duration: 2000,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy content.",
        variant: "destructive",
        duration: 3000,
      });
 setIsCopied(false);
    }
  };

  const handleSimplify = async () => {
    if (!message.text || isUser) return;
    
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
${message.text}

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

  const handleSummarize = async (type: 'simple' | 'accurate') => {
    if (!message.text || isUser) return;
    
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
${message.text}

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
${message.text}

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

  const handleHumanize = async (type: 'short' | 'long') => {
    if (!message.text || isUser) return;
    
    setIsHumanizing(true);
    setShowHumanizeOptions(false);
    try {
      let humanizePrompt = '';
      
      if (type === 'short') {
        humanizePrompt = `Transform this response into a CONCISE, AUTHENTIC human expression. Make it brief but deeply personal and emotionally resonant.

**Short Humanize Protocol:**
- Express core emotions and thoughts in 2-3 sentences
- Use natural contractions and conversational tone
- Show genuine empathy and personal connection
- Maintain authenticity without artificial indicators
- Focus on the most impactful emotional response

Original message:
${message.text}

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
${message.text}

Respond with comprehensive human authenticity:`;
      }
      
      await sendHumanizedMessage(humanizePrompt);
      
      toast({
        description: `Applying ${type === 'short' ? 'concise' : 'comprehensive'} humanization...`,
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

  const toggleHumanizeOptions = () => {
    if (!isHumanizing) {
      setShowHumanizeOptions(!showHumanizeOptions);
    }
  };

  // Speak handler using browser SpeechSynthesis
  const handleSpeak = () => {
    if (!message.text) return;

    // Helper to actually speak after voices are loaded
    const speak = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Voices available:', voices.length, voices.map(v => v.name));
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const utterance = new window.SpeechSynthesisUtterance(message.text);
      // Ultra humanized: prefer the most natural, expressive voices
      const ultraHumanizedVoice =
        voices.find(v => v.name.includes('Aria Online (Natural)')) ||
        voices.find(v => v.name.includes('Guy Online (Natural)')) ||
        voices.find(v => v.name.includes('Libby Online (Natural)')) ||
        voices.find(v => v.name.includes('Online (Natural)')) ||
        voices.find(v => v.name.includes('Zira')) ||
        voices.find(v => v.name.includes('Google US English')) ||
        voices.find(v => v.name.toLowerCase().includes('natural')) ||
        voices.find(v => v.name.toLowerCase().includes('neural')) ||
        voices.find(v => v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.name.toLowerCase().includes('child')) ||
        voices[0];
      utterance.voice = ultraHumanizedVoice;
      utterance.rate = 1.02;
      utterance.pitch = 1.08;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        console.error('SpeechSynthesisUtterance error:', e);
      };
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speak();
        window.speechSynthesis.onvoiceschanged = null;
      };
      window.speechSynthesis.getVoices();
    } else {
      speak();
    }
  };

  const renderMessageContent = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    
    // Enhanced regex to handle multiple markdown patterns
    const markdownRegex = /(```(\w*\s*)\n([\s\S]*?)```|(\*\*.*?\*\*)|(##\s+.*?$|###\s+.*?$)|(`[^`]+`))/gm;
    let match;

    while ((match = markdownRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      
      const fullMatch = match[0];
      
      // Code blocks
      if (fullMatch.startsWith('```')) {
        const language = match[2]?.trim() || 'plaintext';
        const code = match[3];
        parts.push(
          <div key={`code-block-wrapper-${lastIndex}`} className="my-2 rounded-md overflow-hidden bg-[#1E1E1E]">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              PreTag="div"
              className="text-sm"
              customStyle={{ margin: '0', padding: '0.5rem', backgroundColor: 'transparent' }}
              codeTagProps={{style: {fontFamily: "var(--font-code, monospace)"}}}
            >
              {code.trim()}
            </SyntaxHighlighter>
          </div>
        );
      }
      // Bold text
      else if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
        const boldText = fullMatch.slice(2, -2);
        parts.push(
          <strong key={`bold-${lastIndex}`} className="font-bold text-foreground">
            {boldText}
          </strong>
        );
      }
      // Headers
      else if (fullMatch.startsWith('##') || fullMatch.startsWith('###')) {
        const isH2 = fullMatch.startsWith('##');
        const headerText = fullMatch.replace(/^#{2,3}\s+/, '');
        const HeaderTag = isH2 ? 'h2' : 'h3';
        parts.push(
          <HeaderTag key={`header-${lastIndex}`} className={`font-bold text-foreground ${isH2 ? 'text-lg' : 'text-base'} mt-4 mb-2`}>
            {headerText}
          </HeaderTag>
        );
      }
      // Inline code
      else if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
        const codeText = fullMatch.slice(1, -1);
        parts.push(
          <code key={`inline-code-${lastIndex}`} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
            {codeText}
          </code>
        );
      }
      
      lastIndex = markdownRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }
    
    // Handle single code block case
    if (parts.length === 0 && text.startsWith('```') && text.endsWith('```')) {
        const singleMatch = /```(\w*\s*)\n([\s\S]*?)```/.exec(text);
        if (singleMatch) {
            const language = singleMatch[1]?.trim() || 'plaintext';
            const code = singleMatch[2];
             parts.push(
               <div key="code-block-wrapper-single" className="my-2 rounded-md overflow-hidden bg-[#1E1E1E]">
                <SyntaxHighlighter
                  language={language}
                  style={vscDarkPlus}
                  PreTag="div"
                  className="text-sm"
                  customStyle={{ margin: '0', padding: '0.5rem', backgroundColor: 'transparent'}}
                  codeTagProps={{style: {fontFamily: "var(--font-code, monospace)"}}}
                >
                  {code.trim()}
                </SyntaxHighlighter>
              </div>
            );
        } else {
             parts.push(<span key="text-fallback">{text}</span>); 
        }
    }
    return parts.length > 0 ? parts : [<span key="text-only">{text}</span>]; 
  };

  // Helper to retry the last user message
  const handleRetry = () => {
    // Find the last user message before this error message
    const errorIndex = messages.findIndex((m) => m.id === message.id);
    if (errorIndex > 0) {
      for (let i = errorIndex - 1; i >= 0; i--) {
        if (messages[i].sender === 'user' && messages[i].text) {
          sendMessage(messages[i].text);
          break;
        }
      }
    }
  };

  const displayedText = message.text || (message.isLoading && message.sender === 'ai' ? '' : '');

  return (
    <div className={cn('group flex items-start gap-2 sm:gap-3 my-2 sm:my-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className={cn(
          "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 self-start shrink-0",
          // For AI: Force rounded-lg, maintain overflow-hidden, and add 3D shadow
          !isUser && "!rounded-lg overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]",
          // For User: Add obvious, clean, soft 3D styling
          isUser && "rounded-full bg-card/20 border border-border/50 shadow-[inset_0_1px_2px_hsl(var(--foreground)_/_0.1),0_2px_4px_hsl(var(--foreground)_/_0.08)]"
        )}>
        {isUser ? (
          <AvatarImage 
            key={(isCurrentUserMsg ? avatarUrl : undefined) + '-' + message.id}
            src={isCurrentUserMsg ? (avatarUrl || "/placeholder-user.jpg") : "/placeholder-user.jpg"}
            width={32}
            height={32}
            style={{ minWidth: 32, minHeight: 32, objectFit: 'cover' }}
          />
        ) : null}
        <AvatarFallback className={cn(
          isUser ? "bg-card/20 text-foreground/90 rounded-full" :
            // For AI: Soft muted background and contrasting icon color
            "bg-muted text-muted-foreground",
          // For AI: Force rounded-lg to match the Avatar container's new shape
          !isUser && "!rounded-lg"
        )}>
          {isUser ? <User size={16} className="sm:w-[18px] sm:h-[18px]" /> : <AiIcon size={16} className="sm:w-[18px] sm:h-[18px]" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col flex-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            'max-w-[90%] sm:max-w-[85%] md:max-w-[75%]', // Adjusted max-width for better mobile experience
            isUser
              ? 'bg-white/90 backdrop-blur-sm text-black rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-br-none border border-white/40 shadow-[inset_0_1px_2px_hsl(0_0%_100%_/_0.15),0_2px_6px_hsl(var(--foreground)_/_0.06)] hover:shadow-[inset_0_1px_2px_hsl(0_0%_100%_/_0.2),0_3px_8px_hsl(var(--foreground)_/_0.08)] ultra-smooth-transition'
              : 'bg-card/60 backdrop-blur-sm text-card-foreground rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-bl-none border border-card/40 shadow-[inset_0_1px_2px_hsl(var(--card)_/_0.15),0_2px_6px_hsl(var(--foreground)_/_0.06)] hover:shadow-[inset_0_1px_2px_hsl(var(--card)_/_0.2),0_3px_8px_hsl(var(--foreground)_/_0.08)] ultra-smooth-transition' // AI bubble style
          )}
        >
          {message.isLoading && !displayedText && !message.aiGeneratedImageUrl && !message.imageDataUri ? (
            <div className="flex items-center justify-center space-x-2 py-1">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">Pulse Ai</span>
            </div>
          ) : (
            <>
              {message.sender === 'user' && message.imageDataUri && (
                <div className="mb-2">
                  {message.imageFileName && <p className="text-xs text-primary-foreground/80 mb-1 truncate">{message.imageFileName}</p>}
                  <NextImage src={message.imageDataUri} alt="User upload" width={200} height={200} className="rounded-md max-w-full h-auto max-h-48 sm:max-h-60 object-contain" />
                </div>
              )}
               {message.sender === 'ai' && message.aiGeneratedImageUrl && (
                <div className="mb-2">
                   <NextImage src={message.aiGeneratedImageUrl} alt="AI generated image" width={300} height={300} className="rounded-md max-w-full h-auto max-h-64 sm:max-h-80 object-contain bg-muted" />
                </div>
              )}
              {displayedText ? (
                <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                  {isUser ? displayedText : renderMessageContent(displayedText).map((part, index) => <div key={index}>{part}</div>)}
                  {/* Blinking cursor removed */}
                </div>
              ) : (
                // If there's an image but no text yet, and it's loading, show nothing for text part
                message.isLoading && (message.aiGeneratedImageUrl || message.imageDataUri) ? null : null 
              )}
            </>
          )}
        </div>
        
        {(!message.isLoading || message.text || message.aiGeneratedImageUrl || message.imageDataUri) && (
           <div className={cn(
              "flex items-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 gap-1",
               isUser ? "justify-end" : "justify-start"
            )}>
            <Button
              variant="ghost"
              onClick={handleCopy}
              className={cn(
                "text-muted-foreground hover:text-foreground h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-card/[.15] hover:bg-card/[.3] shadow-[0_1px_2px_hsl(var(--foreground)_/_0.07)] hover:shadow-[0_1px_3px_hsl(var(--foreground)_/_0.1)]",
                isCopied ? "w-auto px-2 py-1 bg-green-500/15" : "px-1 justify-center", 
                "ultra-smooth-transition flex items-center"
              )}
              aria-label={isCopied ? "Copied" : "Copy message"}
              disabled={!message.text && !message.aiGeneratedImageUrl && !message.imageDataUri}
            >
              {isCopied ? (
                <div className="flex items-center gap-1.5">
                  <ClipboardCheck size={14} className="sm:w-[15px] sm:h-[15px] text-green-600 shrink-0" />
                  <span className="text-xs text-green-600 whitespace-nowrap">Copied!</span>
                </div>
              ) : (
                <ClipboardCopy size={14} className="sm:w-[16px] sm:h-[16px]" />
              )}
            </Button>

            {/* Simplify Button - Only show for AI messages with text */}
            {!isUser && message.text && (
              <Button
                variant="ghost"
                onClick={handleSimplify}
                disabled={isSimplifying}
                className={cn(
                  "text-muted-foreground hover:text-foreground h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-card/[.15] hover:bg-card/[.3]",
                  "shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                  "hover:shadow-[0_4px_16px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.15)]",
                  "border border-white/10 hover:border-white/20",
                  "backdrop-blur-sm",
                  isSimplifying ? "w-auto px-2 py-1 bg-blue-500/15" : "px-1 justify-center", 
                  "ultra-smooth-transition flex items-center"
                )}
                aria-label={isSimplifying ? "Simplifying..." : "Simplify text"}
              >
                {isSimplifying ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={14} className="sm:w-[15px] sm:h-[15px] animate-spin text-blue-600 shrink-0" />
                    <span className="text-xs text-blue-600 whitespace-nowrap">Simplifying...</span>
                  </div>
                ) : (
                  <Lightbulb size={14} className="sm:w-[16px] sm:h-[16px]" />
                )}
              </Button>
            )}

            {/* Speak Button - Only show for AI messages with text */}
            {!isUser && message.text && (
              <Button
                variant="ghost"
                onClick={handleSpeak}
                className={cn(
                  'text-muted-foreground hover:text-foreground h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-card/[.15] hover:bg-card/[.3] shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.15)] border border-white/10 hover:border-white/20 backdrop-blur-sm px-1 justify-center ultra-smooth-transition flex items-center',
                  isSpeaking ? 'animate-pulse' : ''
                )}
                aria-label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              >
                <Mic size={14} className="sm:w-[16px] sm:h-[16px]" />
              </Button>
            )}

            {/* Humanize Button - Only show for AI messages with text */}
            {!isUser && message.text && (
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={toggleHumanizeOptions}
                  disabled={isHumanizing}
                  className={cn(
                    "text-muted-foreground hover:text-foreground h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-card/[.15] hover:bg-card/[.3]",
                    "shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                    "hover:shadow-[0_4px_16px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.15)]",
                    "border border-white/10 hover:border-white/20",
                    "backdrop-blur-sm",
                    isHumanizing ? "w-auto px-2 py-1 bg-pink-500/15" : "px-1 justify-center", 
                    "ultra-smooth-transition flex items-center"
                  )}
                  aria-label={isHumanizing ? "Humanizing..." : "Humanize text"}
                >
                  {isHumanizing ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 size={14} className="sm:w-[15px] sm:h-[15px] animate-spin text-pink-600 shrink-0" />
                      <span className="text-xs text-pink-600 whitespace-nowrap">Humanizing...</span>
                    </div>
                  ) : (
                    <HumanIcon size={12} className="sm:w-[14px] sm:h-[14px]" />
                  )}
                </Button>
                
                {/* Smooth Options Transition */}
                {showHumanizeOptions && (
                  <div className="absolute top-full left-0 mt-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-md shadow-lg z-10 overflow-hidden min-w-[200px] sm:min-w-[220px]">
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        onClick={() => handleHumanize('short')}
                        className="w-full justify-start text-left h-auto p-2 hover:bg-accent/50 rounded-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Zap size={12} className="sm:w-[14px] sm:h-[14px] text-yellow-600 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">Concise Humanize</span>
                            <span className="text-xs text-muted-foreground">Brief, authentic</span>
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleHumanize('long')}
                        className="w-full justify-start text-left h-auto p-2 hover:bg-accent/50 rounded-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Brain size={12} className="sm:w-[14px] sm:h-[14px] text-pink-600 shrink-0" />
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
            )}

            {/* Summarize Button - Only show for AI messages with text */}
            {!isUser && message.text && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    disabled={isSummarizing}
                    className={cn(
                      "text-muted-foreground hover:text-foreground h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-card/[.15] hover:bg-card/[.3]",
                      "shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.1)]",
                      "hover:shadow-[0_4px_16px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.15)]",
                      "border border-white/10 hover:border-white/20",
                      "backdrop-blur-sm",
                      isSummarizing ? "w-auto px-2 py-1 bg-purple-500/15" : "px-1 justify-center", 
                      "ultra-smooth-transition flex items-center"
                    )}
                    aria-label={isSummarizing ? "Summarizing..." : "Summarize text"}
                  >
                    {isSummarizing ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 size={14} className="sm:w-[15px] sm:h-[15px] animate-spin text-purple-600 shrink-0" />
                        <span className="text-xs text-purple-600 whitespace-nowrap">Summarizing...</span>
                      </div>
                    ) : (
                      <FileText size={14} className="sm:w-[16px] sm:h-[16px]" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => handleSummarize('simple')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} className="sm:w-[16px] sm:h-[16px] text-green-600" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">Simple</span>
                      <span className="text-xs text-muted-foreground">Ultra simple terms</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSummarize('accurate')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Target size={14} className="sm:w-[16px] sm:h-[16px] text-blue-600" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">Accurate</span>
                      <span className="text-xs text-muted-foreground">Extremely precise</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {!isUser && message.text && message.text.includes('❌ Error: AI failed to respond.') && (
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="text-red-600 border-red-400 hover:bg-red-50"
            >
              Retry
            </Button>
            <span className="text-xs text-muted-foreground">Try again if your connection is stable.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageItem;


    