import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sound, AudioContextType } from '../types';

// Action types
type AudioAction =
  | { type: 'ADD_SOUND'; payload: Omit<Sound, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_SOUND'; payload: { id: string; updates: Partial<Sound> } }
  | { type: 'DELETE_SOUND'; payload: string }
  | { type: 'SET_SOUNDS'; payload: Sound[] }
  | { type: 'CLEAR_SOUNDS' };

// Initial state
const initialState: Sound[] = [];

// Reducer function
function audioReducer(state: Sound[], action: AudioAction): Sound[] {
  // Log action type and payload if present
  if ('payload' in action) {
    console.log('🔄 Reducer action:', action.type, action.payload);
  } else {
    console.log('🔄 Reducer action:', action.type);
  }
  console.log('📊 Current state:', state);
  
  switch (action.type) {
    case 'ADD_SOUND':
      const newSound: Sound = {
        ...action.payload,
        id: uuidv4(),
        fileType: action.payload.fileType || 'audio/mpeg',
        fileSize: action.payload.fileSize || 0,
        audioUrl: action.payload.audioUrl || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('🎵 New sound created:', newSound);
      const newState = [...state, newSound];
      console.log('📊 New state:', newState);
      console.log('📊 Total sounds in state:', newState.length);
      return newState;

    case 'UPDATE_SOUND':
      return state.map(sound =>
        sound.id === action.payload.id
          ? { ...sound, ...action.payload.updates, updatedAt: new Date() }
          : sound
      );

    case 'DELETE_SOUND':
      // Clean up Blob URL before deleting (only if it's a blob URL)
      const soundToDelete = state.find(sound => sound.id === action.payload);
      if (soundToDelete && soundToDelete.audioUrl && soundToDelete.audioUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(soundToDelete.audioUrl);
          console.log('🧹 Cleaned up Blob URL for deleted sound');
        } catch (error) {
          console.error('❌ Error cleaning up Blob URL:', error);
        }
      }
      return state.filter(sound => sound.id !== action.payload);

         case 'SET_SOUNDS':
       console.log('📥 Setting sounds from payload:', action.payload);
       console.log('📊 Payload length:', action.payload.length);
       console.log('📊 Payload type:', typeof action.payload);
       console.log('📊 Is array:', Array.isArray(action.payload));
       return action.payload;

    case 'CLEAR_SOUNDS':
      // Clean up all Blob URLs before clearing (only blob URLs)
      state.forEach(sound => {
        if (sound.audioUrl && sound.audioUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(sound.audioUrl);
          } catch (error) {
            console.error('❌ Error cleaning up Blob URL:', error);
          }
        }
      });
      console.log('🧹 Cleaned up all Blob URLs');
      return [];

    default:
      return state;
  }
}

