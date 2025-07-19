import React from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, Target, Zap, Heart } from 'lucide-react';

interface GameStatsProps {
  score: number;
  level: number;
  totalCorrect: number;
  streak: number;
}

export const GameStats: React.FC<GameStatsProps> = ({
  score,
  level,
  totalCorrect,
  streak
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Trophy className="h-6 w-6 text-accent" />
        </div>
        <div className="text-2xl font-bold text-foreground">{score}</div>
        <div className="text-sm text-muted-foreground">Score</div>
      </Card>

      <Card className="p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div className="text-2xl font-bold text-foreground">{level}</div>
        <div className="text-sm text-muted-foreground">Level</div>
      </Card>

      <Card className="p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Heart className="h-6 w-6 text-success" />
        </div>
        <div className="text-2xl font-bold text-foreground">{totalCorrect}</div>
        <div className="text-sm text-muted-foreground">Correct</div>
      </Card>

      <Card className="p-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <Zap className="h-6 w-6 text-warning" />
        </div>
        <div className="text-2xl font-bold text-foreground">{streak}</div>
        <div className="text-sm text-muted-foreground">Streak</div>
      </Card>
    </div>
  );
};