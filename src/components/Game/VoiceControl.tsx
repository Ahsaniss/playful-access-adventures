import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Define speech recognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface VoiceControlProps {
  enabled: boolean;
  onCommand: (command: string, value?: string) => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ enabled, onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      if (enabled) {
        // Restart recognition if it's still enabled
        setTimeout(() => {
          try {
            recognitionInstance.start();
          } catch (e) {
            // Recognition might already be running
          }
        }, 100);
      }
    };

    recognitionInstance.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.toLowerCase().trim();
        processVoiceCommand(transcript);
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use voice commands.",
          variant: "destructive",
        });
      }
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.stop();
    };
  }, []);

  useEffect(() => {
    if (!recognition) return;

    if (enabled && !isListening) {
      try {
        recognition.start();
        toast({
          title: "🎤 Voice Commands Active",
          description: "Say 'select 1', 'repeat', or 'help'",
        });
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    } else if (!enabled && isListening) {
      recognition.stop();
    }
  }, [enabled, recognition, isListening, toast]);

  const processVoiceCommand = (transcript: string) => {
    console.log('Voice command received:', transcript);

    // Select number commands
    const selectMatch = transcript.match(/select (\d+)|choose (\d+)|pick (\d+)|number (\d+)/);
    if (selectMatch) {
      const number = selectMatch[1] || selectMatch[2] || selectMatch[3] || selectMatch[4];
      onCommand('select', number);
      return;
    }

    // Direct number commands
    const numberMatch = transcript.match(/^(\d+)$/);
    if (numberMatch) {
      onCommand('select', numberMatch[1]);
      return;
    }

    // Other commands
    if (transcript.includes('repeat') || transcript.includes('again')) {
      onCommand('repeat');
    } else if (transcript.includes('help') || transcript.includes('instructions')) {
      onCommand('help');
    } else if (transcript.includes('next') || transcript.includes('skip')) {
      onCommand('next');
    } else if (transcript.includes('pause') || transcript.includes('stop')) {
      onCommand('pause');
    } else if (transcript.includes('start') || transcript.includes('begin')) {
      onCommand('start');
    } else if (transcript.includes('contrast') || transcript.includes('high contrast')) {
      onCommand('contrast');
    } else if (transcript.includes('audio') || transcript.includes('sound')) {
      onCommand('audio');
    }
  };

  return null; // This component doesn't render anything
};

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