// Create context
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Provider component
export function AudioProvider({ children }: { children: ReactNode }) {
  const [sounds, dispatch] = useReducer(audioReducer, initialState);

  // Load sounds from localStorage on mount
  useEffect(() => {
    console.log('🎯 AudioContext useEffect triggered');
    console.log('🎯 Current sounds state:', sounds);
    
    const loadSounds = async () => {
      try {
        console.log('🔄 Loading sounds from localStorage...');
        const savedSounds = localStorage.getItem('audio-sounds');
        console.log('📦 Saved sounds data:', savedSounds);
        
        // Najpierw spróbuj załadować dźwięki z serwera
        try {
          console.log('🔄 Syncing with server...');
          const response = await fetch('/api/sounds');
          console.log('📡 Response status:', response.status);
          console.log('📡 Response ok:', response.ok);
          
          if (response.ok) {
            const serverSounds = await response.json();
            console.log('📡 Server sounds:', serverSounds);
            console.log('📡 Server sounds length:', serverSounds.length);
            
            if (serverSounds.length > 0) {
              console.log('🆕 Server has sounds - converting to Sound format');
              
              // Konwertuj dźwięki z serwera na format Sound
              const soundsFromServer = serverSounds.map((serverSound: any) => {
                console.log('🔄 Converting server sound:', serverSound);
                const converted = {
                  id: uuidv4(), // Generuj nowe ID
                  title: serverSound.filename.replace(/\.[^/.]+$/, ''), // Usuń rozszerzenie
                  filename: serverSound.filename,
                  duration: 0, // Domyślna wartość - można dodać później
                  audioUrl: serverSound.filePath, // Użyj filePath z serwera
                  fileType: serverSound.filename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
                  fileSize: serverSound.size,
                  createdAt: new Date(serverSound.createdAt),
                  updatedAt: new Date(serverSound.modifiedAt),
                };
                console.log('✅ Converted sound:', converted);
                return converted;
              });
              
              console.log('🎵 Converted server sounds:', soundsFromServer);
              
              // Zapisz do localStorage i dispatch
              console.log('💾 Saving to localStorage...');
              localStorage.setItem('audio-sounds', JSON.stringify(soundsFromServer));
              console.log('📤 Dispatching SET_SOUNDS...');
              dispatch({ type: 'SET_SOUNDS', payload: soundsFromServer });
              console.log('✅ Dispatch completed');
              return; // Zakończ tutaj - nie ładuj z localStorage
            }
          } else {
            console.error('❌ Server response not ok:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('❌ Error syncing with server:', error);
        }
        
        // Jeśli serwer nie ma dźwięków lub wystąpił błąd, spróbuj localStorage
        if (savedSounds) {
          const parsedSounds = JSON.parse(savedSounds);
          console.log('✅ Parsed sounds from localStorage:', parsedSounds);
          
          // Sprawdź czy dźwięki mają prawidłowe ścieżki
          const validSounds = parsedSounds.filter((sound: any) => {
            // Akceptuj zarówno blob URLs jak i ścieżki serwera
            if (sound.audioUrl && (
              sound.audioUrl.startsWith('blob:') || 
              sound.audioUrl.startsWith('/api/sounds/') ||
              sound.audioUrl.startsWith('http')
            )) {
              console.log('✅ Valid audio path:', sound.audioUrl);
              return true;
            } else {
              console.log('❌ Invalid audio path:', sound.audioUrl);
              return false;
            }
          });
          
          const soundsWithDates = validSounds.map((sound: any) => ({
            ...sound,
            createdAt: new Date(sound.createdAt),
            updatedAt: new Date(sound.updatedAt),
          }));
          
          console.log('🎵 Valid sounds with dates:', soundsWithDates);
          dispatch({ type: 'SET_SOUNDS', payload: soundsWithDates });
        } else {
          console.log('📭 No saved sounds found in localStorage');
        }
        
      } catch (error) {
        console.error('❌ Error loading sounds from localStorage:', error);
      }
      
      console.log('🎯 loadSounds function completed');
      console.log('🎯 Final sounds state:', sounds);
    };
    
    console.log('🎯 Starting loadSounds...');
    loadSounds();
  }, []);

  // Save sounds to localStorage whenever sounds change
  useEffect(() => {
    try {
      console.log('💾 Saving sounds to localStorage:', sounds);
      localStorage.setItem('audio-sounds', JSON.stringify(sounds));
      console.log('✅ Sounds saved successfully');
    } catch (error) {
      console.error('❌ Error saving sounds to localStorage:', error);
    }
  }, [sounds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 AudioContext cleanup - revoking blob URLs');
      sounds.forEach(sound => {
        if (sound.audioUrl && sound.audioUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(sound.audioUrl);
          } catch (error) {
            console.error('❌ Error cleaning up Blob URL:', error);
          }
        }
      });
    };
  }, [sounds]);

  // Context value
  const value: AudioContextType = {
    sounds,
    addSound: (sound) => {
      console.log('➕ Adding sound:', sound);
      dispatch({ type: 'ADD_SOUND', payload: sound });
    },
    updateSound: (id, updates) => {
      console.log('✏️ Updating sound:', id, updates);
      dispatch({ type: 'UPDATE_SOUND', payload: { id, updates } });
    },
    deleteSound: (id) => {
      console.log('🗑️ Deleting sound:', id);
      dispatch({ type: 'DELETE_SOUND', payload: id });
    },
    getSound: (id) => sounds.find(sound => sound.id === id),
    searchSounds: (query) => {
      const lowercaseQuery = query.toLowerCase();
      return sounds.filter(sound =>
        sound.title.toLowerCase().includes(lowercaseQuery)
      );
    },
    clearSounds: () => {
      console.log('🧹 Clearing all sounds');
      dispatch({ type: 'CLEAR_SOUNDS' });
    },
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

// Custom hook to use the audio context
export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
