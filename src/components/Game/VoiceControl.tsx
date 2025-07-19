import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

// Define speech recognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
}

interface VoiceControlProps {
  enabled: boolean;
  onCommand: (command: string, value?: string) => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ enabled, onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for speech recognition support
    const hasSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(hasSupport);
    
    if (!hasSupport) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition() as SpeechRecognitionInstance;
    
    // Configure recognition settings
    recognitionInstance.continuous = false; // Changed to false for better reliability
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
    };

    recognitionInstance.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
      
      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      
      // Restart recognition if it's still enabled and no error occurred
      if (enabled) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            if (recognitionInstance && enabled) {
              recognitionInstance.start();
            }
          } catch (e) {
            console.log('Recognition restart skipped - already running or disabled');
          }
        }, 500); // Increased delay for better stability
      }
    };

    recognitionInstance.onresult = (event) => {
      console.log('Voice recognition result event:', event);
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcript = result[0].transcript.toLowerCase().trim();
          console.log('Final transcript:', transcript);
          processVoiceCommand(transcript);
        }
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error, event.message);
      setIsListening(false);
      
      // Handle different error types
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          toast({
            title: "🎤 Microphone Access Required",
            description: "Please allow microphone access to use voice commands.",
            variant: "destructive",
          });
          break;
        case 'network':
          toast({
            title: "🌐 Network Error",
            description: "Voice recognition requires an internet connection.",
            variant: "destructive",
          });
          break;
        case 'no-speech':
          // Don't show error for no speech - just restart
          console.log('No speech detected, continuing...');
          break;
        case 'aborted':
          console.log('Recognition aborted');
          break;
        default:
          console.log('Recognition error:', event.error);
      }
    };

    recognitionInstance.onspeechstart = () => {
      console.log('Speech detected');
    };

    recognitionInstance.onspeechend = () => {
      console.log('Speech ended');
    };

    setRecognition(recognitionInstance);

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []); // Remove dependencies to prevent recreation

  useEffect(() => {
    if (!recognition || !isSupported) return;

    if (enabled && !isListening) {
      try {
        console.log('Starting voice recognition...');
        recognition.start();
        toast({
          title: "🎤 Voice Commands Active",
          description: "Say 'select 1', 'repeat', 'help', or just say a number",
          duration: 3000,
        });
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    } else if (!enabled && isListening) {
      console.log('Stopping voice recognition...');
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      recognition.stop();
    }
  }, [enabled, recognition, isListening, isSupported, toast]);

  const processVoiceCommand = (transcript: string) => {
    console.log('Processing voice command:', transcript);
    
    // Provide audio feedback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Command received');
      utterance.volume = 0.3;
      utterance.rate = 1.5;
      window.speechSynthesis.speak(utterance);
    }

    // Select number commands with more variations
    const selectPatterns = [
      /select (\d+)/,
      /choose (\d+)/,
      /pick (\d+)/,
      /number (\d+)/,
      /option (\d+)/,
      /click (\d+)/,
      /tap (\d+)/
    ];
    
    for (const pattern of selectPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const number = match[1];
        console.log('Select command detected:', number);
        onCommand('select', number);
        return;
      }
    }

    // Direct number commands (just saying "1", "2", etc.)
    const numberMatch = transcript.match(/^(\d+)$/);
    if (numberMatch) {
      console.log('Direct number command:', numberMatch[1]);
      onCommand('select', numberMatch[1]);
      return;
    }

    // Other command patterns with more variations
    const commandPatterns = [
      { patterns: ['repeat', 'say again', 'again'], command: 'repeat' },
      { patterns: ['help', 'instructions', 'how to play'], command: 'help' },
      { patterns: ['next', 'skip', 'new round'], command: 'next' },
      { patterns: ['pause', 'stop'], command: 'pause' },
      { patterns: ['start', 'begin', 'play'], command: 'start' },
      { patterns: ['contrast', 'high contrast'], command: 'contrast' },
      { patterns: ['audio', 'sound', 'mute'], command: 'audio' }
    ];

    for (const { patterns, command } of commandPatterns) {
      if (patterns.some(pattern => transcript.includes(pattern))) {
        console.log('Command detected:', command);
        onCommand(command);
        return;
      }
    }
    
    console.log('No matching command found for:', transcript);
  };

  // Show status for debugging (remove in production)
  if (!isSupported) {
    console.warn('Voice recognition not supported in this browser');
  }

  return null; // This component doesn't render anything visible
};

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
