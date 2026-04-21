import { create } from 'zustand';

export interface Suggestion {
  id: string;
  icon: string;
  title: string;
  confidence: number;
  description: string;
  status: 'pending' | 'applied' | 'dismissed';
}

export interface ActiveModules {
  smartCut: boolean;
  subtitles: boolean;
  moodSync: boolean;
  eyeContact: boolean;
}

export interface Project {
  name: string;
  rushes: string[];
  duration: number;
}

export interface ShortClip {
  id: string;
  title: string;
  filename: string;
  duration: string;
  viralScore: number;
  hookType: string;
  start?: number;
  end?: number;
}

export interface SeoData {
  title: string;
  description: string;
  tags: string[];
  seoScore: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  currentProject: Project;
  activeModules: ActiveModules;
  aiSuggestions: Suggestion[];
  transcription: string | null;
  shorts: ShortClip[];
  seoData: SeoData | null;
  selectedThumbnail: number;
  toasts: Toast[];
  isAnalyzing: boolean;
  isTranscribing: boolean;
  globalLoading: boolean;
  globalLoadingMessage: string;
  playhead: number;
  isPlaying: boolean;

  setProjectName: (name: string) => void;
  setProjectDuration: (duration: number) => void;
  addRush: (rush: string) => void;
  toggleModule: (key: keyof ActiveModules) => void;
  setAiSuggestions: (suggestions: Suggestion[]) => void;
  applySuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  setTranscription: (text: string | null) => void;
  setShorts: (clips: ShortClip[]) => void;
  setSeoData: (data: SeoData | null) => void;
  setSelectedThumbnail: (idx: number) => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  setIsAnalyzing: (v: boolean) => void;
  setIsTranscribing: (v: boolean) => void;
  setGlobalLoading: (v: boolean, message?: string) => void;
  setPlayhead: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  resetProject: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentProject: { name: 'Nouveau projet', rushes: [], duration: 0 },
  activeModules: { smartCut: false, subtitles: false, moodSync: false, eyeContact: false },
  aiSuggestions: [],
  transcription: null,
  shorts: [],
  seoData: null,
  selectedThumbnail: 0,
  toasts: [],
  isAnalyzing: false,
  isTranscribing: false,
  globalLoading: false,
  globalLoadingMessage: '',
  playhead: 0,
  isPlaying: false,

  setProjectName: (name) => set((s) => ({ currentProject: { ...s.currentProject, name } })),
  setProjectDuration: (duration) => set((s) => ({ currentProject: { ...s.currentProject, duration } })),

  addRush: (rush) =>
    set((s) => ({ currentProject: { ...s.currentProject, rushes: [...s.currentProject.rushes, rush] } })),

  toggleModule: (key) =>
    set((s) => ({ activeModules: { ...s.activeModules, [key]: !s.activeModules[key] } })),

  setAiSuggestions: (suggestions) => set({ aiSuggestions: suggestions }),
  setTranscription: (transcription) => set({ transcription }),
  setShorts: (shorts) => set({ shorts }),
  setSeoData: (seoData) => set({ seoData }),

  applySuggestion: (id) =>
    set((s) => ({
      aiSuggestions: s.aiSuggestions.map((sg) => (sg.id === id ? { ...sg, status: 'applied' } : sg)),
    })),

  dismissSuggestion: (id) =>
    set((s) => ({
      aiSuggestions: s.aiSuggestions.map((sg) => (sg.id === id ? { ...sg, status: 'dismissed' } : sg)),
    })),

  setSelectedThumbnail: (idx) => set({ selectedThumbnail: idx }),

  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4500);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setIsTranscribing: (v) => set({ isTranscribing: v }),
  setGlobalLoading: (v, message = '') => set({ globalLoading: v, globalLoadingMessage: message }),

  setPlayhead: (v) => set({ playhead: v }),
  setIsPlaying: (v) => set({ isPlaying: v }),

  resetProject: () =>
    set({
      currentProject: { name: 'Nouveau projet', rushes: [], duration: 0 },
      transcription: null,
      aiSuggestions: [],
      shorts: [],
      seoData: null,
      activeModules: { smartCut: false, subtitles: false, moodSync: false, eyeContact: false },
    }),
}));
