import React, { useState, useEffect } from 'react';
import { GameBoard } from '@/components/Game/GameBoard';
import { AccessibilityPanel } from '@/components/Game/AccessibilityPanel';
import { GameStats } from '@/components/Game/GameStats';

const Index = () => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Handle score changes and track stats
  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
    if (newScore > score) {
      setTotalCorrect(prev => prev + 1);
      setStreak(prev => prev + 1);
    }
  };

  // Apply high contrast mode to document
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.style.setProperty('--background', '0 0% 100%');
      document.documentElement.style.setProperty('--foreground', '0 0% 0%');
      document.documentElement.style.setProperty('--border', '0 0% 0%');
    } else {
      document.documentElement.style.setProperty('--background', '220 15% 97%');
      document.documentElement.style.setProperty('--foreground', '220 25% 15%');
      document.documentElement.style.setProperty('--border', '220 15% 85%');
    }
  }, [isHighContrast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Game Stats */}
        <div className="pt-6">
          <GameStats 
            score={score}
            level={level}
            totalCorrect={totalCorrect}
            streak={streak}
          />
        </div>

        {/* Main Game Board */}
        <GameBoard 
          onScoreChange={handleScoreChange}
          isHighContrast={isHighContrast}
          onToggleContrast={() => setIsHighContrast(!isHighContrast)}
        />

        {/* Accessibility Panel */}
        <AccessibilityPanel 
          audioEnabled={audioEnabled}
          isHighContrast={isHighContrast}
          onToggleAudio={() => setAudioEnabled(!audioEnabled)}
          onToggleContrast={() => setIsHighContrast(!isHighContrast)}
        />
      </div>
    </div>
  );
};

export default Index;
