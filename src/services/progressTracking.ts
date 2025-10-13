interface SessionData {
  date: Date;
  duration: number;
  notesHit: string[];
  accuracy: number;
  rangeLowest: string;
  rangeHighest: string;
  exercisesCompleted: string[];
}

interface StudentProgress {
  studentId: string;
  studentName: string;
  startDate: Date;
  sessions: SessionData[];
  achievements: Achievement[];
  currentRange: { lowest: string; highest: string };
  overallAccuracy: number;
  totalPracticeTime: number;
  currentStreak: number;
  longestStreak: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  icon: string;
}

class ProgressTracker {
  private currentSession: Partial<SessionData> | null = null;
  private sessionStartTime: number = 0;
  private notesAttempted: Map<string, { correct: number; total: number }> = new Map();

  startSession() {
    this.currentSession = {
      date: new Date(),
      notesHit: [],
      accuracy: 0,
      exercisesCompleted: []
    };
    this.sessionStartTime = Date.now();
    this.notesAttempted.clear();
  }

  recordNote(targetNote: string, sungNote: string, isCorrect: boolean) {
    if (!this.currentSession) return;

    const noteKey = targetNote;
    const current = this.notesAttempted.get(noteKey) || { correct: 0, total: 0 };
    current.total++;
    if (isCorrect) {
      current.correct++;
      this.currentSession.notesHit?.push(sungNote);
    }
    this.notesAttempted.set(noteKey, current);

    // Update range
    if (!this.currentSession.rangeLowest || this.compareNotes(sungNote, this.currentSession.rangeLowest) < 0) {
      this.currentSession.rangeLowest = sungNote;
    }
    if (!this.currentSession.rangeHighest || this.compareNotes(sungNote, this.currentSession.rangeHighest) > 0) {
      this.currentSession.rangeHighest = sungNote;
    }
  }

  endSession(): SessionData | null {
    if (!this.currentSession) return null;

    // Calculate overall accuracy
    let totalCorrect = 0;
    let totalAttempts = 0;
    this.notesAttempted.forEach(({ correct, total }) => {
      totalCorrect += correct;
      totalAttempts += total;
    });

    this.currentSession.accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    this.currentSession.duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);

    const completedSession = this.currentSession as SessionData;
    this.currentSession = null;

    // Save to localStorage
    this.saveSession(completedSession);

    return completedSession;
  }

  private saveSession(session: SessionData) {
    const stored = localStorage.getItem('pitchPerfectSessions');
    const sessions = stored ? JSON.parse(stored) : [];
    sessions.push(session);
    localStorage.setItem('pitchPerfectSessions', JSON.stringify(sessions));

    // Check for achievements
    this.checkAchievements(sessions);
  }

  private checkAchievements(sessions: SessionData[]) {
    const achievements: Achievement[] = [];
    const stored = localStorage.getItem('pitchPerfectAchievements');
    const unlockedIds = stored ? JSON.parse(stored) : [];

    // First Session
    if (sessions.length === 1 && !unlockedIds.includes('first_session')) {
      achievements.push({
        id: 'first_session',
        name: 'First Steps',
        description: 'Complete your first practice session',
        unlockedAt: new Date(),
        icon: '🎵'
      });
    }

    // Accuracy Master
    const hasHighAccuracy = sessions.some(s => s.accuracy >= 95);
    if (hasHighAccuracy && !unlockedIds.includes('accuracy_master')) {
      achievements.push({
        id: 'accuracy_master',
        name: 'Pitch Perfect',
        description: 'Achieve 95% accuracy in a session',
        unlockedAt: new Date(),
        icon: '🎯'
      });
    }

    // Week Streak
    const streak = this.calculateStreak(sessions);
    if (streak >= 7 && !unlockedIds.includes('week_warrior')) {
      achievements.push({
        id: 'week_warrior',
        name: 'Week Warrior',
        description: 'Practice 7 days in a row',
        unlockedAt: new Date(),
        icon: '🔥'
      });
    }

    // Save new achievements
    if (achievements.length > 0) {
      achievements.forEach(a => unlockedIds.push(a.id));
      localStorage.setItem('pitchPerfectAchievements', JSON.stringify(unlockedIds));

      // Show achievement notification
      this.showAchievementNotification(achievements[0]);
    }
  }

  private calculateStreak(sessions: SessionData[]): number {
    if (sessions.length === 0) return 0;

    const sortedSessions = [...sessions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedSessions.length - 1; i++) {
      const current = new Date(sortedSessions[i].date);
      const next = new Date(sortedSessions[i + 1].date);
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private showAchievementNotification(achievement: Achievement) {
    // This will be implemented in the UI component
    console.log(`🎉 Achievement Unlocked: ${achievement.name}`);
  }

  getProgressReport(): StudentProgress {
    const stored = localStorage.getItem('pitchPerfectSessions');
    const sessions: SessionData[] = stored ? JSON.parse(stored) : [];

    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgAccuracy = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
      : 0;

    // Find overall range
    let lowestNote = sessions[0]?.rangeLowest || 'C4';
    let highestNote = sessions[0]?.rangeHighest || 'C4';

    sessions.forEach(session => {
      if (session.rangeLowest && this.compareNotes(session.rangeLowest, lowestNote) < 0) {
        lowestNote = session.rangeLowest;
      }
      if (session.rangeHighest && this.compareNotes(session.rangeHighest, highestNote) > 0) {
        highestNote = session.rangeHighest;
      }
    });

    return {
      studentId: 'default',
      studentName: 'Student',
      startDate: sessions[0]?.date || new Date(),
      sessions,
      achievements: this.getAchievements(),
      currentRange: { lowest: lowestNote, highest: highestNote },
      overallAccuracy: avgAccuracy,
      totalPracticeTime: totalTime,
      currentStreak: this.calculateStreak(sessions),
      longestStreak: this.calculateLongestStreak(sessions)
    };
  }

  private calculateLongestStreak(sessions: SessionData[]): number {
    // Implementation for longest streak calculation
    return Math.max(this.calculateStreak(sessions), 0);
  }

  private getAchievements(): Achievement[] {
    const stored = localStorage.getItem('pitchPerfectAchievements');
    const achievementIds = stored ? JSON.parse(stored) : [];

    const allAchievements: Achievement[] = [
      { id: 'first_session', name: 'First Steps', description: 'Complete your first practice session', unlockedAt: new Date(), icon: '🎵' },
      { id: 'accuracy_master', name: 'Pitch Perfect', description: 'Achieve 95% accuracy in a session', unlockedAt: new Date(), icon: '🎯' },
      { id: 'week_warrior', name: 'Week Warrior', description: 'Practice 7 days in a row', unlockedAt: new Date(), icon: '🔥' }
    ];

    return allAchievements.filter(a => achievementIds.includes(a.id));
  }

  private compareNotes(note1: string, note2: string): number {
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const getOctave = (note: string) => parseInt(note.match(/\d+/)?.[0] || '4');
    const getNoteName = (note: string) => note.replace(/\d+/, '');

    const octave1 = getOctave(note1);
    const octave2 = getOctave(note2);

    if (octave1 !== octave2) {
      return octave1 - octave2;
    }

    return noteOrder.indexOf(getNoteName(note1)) - noteOrder.indexOf(getNoteName(note2));
  }
}

export const progressTracker = new ProgressTracker();
export type { SessionData, StudentProgress, Achievement };