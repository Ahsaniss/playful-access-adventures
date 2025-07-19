import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Game shapes and colors
const SHAPES = ['circle', 'square', 'triangle', 'star'] as const;
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'] as const;

type Shape = typeof SHAPES[number];
type Color = typeof COLORS[number];

interface GamePiece {
  id: string;
  shape: Shape;
  color: Color;
}

interface GameBoardProps {
  onScoreChange: (score: number) => void;
  isHighContrast: boolean;
  onToggleContrast: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  onScoreChange, 
  isHighContrast, 
  onToggleContrast 
}) => {
  const [currentTarget, setCurrentTarget] = useState<GamePiece | null>(null);
  const [options, setOptions] = useState<GamePiece[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [celebrating, setCelebrating] = useState(false);
  
  const { toast } = useToast();

  // Text-to-speech function
  const speak = useCallback((text: string) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled]);

  // Generate new round
  const generateRound = useCallback(() => {
    const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    const target: GamePiece = {
      id: 'target',
      shape: targetShape,
      color: targetColor
    };

    // Generate options (including correct answer)
    const numOptions = Math.min(3 + level, 6);
    const newOptions: GamePiece[] = [target];
    
    while (newOptions.length < numOptions) {
      const wrongShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const wrongColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      
      // Ensure it's different from target
      if (wrongShape !== targetShape || wrongColor !== targetColor) {
        const wrongOption: GamePiece = {
          id: `option-${newOptions.length}`,
          shape: wrongShape,
          color: wrongColor
        };
        
        // Avoid duplicates
        if (!newOptions.some(opt => opt.shape === wrongShape && opt.color === wrongColor)) {
          newOptions.push(wrongOption);
        }
      }
    }

    // Shuffle options
    const shuffledOptions = newOptions.sort(() => Math.random() - 0.5);
    
    setCurrentTarget(target);
    setOptions(shuffledOptions);
    
    // Announce the target
    setTimeout(() => {
      speak(`Find the ${targetColor} ${targetShape}`);
    }, 500);
  }, [level, speak]);

  // Handle correct answer
  const handleCorrectAnswer = useCallback(() => {
    const newScore = score + (level * 10);
    setScore(newScore);
    onScoreChange(newScore);
    
    setCelebrating(true);
    speak('Great job! That\'s correct!');
    
    toast({
      title: "🎉 Excellent!",
      description: `You found the ${currentTarget?.color} ${currentTarget?.shape}!`,
    });

    // Level up every 5 correct answers
    if (newScore % 50 === 0 && level < 5) {
      setLevel(prev => prev + 1);
      speak(`Level up! Now level ${level + 1}`);
    }

    setTimeout(() => {
      setCelebrating(false);
      generateRound();
    }, 2000);
  }, [score, level, currentTarget, speak, toast, onScoreChange, generateRound]);

  // Handle wrong answer
  const handleWrongAnswer = useCallback((selectedPiece: GamePiece) => {
    speak(`That's the ${selectedPiece.color} ${selectedPiece.shape}. Try again! Look for the ${currentTarget?.color} ${currentTarget?.shape}`);
    
    toast({
      title: "Try again!",
      description: `That's a ${selectedPiece.color} ${selectedPiece.shape}. Look for the ${currentTarget?.color} ${currentTarget?.shape}`,
      variant: "destructive",
    });
  }, [currentTarget, speak, toast]);

  // Handle piece selection
  const handlePieceClick = useCallback((piece: GamePiece) => {
    if (!currentTarget) return;

    if (piece.shape === currentTarget.shape && piece.color === currentTarget.color) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer(piece);
    }
  }, [currentTarget, handleCorrectAnswer, handleWrongAnswer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= '1' && key <= '6') {
        const index = parseInt(key) - 1;
        if (index < options.length) {
          handlePieceClick(options[index]);
        }
      }
      
      if (key === 'r' || key === 'R') {
        speak(`Find the ${currentTarget?.color} ${currentTarget?.shape}`);
      }
      
      if (key === 'h' || key === 'H') {
        speak(`Level ${level}. Score ${score}. Find the ${currentTarget?.color} ${currentTarget?.shape}. Press numbers 1 through ${options.length} to select pieces.`);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [options, currentTarget, level, score, speak, handlePieceClick]);

  // Initialize first round
  useEffect(() => {
    generateRound();
    speak('Welcome to Inclusive Play! Find the matching shape and color.');
  }, []);

  // Render shape
  const renderShape = (shape: Shape, color: Color, size: string = "w-16 h-16") => {
    const colorClass = `bg-game-${color}`;
    const baseClasses = `${size} ${colorClass} transition-all duration-300`;
    
    if (isHighContrast) {
      switch (shape) {
        case 'circle':
          return <div className={`${baseClasses} rounded-full border-4 border-black`} />;
        case 'square':
          return <div className={`${baseClasses} border-4 border-black`} />;
        case 'triangle':
          return <div className={`${size} relative`}>
            <div className={`absolute inset-0 ${colorClass} border-4 border-black`} 
                 style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          </div>;
        case 'star':
          return <div className={`${size} relative`}>
            <div className={`absolute inset-0 ${colorClass} border-4 border-black`}
                 style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          </div>;
      }
    } else {
      switch (shape) {
        case 'circle':
          return <div className={`${baseClasses} rounded-full shadow-lg`} />;
        case 'square':
          return <div className={`${baseClasses} rounded-lg shadow-lg`} />;
        case 'triangle':
          return <div className={`${size} relative`}>
            <div className={`absolute inset-0 ${colorClass} shadow-lg`}
                 style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          </div>;
        case 'star':
          return <div className={`${size} relative`}>
            <div className={`absolute inset-0 ${colorClass} shadow-lg`}
                 style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
          </div>;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header with controls */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-foreground">InclusivePlay</h1>
          <p className="text-lg text-muted-foreground">Level {level} • Score: {score}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="min-w-touch min-h-touch"
            aria-label={audioEnabled ? "Disable audio" : "Enable audio"}
          >
            {audioEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={onToggleContrast}
            className="min-w-touch min-h-touch"
            aria-label={isHighContrast ? "Disable high contrast" : "Enable high contrast"}
          >
            {isHighContrast ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Target display */}
      {currentTarget && (
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Find this shape:</h2>
          <div className="flex justify-center mb-4">
            {renderShape(currentTarget.shape, currentTarget.color, "w-24 h-24")}
          </div>
          <p className="text-xl font-medium capitalize">
            {currentTarget.color} {currentTarget.shape}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Press numbers 1-{options.length} or click to select • Press R to repeat • Press H for help
          </p>
        </Card>
      )}

      {/* Game options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {options.map((piece, index) => (
          <Button
            key={piece.id}
            variant="outline"
            className={`
              min-h-32 p-6 flex flex-col items-center gap-3 text-lg font-medium
              hover:scale-105 transition-all duration-300 min-w-touch
              ${celebrating && piece.shape === currentTarget?.shape && piece.color === currentTarget?.color 
                ? 'animate-celebrate bg-success text-success-foreground' 
                : ''
              }
            `}
            onClick={() => handlePieceClick(piece)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePieceClick(piece);
              }
            }}
            aria-label={`Option ${index + 1}: ${piece.color} ${piece.shape}`}
          >
            <div className="relative">
              {renderShape(piece.shape, piece.color)}
              <span className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
            </div>
            <span className="capitalize text-sm">
              {piece.color} {piece.shape}
            </span>
          </Button>
        ))}
      </div>

      {/* Instructions */}
      <Card className="p-4 text-center max-w-2xl mx-auto">
        <p className="text-muted-foreground">
          🎯 Click or use number keys to select shapes • 🔊 Audio feedback enabled • 
          ♿ High contrast mode available • ⌨️ Full keyboard support
        </p>
      </Card>
    </div>
  );
};