import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Eye, EyeOff, Keyboard, MousePointer } from 'lucide-react';

interface AccessibilityPanelProps {
  audioEnabled: boolean;
  isHighContrast: boolean;
  onToggleAudio: () => void;
  onToggleContrast: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  audioEnabled,
  isHighContrast,
  onToggleAudio,
  onToggleContrast
}) => {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Accessibility Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          variant={audioEnabled ? "default" : "outline"}
          onClick={onToggleAudio}
          className="flex items-center gap-2 min-h-touch justify-start"
          aria-pressed={audioEnabled}
        >
          {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Audio Feedback
        </Button>
        
        <Button
          variant={isHighContrast ? "default" : "outline"}
          onClick={onToggleContrast}
          className="flex items-center gap-2 min-h-touch justify-start"
          aria-pressed={isHighContrast}
        >
          {isHighContrast ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          High Contrast
        </Button>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          Keyboard Controls
        </h4>
        <ul className="space-y-1 ml-6">
          <li>• Numbers 1-6: Select game pieces</li>
          <li>• R: Repeat current target</li>
          <li>• H: Help and current status</li>
          <li>• Tab: Navigate between elements</li>
          <li>• Enter/Space: Activate buttons</li>
        </ul>
        
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <MousePointer className="h-4 w-4" />
          Touch/Mouse Controls
        </h4>
        <ul className="space-y-1 ml-6">
          <li>• Click any game piece to select it</li>
          <li>• All buttons are large for easy tapping</li>
          <li>• Hover effects provide visual feedback</li>
        </ul>
      </div>
    </Card>
  );
};