import React from 'react';
import { 
  Moon, Film, Smartphone, BookOpen, Briefcase, 
  Activity, Users, Plane, CloudRain, RefreshCcw, Square,
  Coffee, Heart, Zap, Sun, Star, Target, Music, Camera,
  Mic, Mail, MessageSquare, Shield, Anchor, Compass,
  ShoppingCart, Shirt, Clock
} from 'lucide-react';

export type Unit = 'seconds' | 'minutes' | 'hours' | 'days' | 'years' | 'hours/day' | 'minutes/day';

export interface ActivityDef {
  id: string;
  name: string;
  icon: React.ElementType;
  category: string;
  unlockThreshold: number;
  sideEffect?: string;
  isBad?: boolean;
}

export const UNIT_MULTIPLIERS: Record<Unit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  years: 31536000,
  'hours/day': 3600,
  'minutes/day': 60,
};

const createActivities = (category: string, names: string[], icons: React.ElementType[], threshold: number = 0, isBad: boolean = false) => 
  names.map((name, i) => ({
    id: `${category.toLowerCase()}-${i}`,
    name,
    icon: icons[i % icons.length],
    category,
    unlockThreshold: threshold,
    isBad,
    sideEffect: isBad ? "This time could have been used for something meaningful." : undefined
  }));

export const ALL_ACTIVITIES: ActivityDef[] = [
  ...createActivities('Basic', ['Sleeping', 'Eating', 'Showering', 'Commuting', 'Cleaning', 'Cooking'], [Moon, Coffee, CloudRain, Briefcase, Plane, RefreshCcw]),
  ...createActivities('Leisure', ['Watching TV', 'Social Media', 'Gaming', 'Reading Fiction', 'Listening to Music', 'Hobbies'], [Film, Smartphone, Target, BookOpen, Music, Star]),
  ...createActivities('Growth', ['Reading Non-Fiction', 'Learning a Language', 'Meditating', 'Journaling', 'Taking a Course', 'Writing'], [BookOpen, MessageSquare, Heart, Mic, Mail, Music]),
  ...createActivities('Career', ['Working', 'Meetings', 'Emailing', 'Networking', 'Training', 'Presenting'], [Briefcase, Users, Mail, Users, BookOpen, Mic], 50_000_000),
  ...createActivities('Health', ['Running', 'Weightlifting', 'Yoga', 'Swimming', 'Cycling', 'Stretching'], [Activity, Zap, Heart, Anchor, RefreshCcw, Activity], 100_000_000),
  ...createActivities('Relationships', ['Talking', 'Dating', 'Playing', 'Helping', 'Visiting', 'Celebrating'], [Users, Heart, Zap, Shield, Plane, Star], 200_000_000),
  ...createActivities('Regret', ['Doomscrolling', 'Worrying', 'Procrastinating', 'Regretting', 'Complaining', 'Overthinking'], [Smartphone, CloudRain, RefreshCcw, Shield, Mail, MessageSquare], 500_000_000, true),
];
