import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Star, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Gamification = () => {
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    // Load streak from localStorage
    const lastVisit = localStorage.getItem('lastVisit');
    const currentStreak = parseInt(localStorage.getItem('streak') || '0');
    const today = new Date().toDateString();

    if (lastVisit === today) {
      setStreak(currentStreak);
    } else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastVisit === yesterday) {
        const newStreak = currentStreak + 1;
        setStreak(newStreak);
        localStorage.setItem('streak', newStreak.toString());
      } else {
        setStreak(1);
        localStorage.setItem('streak', '1');
      }
      localStorage.setItem('lastVisit', today);
    }

    // Check for badges
    const earnedBadges: string[] = [];
    if (currentStreak >= 7) earnedBadges.push('7-Day Champ');
    if (currentStreak >= 30) earnedBadges.push('Monthly Master');
    setBadges(earnedBadges);
  }, []);

  if (streak === 0) return null;

  return (
    <Card className="p-4 shadow-card bg-gradient-to-r from-primary/10 to-secondary/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Streak</p>
            <p className="text-2xl font-bold">{streak} Days 🔥</p>
          </div>
        </div>
        
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="flex items-center">
                <Trophy className="h-3 w-3 mr-1" />
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
