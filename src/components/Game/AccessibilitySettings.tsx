import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Mic, 
  MicOff,
  MousePointer,
  Keyboard,
  Settings,
  Type,
  Palette,
  Timer,
  Zap
} from 'lucide-react';

interface AccessibilitySettingsProps {
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
}

export interface AccessibilitySettings {
  audioEnabled: boolean;
  voiceCommands: boolean;
  isHighContrast: boolean;
  fontSize: number;
  animationSpeed: number;
  autoAdvance: boolean;
  autoAdvanceTime: number;
  switchInput: boolean;
  screenReaderMode: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  simplifiedUI: boolean;
  extendedTimeout: boolean;
  vibration: boolean;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Accessibility Settings
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Less' : 'More'} Options
        </Button>
      </div>

      {/* Quick toggles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant={settings.audioEnabled ? "default" : "outline"}
          onClick={() => updateSetting('audioEnabled', !settings.audioEnabled)}
          className="flex items-center gap-2 min-h-touch"
          aria-pressed={settings.audioEnabled}
        >
          {settings.audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          Audio
        </Button>

        <Button
          variant={settings.isHighContrast ? "default" : "outline"}
          onClick={() => updateSetting('isHighContrast', !settings.isHighContrast)}
          className="flex items-center gap-2 min-h-touch"
          aria-pressed={settings.isHighContrast}
        >
          {settings.isHighContrast ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Contrast
        </Button>

        <Button
          variant={settings.voiceCommands ? "default" : "outline"}
          onClick={() => updateSetting('voiceCommands', !settings.voiceCommands)}
          className="flex items-center gap-2 min-h-touch"
          aria-pressed={settings.voiceCommands}
        >
          {settings.voiceCommands ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          Voice
        </Button>

        <Button
          variant={settings.simplifiedUI ? "default" : "outline"}
          onClick={() => updateSetting('simplifiedUI', !settings.simplifiedUI)}
          className="flex items-center gap-2 min-h-touch"
          aria-pressed={settings.simplifiedUI}
        >
          <Type className="h-4 w-4" />
          Simple
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-6 pt-4 border-t">
          {/* Visual Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visual Settings
            </h4>

            <div className="space-y-3">
              <div>
                <Label htmlFor="fontSize">Font Size: {settings.fontSize}%</Label>
                <Slider
                  id="fontSize"
                  min={75}
                  max={200}
                  step={25}
                  value={[settings.fontSize]}
                  onValueChange={([value]) => updateSetting('fontSize', value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="animationSpeed">Animation Speed: {settings.animationSpeed}x</Label>
                <Slider
                  id="animationSpeed"
                  min={0.25}
                  max={2}
                  step={0.25}
                  value={[settings.animationSpeed]}
                  onValueChange={([value]) => updateSetting('animationSpeed', value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="colorBlind">Color Blind Support</Label>
                <select
                  id="colorBlind"
                  value={settings.colorBlindMode}
                  onChange={(e) => updateSetting('colorBlindMode', e.target.value as any)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="none">None</option>
                  <option value="protanopia">Protanopia (Red-blind)</option>
                  <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                  <option value="tritanopia">Tritanopia (Blue-blind)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Motor Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Motor & Input Settings
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="switchInput">Switch Input Support</Label>
                <Switch
                  id="switchInput"
                  checked={settings.switchInput}
                  onCheckedChange={(checked) => updateSetting('switchInput', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="extendedTimeout">Extended Timeouts</Label>
                <Switch
                  id="extendedTimeout"
                  checked={settings.extendedTimeout}
                  onCheckedChange={(checked) => updateSetting('extendedTimeout', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoAdvance">Auto Advance</Label>
                <Switch
                  id="autoAdvance"
                  checked={settings.autoAdvance}
                  onCheckedChange={(checked) => updateSetting('autoAdvance', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="vibration">Vibration Feedback</Label>
                <Switch
                  id="vibration"
                  checked={settings.vibration}
                  onCheckedChange={(checked) => updateSetting('vibration', checked)}
                />
              </div>
            </div>

            {settings.autoAdvance && (
              <div>
                <Label htmlFor="autoAdvanceTime">Auto Advance Time: {settings.autoAdvanceTime}s</Label>
                <Slider
                  id="autoAdvanceTime"
                  min={3}
                  max={30}
                  step={1}
                  value={[settings.autoAdvanceTime]}
                  onValueChange={([value]) => updateSetting('autoAdvanceTime', value)}
                  className="mt-2"
                />
              </div>
            )}
          </div>

          {/* Audio Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Audio Settings
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="screenReader">Screen Reader Mode</Label>
                <Switch
                  id="screenReader"
                  checked={settings.screenReaderMode}
                  onCheckedChange={(checked) => updateSetting('screenReaderMode', checked)}
                />
              </div>
            </div>
          </div>

          {/* Input Controls Help */}
          <div className="space-y-3 text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Available Controls
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Keyboard:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Numbers 1-6: Select pieces</li>
                  <li>• Space/Enter: Activate</li>
                  <li>• Tab: Navigate</li>
                  <li>• R: Repeat target</li>
                  <li>• H: Help</li>
                </ul>
              </div>
              <div>
                <strong>Voice Commands:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• "Select [number]"</li>
                  <li>• "Repeat"</li>
                  <li>• "Help"</li>
                  <li>• "Next level"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};