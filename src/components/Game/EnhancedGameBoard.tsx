import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AccessibilitySettings } from './AccessibilitySettings';
import { VoiceControl } from './VoiceControl';
import { SwitchInput } from './SwitchInput';

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

interface EnhancedGameBoardProps {
  onScoreChange: (score: number) => void;
  accessibilitySettings: any;
  onSettingsChange: (settings: any) => void;
}

export const EnhancedGameBoard: React.FC<EnhancedGameBoardProps> = ({ 
  onScoreChange, 
  accessibilitySettings,
  onSettingsChange
}) => {
  const [currentTarget, setCurrentTarget] = useState<GamePiece | null>(null);
  const [options, setOptions] = useState<GamePiece[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [celebrating, setCelebrating] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState(-1);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Enhanced text-to-speech function with better control
  const speak = useCallback((text: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    if (!accessibilitySettings.audioEnabled || !window.speechSynthesis) return;
    
    // Cancel previous speech for medium and high priority
    if (priority !== 'low') {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = accessibilitySettings.screenReaderMode ? 0.6 : 0.8;
    utterance.pitch = 1.2;
    utterance.volume = 0.8;
    
    window.speechSynthesis.speak(utterance);
  }, [accessibilitySettings.audioEnabled, accessibilitySettings.screenReaderMode]);

  // Vibration feedback
  const vibrate = useCallback((pattern: number | number[]) => {
    if (accessibilitySettings.vibration && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [accessibilitySettings.vibration]);

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
      
      if (wrongShape !== targetShape || wrongColor !== targetColor) {
        const wrongOption: GamePiece = {
          id: `option-${newOptions.length}`,
          shape: wrongShape,
          color: wrongColor
        };
        
        if (!newOptions.some(opt => opt.shape === wrongShape && opt.color === wrongColor)) {
          newOptions.push(wrongOption);
        }
      }
    }

    const shuffledOptions = newOptions.sort(() => Math.random() - 0.5);
    
    setCurrentTarget(target);
    setOptions(shuffledOptions);
    setCurrentHighlight(-1);
    
    // Clear any existing auto-advance timer
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
    }

    // Set up auto-advance if enabled
    if (accessibilitySettings.autoAdvance) {
      const timer = setTimeout(() => {
        speak("Time's up! Moving to next round.", 'high');
        generateRound();
      }, accessibilitySettings.autoAdvanceTime * 1000);
      setAutoAdvanceTimer(timer);
    }
    
    // Announce the target with appropriate detail level
    setTimeout(() => {
      const announcement = accessibilitySettings.screenReaderMode 
        ? `Find the ${targetColor} ${targetShape}. This is a ${targetColor} colored ${targetShape} shape. There are ${shuffledOptions.length} options to choose from.`
        : `Find the ${targetColor} ${targetShape}`;
      speak(announcement, 'high');
    }, 500);
  }, [level, speak, accessibilitySettings.autoAdvance, accessibilitySettings.autoAdvanceTime, accessibilitySettings.screenReaderMode, autoAdvanceTimer]);

  // Handle correct answer
  const handleCorrectAnswer = useCallback(() => {
    const newScore = score + (level * 10);
    setScore(newScore);
    onScoreChange(newScore);
    
    setCelebrating(true);
    vibrate([100, 50, 100, 50, 200]);
    
    const celebrationMessage = accessibilitySettings.screenReaderMode
      ? `Excellent work! You correctly identified the ${currentTarget?.color} ${currentTarget?.shape}. Your score is now ${newScore} points.`
      : 'Great job! That\'s correct!';
    
    speak(celebrationMessage, 'high');
    
    toast({
      title: "🎉 Excellent!",
      description: `You found the ${currentTarget?.color} ${currentTarget?.shape}!`,
    });

    // Level up every 5 correct answers
    if (newScore % 50 === 0 && level < 5) {
      setLevel(prev => prev + 1);
      speak(`Amazing! Level up! Now level ${level + 1}. The game will get more challenging.`, 'high');
    }

    setTimeout(() => {
      setCelebrating(false);
      generateRound();
    }, accessibilitySettings.extendedTimeout ? 3000 : 2000);
  }, [score, level, currentTarget, speak, toast, onScoreChange, generateRound, vibrate, accessibilitySettings.screenReaderMode, accessibilitySettings.extendedTimeout]);

  // Handle wrong answer
  const handleWrongAnswer = useCallback((selectedPiece: GamePiece) => {
    vibrate(200);
    
    const errorMessage = accessibilitySettings.screenReaderMode
      ? `That's not quite right. You selected the ${selectedPiece.color} ${selectedPiece.shape}, but we're looking for the ${currentTarget?.color} ${currentTarget?.shape}. Try again!`
      : `That's the ${selectedPiece.color} ${selectedPiece.shape}. Try again! Look for the ${currentTarget?.color} ${currentTarget?.shape}`;
    
    speak(errorMessage, 'high');
    
    toast({
      title: "Try again!",
      description: `That's a ${selectedPiece.color} ${selectedPiece.shape}. Look for the ${currentTarget?.color} ${currentTarget?.shape}`,
      variant: "destructive",
    });
  }, [currentTarget, speak, toast, vibrate, accessibilitySettings.screenReaderMode]);

  // Handle piece selection
  const handlePieceClick = useCallback((piece: GamePiece) => {
    if (!currentTarget) return;

    if (piece.shape === currentTarget.shape && piece.color === currentTarget.color) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer(piece);
    }
  }, [currentTarget, handleCorrectAnswer, handleWrongAnswer]);

  // Voice command handler
  const handleVoiceCommand = useCallback((command: string, value?: string) => {
    console.log('Voice command received in game:', command, value); // Debug log
    
    switch (command) {
      case 'select':
        if (value) {
          const index = parseInt(value) - 1;
          if (index >= 0 && index < options.length) {
            console.log('Selecting option:', index + 1, options[index]); // Debug log
            handlePieceClick(options[index]);
          }
        }
        break;
      case 'repeat':
        speak(`Find the ${currentTarget?.color} ${currentTarget?.shape}`, 'high');
        break;
      case 'help':
        const helpMessage = `You are playing level ${level} with a score of ${score}. Find the ${currentTarget?.color} ${currentTarget?.shape}. There are ${options.length} options numbered 1 through ${options.length}. Say a number to select, or say "repeat" to hear the target again.`;
        speak(helpMessage, 'high');
        break;
      case 'next':
        generateRound();
        break;
      case 'contrast':
        onSettingsChange({
          ...accessibilitySettings,
          isHighContrast: !accessibilitySettings.isHighContrast
        });
        break;
      case 'audio':
        onSettingsChange({
          ...accessibilitySettings,
          audioEnabled: !accessibilitySettings.audioEnabled
        });
        break;
    }
  }, [options, currentTarget, level, score, speak, handlePieceClick, generateRound, accessibilitySettings, onSettingsChange]);

  // Switch input handlers
  const handleSwitchSelect = useCallback((index: number) => {
    if (index < options.length) {
      setCurrentHighlight(index);
      speak(`Option ${index + 1}: ${options[index].color} ${options[index].shape}`, 'low');
    }
  }, [options, speak]);

  const handleSwitchActivate = useCallback(() => {
    if (currentHighlight >= 0 && currentHighlight < options.length) {
      handlePieceClick(options[currentHighlight]);
    }
  }, [currentHighlight, options, handlePieceClick]);

  // Keyboard navigation with enhanced accessibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;
      
      // Number key selection
      if (key >= '1' && key <= '6') {
        const index = parseInt(key) - 1;
        if (index < options.length) {
          if (accessibilitySettings.switchInput) {
            setCurrentHighlight(index);
            speak(`Highlighted option ${index + 1}: ${options[index].color} ${options[index].shape}`, 'low');
          } else {
            handlePieceClick(options[index]);
          }
        }
      }
      
      // Other keyboard shortcuts
      if (key === 'r' || key === 'R') {
        speak(`Find the ${currentTarget?.color} ${currentTarget?.shape}`, 'high');
      } else if (key === 'h' || key === 'H') {
        const helpMessage = `Level ${level}. Score ${score}. Find the ${currentTarget?.color} ${currentTarget?.shape}. Press numbers 1 through ${options.length} to select pieces.`;
        speak(helpMessage, 'high');
      } else if (key === 'n' || key === 'N') {
        if (e.ctrlKey) {
          generateRound();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [options, currentTarget, level, score, speak, handlePieceClick, generateRound, accessibilitySettings.switchInput]);

  // Initialize first round
  useEffect(() => {
    generateRound();
    
    const welcomeMessage = accessibilitySettings.screenReaderMode
      ? 'Welcome to Inclusive Play, an accessible shape and color matching game. Listen carefully and find the matching shape and color from the available options. You can use voice commands by saying numbers like "1" or "2", or saying "help" for instructions.'
      : 'Welcome to Inclusive Play! Find the matching shape and color. Use voice commands or click to play.';
    
    speak(welcomeMessage, 'high');
  }, []);

  // Apply dynamic styles based on accessibility settings
  const getGameStyle = () => {
    return {
      fontSize: `${accessibilitySettings.fontSize}%`,
      filter: accessibilitySettings.colorBlindMode !== 'none' ? getColorBlindFilter() : 'none',
      animationDuration: `${1 / accessibilitySettings.animationSpeed}s`,
    };
  };

  const getColorBlindFilter = () => {
    switch (accessibilitySettings.colorBlindMode) {
      case 'protanopia':
        return 'sepia(1) saturate(0.8) hue-rotate(-50deg)';
      case 'deuteranopia':
        return 'sepia(1) saturate(0.6) hue-rotate(80deg)';
      case 'tritanopia':
        return 'sepia(1) saturate(0.9) hue-rotate(180deg)';
      default:
        return 'none';
    }
  };

  // Render shape with accessibility enhancements
  const renderShape = (shape: Shape, color: Color, size: string = "w-16 h-16", isHighlighted: boolean = false) => {
    // Map colors to proper CSS values
    const getColorStyle = (color: Color) => {
      const colorMap = {
        red: 'hsl(0, 85%, 55%)',
        blue: 'hsl(220, 85%, 55%)', 
        green: 'hsl(120, 60%, 50%)',
        yellow: 'hsl(45, 100%, 55%)',
        purple: 'hsl(280, 85%, 60%)',
        orange: 'hsl(25, 90%, 55%)'
      };
      return colorMap[color];
    };

    const baseClasses = `${size} game-shape transition-all duration-300 flex-shrink-0`;
    const highlightClasses = isHighlighted ? 'highlighted animate-gentle-pulse' : '';
    const contrastClasses = accessibilitySettings.isHighContrast ? 'border-2 border-black' : 'shadow-md';
    
    const finalClasses = `${baseClasses} ${highlightClasses} ${contrastClasses}`;
    
    const shapeStyle = {
      backgroundColor: getColorStyle(color),
      minWidth: '4rem',
      minHeight: '4rem',
    };

    switch (shape) {
      case 'circle':
        return (
          <div 
            className={`${finalClasses} rounded-full flex items-center justify-center`} 
            style={shapeStyle}
            title={`${color} circle`}
            aria-label={`${color} circle shape`}
          >
            {accessibilitySettings.isHighContrast && (
              <span className="text-white font-bold text-sm drop-shadow-lg" aria-hidden="true">●</span>
            )}
          </div>
        );
      case 'square':
        return (
          <div 
            className={`${finalClasses} rounded-lg flex items-center justify-center`} 
            style={shapeStyle}
            title={`${color} square`}
            aria-label={`${color} square shape`}
          >
            {accessibilitySettings.isHighContrast && (
              <span className="text-white font-bold text-sm drop-shadow-lg" aria-hidden="true">■</span>
            )}
          </div>
        );
      case 'triangle':
        return (
          <div 
            className={`${size} relative flex items-center justify-center flex-shrink-0`} 
            style={{ minWidth: '4rem', minHeight: '4rem' }}
            title={`${color} triangle`}
            aria-label={`${color} triangle shape`}
          >
            <div 
              className={`absolute inset-1 ${contrastClasses} transition-all duration-300`}
              style={{ 
                clipPath: 'polygon(50% 10%, 10% 90%, 90% 90%)',
                backgroundColor: getColorStyle(color)
              }} 
            />
            {isHighlighted && <div className="absolute inset-0 ring-2 ring-primary rounded-sm animate-gentle-pulse" />}
            {accessibilitySettings.isHighContrast && (
              <span className="relative z-10 text-white font-bold text-sm drop-shadow-lg" aria-hidden="true">▲</span>
            )}
          </div>
        );
      case 'star':
        return (
          <div 
            className={`${size} relative flex items-center justify-center flex-shrink-0`} 
            style={{ minWidth: '4rem', minHeight: '4rem' }}
            title={`${color} star`}
            aria-label={`${color} star shape`}
          >
            <div 
              className={`absolute inset-1 ${contrastClasses} transition-all duration-300`}
              style={{ 
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                backgroundColor: getColorStyle(color)
              }} 
            />
            {isHighlighted && <div className="absolute inset-0 ring-2 ring-primary rounded-sm animate-gentle-pulse" />}
            {accessibilitySettings.isHighContrast && (
              <span className="relative z-10 text-white font-bold text-sm drop-shadow-lg" aria-hidden="true">★</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6" style={getGameStyle()}>
      {/* Voice Control Component */}
      <VoiceControl 
        enabled={accessibilitySettings.voiceCommands}
        onCommand={handleVoiceCommand}
      />

      {/* Voice Recognition Status Indicator */}
      {accessibilitySettings.voiceCommands && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">🎤 Voice Active</span>
          </div>
        </div>
      )}

      {/* Switch Input Component */}
      <SwitchInput
        enabled={accessibilitySettings.switchInput}
        options={options.length}
        onSelect={handleSwitchSelect}
        onActivate={handleSwitchActivate}
      />

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
          {!accessibilitySettings.simplifiedUI && (
            <div className="text-sm text-muted-foreground mt-2 space-y-1">
              <p>Press numbers 1-{options.length} or click to select • Press R to repeat • Press H for help</p>
              {accessibilitySettings.voiceCommands && (
                <p>🎤 Voice: Say "1", "2", etc. or "Select 1", "Repeat", "Help"</p>
              )}
              {accessibilitySettings.switchInput && (
                <p>🔄 Switch: Space to scan, Enter to select</p>
              )}
              {accessibilitySettings.autoAdvance && (
                <p>⏱️ Auto-advance in {accessibilitySettings.autoAdvanceTime}s</p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Game options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {options.map((piece, index) => (
          <Button
            key={piece.id}
            variant="outline"
            className={`
              min-h-36 p-4 flex flex-col items-center justify-center gap-3 text-lg font-medium
              hover:scale-105 transition-all duration-300 min-w-touch min-h-touch
              ${celebrating && piece.shape === currentTarget?.shape && piece.color === currentTarget?.color 
                ? 'animate-celebrate bg-success/20 border-success border-2' 
                : ''
              }
              ${currentHighlight === index ? 'ring-4 ring-primary bg-primary/10' : ''}
            `}
            onClick={() => handlePieceClick(piece)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePieceClick(piece);
              }
            }}
            aria-label={`Option ${index + 1}: ${piece.color} ${piece.shape}${currentHighlight === index ? ' - Currently highlighted' : ''}`}
            style={{
              fontSize: accessibilitySettings.simplifiedUI ? '1.25rem' : '1rem',
            }}
          >
            <div className="relative flex items-center justify-center w-20 h-20">
              {renderShape(piece.shape, piece.color, "w-16 h-16", currentHighlight === index)}
              <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-10">
                {index + 1}
              </span>
            </div>
            <span className="capitalize text-sm mt-2">
              {piece.color} {piece.shape}
            </span>
          </Button>
        ))}
      </div>

      {/* Enhanced Instructions */}
      {!accessibilitySettings.simplifiedUI && (
        <Card className="p-4 text-center max-w-2xl mx-auto">
          <p className="text-muted-foreground">
            🎯 Multi-input support • 🔊 Enhanced audio • ♿ Full accessibility • ⌨️ Keyboard + Voice + Switch
          </p>
        </Card>
      )}
    </div>
  );
};
