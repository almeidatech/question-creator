import { create } from 'zustand';

export interface DashboardStats {
  total_questions_attempted: number;
  correct_count: number;
  accuracy_percentage: number;
  streak_days: number;
}

export interface ActivityData {
  date: string;
  questions_answered: number;
}

export interface WeakArea {
  topic: string;
  accuracy: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  activity: ActivityData[];
  weakAreas: WeakArea[];
  loading: boolean;
  error: string | null;
  setStats: (stats: DashboardStats) => void;
  setActivity: (activity: ActivityData[]) => void;
  setWeakAreas: (areas: WeakArea[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  activity: [],
  weakAreas: [],
  loading: false,
  error: null,
  setStats: (stats) => set({ stats }),
  setActivity: (activity) => set({ activity }),
  setWeakAreas: (areas) => set({ weakAreas: areas }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  refreshStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      set({
        stats: data.stats,
        activity: data.activity,
        weakAreas: data.weakAreas,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      set({ loading: false });
    }
  },
}));

