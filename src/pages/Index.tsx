import React, { useState, useEffect } from 'react';
import { EnhancedGameBoard } from '@/components/Game/EnhancedGameBoard';
import { AccessibilitySettings, AccessibilitySettings as AccessibilitySettingsType } from '@/components/Game/AccessibilitySettings';
import { GameStats } from '@/components/Game/GameStats';

const Index = () => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [streak, setStreak] = useState(0);

  // Comprehensive accessibility settings
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettingsType>({
    audioEnabled: true,
    voiceCommands: true, // Enable voice commands by default
    isHighContrast: false,
    fontSize: 100,
    animationSpeed: 1,
    autoAdvance: false,
    autoAdvanceTime: 10,
    switchInput: false,
    screenReaderMode: false,
    colorBlindMode: 'none',
    simplifiedUI: false,
    extendedTimeout: false,
    vibration: true,
  });

  // Handle score changes and track stats
  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
    if (newScore > score) {
      setTotalCorrect(prev => prev + 1);
      setStreak(prev => prev + 1);
    }
  };

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (accessibilitySettings.isHighContrast) {
      root.style.setProperty('--background', '0 0% 100%');
      root.style.setProperty('--foreground', '0 0% 0%');
      root.style.setProperty('--border', '0 0% 0%');
      root.style.setProperty('--card', '0 0% 95%');
    } else {
      root.style.setProperty('--background', '220 15% 97%');
      root.style.setProperty('--foreground', '220 25% 15%');
      root.style.setProperty('--border', '220 15% 85%');
      root.style.setProperty('--card', '0 0% 100%');
    }

    // Apply font size scaling
    root.style.fontSize = `${accessibilitySettings.fontSize}%`;

    // Apply reduced motion if slow animations
    if (accessibilitySettings.animationSpeed < 0.5) {
      root.style.setProperty('--transition-smooth', 'none');
    } else {
      root.style.setProperty('--transition-smooth', `all ${0.3 / accessibilitySettings.animationSpeed}s cubic-bezier(0.4, 0, 0.2, 1)`);
    }
  }, [accessibilitySettings]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('inclusiveplay-settings', JSON.stringify(accessibilitySettings));
  }, [accessibilitySettings]);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('inclusiveplay-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAccessibilitySettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load accessibility settings:', e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Accessibility Settings Panel */}
        <div className="pt-6">
          <AccessibilitySettings 
            settings={accessibilitySettings}
            onSettingsChange={setAccessibilitySettings}
          />
        </div>

        {/* Game Stats */}
        <GameStats 
          score={score}
          level={level}
          totalCorrect={totalCorrect}
          streak={streak}
        />

        {/* Enhanced Game Board with full accessibility */}
        <EnhancedGameBoard 
          onScoreChange={handleScoreChange}
          accessibilitySettings={accessibilitySettings}
          onSettingsChange={setAccessibilitySettings}
        />

        {/* Accessibility Information */}
        {!accessibilitySettings.simplifiedUI && (
          <div className="pb-6 text-center text-sm text-muted-foreground">
            <p className="mb-2">
              InclusivePlay supports players with visual, auditory, motor, and cognitive disabilities
            </p>
            <p>
              🌟 Features: Voice commands • Switch input • High contrast • Screen reader support • 
              Customizable speeds • Color blind support • Vibration feedback
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
