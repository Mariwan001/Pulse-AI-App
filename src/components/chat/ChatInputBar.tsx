"use client";

import type { ChangeEvent, FC, FormEvent } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rocket, XCircle, Aperture, Mic, MicOff } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // For Loader2 cn usage

// Lottie animation data (remains undefined as per previous state)
const sendButtonAnimationData = undefined; 

interface ChatInputBarProps {
  onSendMessage: (messageText: string, imageDataUri: string | null) => void;
  isGenerating: boolean;
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const ChatInputBar: FC<ChatInputBarProps> = ({
  onSendMessage,
  isGenerating,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSendButtonHovered, setIsSendButtonHovered] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null); // For SpeechRecognition instance
  const [isLocked, setIsLocked] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // Example limit: 4MB
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 4MB.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
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
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImagePreview(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the file input
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if ((inputValue.trim() || selectedImagePreview) && !isGenerating && !isImageUploading) {
      setIsLocked(true);
      onSendMessage(inputValue, selectedImagePreview);
      setInputValue(''); // Clear text input
      handleRemoveImage(); // Clear image preview
      setTimeout(() => setIsLocked(false), 1000); // Unlock after 1s (or after send completes if async)
    }
  };

  // Speech Recognition Logic
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Process single utterances
    recognition.interimResults = true; // Get interim results for faster feedback
    recognition.lang = 'en-US'; // Set language

    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Update the input field with the latest transcript (interim or final)
      setInputValue(finalTranscript || interimTranscript);
      
      if (finalTranscript) {
        setIsListening(false); 
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      toast({
        title: "Speech Recognition Error",
        description: event.error === 'no-speech' ? "No speech detected." : event.error === 'audio-capture' ? "Microphone error." : "An error occurred during speech recognition.",
        variant: "destructive",
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Cleanup function to stop recognition if the component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // Dependencies for the effect

  const handleToggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Not Initialized",
        description: "Cannot start listening. Please refresh or try another browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      // onend will set isListening to false
    } else {
      try {
        // Clear previous input before starting new recognition if you prefer that behavior
        // setInputValue(''); 
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition: ", error);
        toast({
          title: "Could not start listening",
          description: "Please ensure microphone permissions are granted and try again.",
          variant: "destructive"
        });
        setIsListening(false); // Ensure state is reset on error
      }
    }
  }, [isListening, toast]);

  return (
    <div className="sticky bottom-0 bg-background border-t border-border p-4">
      {selectedImagePreview && (
        <div className="mb-2 p-2 border border-border rounded-md relative bg-card max-w-xs">
          <p className="text-xs text-muted-foreground mb-1 truncate">
            {selectedImageFile?.name || 'Attached image'}
          </p>
          <Image 
            src={selectedImagePreview} 
            alt="Preview of the image you selected to send" 
            width={80} 
            height={80} 
            className="rounded-md object-cover max-h-20 w-auto" 
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleRemoveImage}
            aria-label="Remove image"
          >
            <XCircle size={18} />
          </Button>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2"
      >
        <Input
          type="text"
          placeholder="Message Pulse..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow text-sm"
          disabled={isGenerating || isImageUploading || isLocked}
          aria-label="Chat input"
        />
        <Button 
          type="button" 
          variant="secondary" 
          size="icon" 
          className={cn(
            "h-8 w-8 rounded-md bg-card/20 border border-border/50 text-foreground/90",
            "shadow-[inset_0_1px_2px_hsl(var(--foreground)_/_0.1),0_2px_4px_hsl(var(--foreground)_/_0.08)]",
            "hover:bg-card/30 hover:border-border/70 hover:text-foreground",
            "ultra-smooth-transition"
          )}
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating || isImageUploading}
          aria-label="Attach image"
        >
          {isImageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Aperture className="h-4 w-4" />}
        </Button>
        {/* Voice Input Button */}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-md bg-card/20 border border-border/50 text-foreground/90",
            "shadow-[inset_0_1px_2px_hsl(var(--foreground)_/_0.1),0_2px_4px_hsl(var(--foreground)_/_0.08)]",
            "hover:bg-card/30 hover:border-border/70 hover:text-foreground",
            "ultra-smooth-transition",
            isListening && "bg-red-500/20 border-red-500/50 text-red-500 shadow-[inset_0_1px_2px_hsl(0_84%_60%_/_0.2),0_2px_4px_hsl(0_84%_60%_/_0.15)]"
          )}
          onClick={handleToggleListening}
          disabled={isGenerating || isImageUploading || !recognitionRef.current}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          disabled={isImageUploading || isGenerating}
        />
        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={(!inputValue.trim() && !selectedImagePreview) || isImageUploading || isGenerating || isLocked}
          aria-label="Send message"
          className={cn(
            "h-8 w-8 rounded-md bg-white/10 border border-white/30 text-white/80",
            "shadow-[inset_0_1px_2px_hsl(var(--foreground)_/_0.08),0_1px_3px_hsl(var(--foreground)_/_0.06)]",
            "hover:bg-white/20 hover:border-white/50 hover:text-white/90",
            "ultra-smooth-transition",
            "disabled:bg-muted/20 disabled:border-muted/50 disabled:text-muted/50"
          )}
          onMouseEnter={() => setIsSendButtonHovered(true)}
          onMouseLeave={() => setIsSendButtonHovered(false)}
        >
          {sendButtonAnimationData ? (
            <Rocket className="h-4 w-4" /> 
          ) : (
            <Rocket className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatInputBar;

// Basic Loader2 icon for image uploading state
const Loader2: FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("animate-spin", className)}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
