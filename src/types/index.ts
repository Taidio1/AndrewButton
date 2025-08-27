export interface Sound {
  id: string;
  title: string;
  filename?: string; // Opcjonalne - może nie być dostępne dla starych dźwięków
  duration: number;
  fileType: string; // MP4, MP3, etc.
  fileSize: number; // File size in bytes
  audioUrl: string; // URL do odtwarzania dźwięku (może być blob lub ścieżka serwera)
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  previewAudio: string | null; // URL do przyciętego audio do podsłuchania
  isPreviewPlaying: boolean; // Czy preview jest odtwarzane
}

export interface TrimSettings {
  startTime: number;
  endTime: number;
}

export interface UploadFormData {
  file: File | null;
  title: string;
  trimSettings: TrimSettings;
}

export interface AudioContextType {
  sounds: Sound[];
  addSound: (sound: Omit<Sound, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSound: (id: string, updates: Partial<Sound>) => void;
  deleteSound: (id: string) => void;
  getSound: (id: string) => Sound | undefined;
  searchSounds: (query: string) => Sound[];
  clearSounds: () => void;
}

export interface FFmpegInstance {
  load: () => Promise<void>;
  run: (args: string[]) => Promise<void>;
  terminate: () => Promise<void>;
  isLoaded: () => boolean;
}

export interface AudioPlayer {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  seek: (time: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
}
