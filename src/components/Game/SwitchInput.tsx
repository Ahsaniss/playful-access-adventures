import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SwitchInputProps {
  enabled: boolean;
  options: number;
  onSelect: (index: number) => void;
  onActivate: () => void;
}

export const SwitchInput: React.FC<SwitchInputProps> = ({ 
  enabled, 
  options, 
  onSelect, 
  onActivate 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSpeed, setScanSpeed] = useState(1000); // milliseconds
  const { toast } = useToast();

  // Auto-scanning functionality
  useEffect(() => {
    if (!enabled || !isScanning) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (options + 1)); // +1 for activate option
    }, scanSpeed);

    return () => clearInterval(interval);
  }, [enabled, isScanning, options, scanSpeed]);

  // Handle switch activation (spacebar, Enter, or external switch)
  const handleSwitchPress = useCallback(() => {
    if (!enabled) return;

    if (!isScanning) {
      // Start scanning
      setIsScanning(true);
      setCurrentIndex(0);
      toast({
        title: "🔄 Switch Scanning Started",
        description: "Press switch again to select highlighted option",
      });
    } else {
      // Select current option
      if (currentIndex < options) {
        onSelect(currentIndex);
        toast({
          title: "✅ Option Selected",
          description: `Selected option ${currentIndex + 1}`,
        });
      } else {
        // Activate option
        onActivate();
        toast({
          title: "🎯 Activated",
          description: "Action confirmed",
        });
      }
      setIsScanning(false);
    }
  }, [enabled, isScanning, currentIndex, options, onSelect, onActivate, toast]);

  // Keyboard event handling for switch input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!enabled) return;

      // Switch input keys: Space, Enter, or number pad 0
      if (event.code === 'Space' || event.code === 'Enter' || event.code === 'Numpad0') {
        event.preventDefault();
        handleSwitchPress();
      }

      // Speed adjustment
      if (event.code === 'ArrowUp' && event.ctrlKey) {
        setScanSpeed(prev => Math.max(300, prev - 100));
        toast({
          title: "⚡ Scan Speed Increased",
          description: `Now ${scanSpeed - 100}ms per option`,
        });
      } else if (event.code === 'ArrowDown' && event.ctrlKey) {
        setScanSpeed(prev => Math.min(3000, prev + 100));
        toast({
          title: "🐌 Scan Speed Decreased", 
          description: `Now ${scanSpeed + 100}ms per option`,
        });
      }

      // Stop scanning
      if (event.code === 'Escape') {
        setIsScanning(false);
        toast({
          title: "⏹️ Scanning Stopped",
          description: "Press space to restart scanning",
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enabled, handleSwitchPress, scanSpeed, toast]);

  // External switch simulation via gamepad
  useEffect(() => {
    if (!enabled || !navigator.getGamepads) return;

    let lastButtonStates: boolean[] = [];

    const checkGamepad = () => {
      const gamepads = navigator.getGamepads();
      
      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (gamepad) {
          // Check for button presses (any button can act as switch)
          for (let j = 0; j < gamepad.buttons.length; j++) {
            const isPressed = gamepad.buttons[j].pressed;
            const wasPressed = lastButtonStates[j] || false;
            
            if (isPressed && !wasPressed) {
              handleSwitchPress();
            }
            
            lastButtonStates[j] = isPressed;
          }
        }
      }
    };

    const interval = setInterval(checkGamepad, 50); // Check 20 times per second
    return () => clearInterval(interval);
  }, [enabled, handleSwitchPress]);

  return (
    <>
      {enabled && (
        <div className="fixed top-4 right-4 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg z-50">
          <div className="text-sm font-medium">
            Switch Input Active
          </div>
          <div className="text-xs opacity-90">
            {isScanning ? (
              <>Scanning option {currentIndex + 1}{currentIndex >= options ? ' (Activate)' : ''}</>
            ) : (
              'Press switch to start scanning'
            )}
          </div>
          <div className="text-xs opacity-75 mt-1">
            Speed: {scanSpeed}ms | Ctrl+↑↓ to adjust
          </div>
        </div>
      )}
    </>
  );
};