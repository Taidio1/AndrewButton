/**
 * Mobile Audio Utilities
 * Handles common mobile audio playback issues
 */

// Check if device is mobile
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if device supports touch
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Initialize audio context for mobile devices
export const initializeMobileAudio = (): Promise<AudioContext> => {
  return new Promise((resolve, reject) => {
    try {
      // Create AudioContext with proper fallbacks
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        reject(new Error('Web Audio API not supported'));
        return;
      }

      const audioContext = new AudioContextClass();
      
      // Resume if suspended (common on mobile)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('🎵 Mobile AudioContext resumed successfully');
          resolve(audioContext);
        }).catch(reject);
      } else {
        console.log('🎵 Mobile AudioContext ready');
        resolve(audioContext);
      }
    } catch (error) {
      reject(error);
    }
  });
};

// Handle mobile autoplay policy
export const handleMobileAutoplay = async (audioElement: HTMLAudioElement): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Set mobile-specific attributes
      audioElement.preload = 'auto';
      audioElement.playsInline = true;
      audioElement.muted = false;
      
      // Handle play promise for mobile
      const playPromise = audioElement.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('🎵 Mobile audio started successfully');
          resolve();
        }).catch((error) => {
          console.error('❌ Mobile audio play failed:', error);
          
          // Handle specific mobile errors
          if (error.name === 'NotAllowedError') {
            console.log('🔒 Autoplay blocked - user needs to interact');
            // This is expected on mobile - user needs to tap again
            reject(new Error('AUTOPLAY_BLOCKED'));
          } else {
            reject(error);
          }
        });
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

// Create mobile-friendly audio element
export const createMobileAudioElement = (): HTMLAudioElement => {
  const audio = new Audio();
  
  // Mobile-specific settings
  audio.preload = 'auto';
  audio.playsInline = true;
  audio.muted = false;
  audio.volume = 0.7;
  
  // Add mobile event listeners
  audio.addEventListener('touchstart', () => {
    console.log('👆 Touch on mobile audio element');
  }, { passive: true });
  
  audio.addEventListener('touchend', () => {
    console.log('👆 Touch end on mobile audio element');
  }, { passive: true });
  
  return audio;
};

// Resume audio context if suspended (mobile common issue)
export const resumeAudioContextIfNeeded = async (audioContext: AudioContext): Promise<void> => {
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('🎵 AudioContext resumed for mobile');
    } catch (error) {
      console.error('❌ Failed to resume AudioContext on mobile:', error);
      throw error;
    }
  }
};

// Check mobile audio permissions
export const checkMobileAudioPermissions = async (): Promise<boolean> => {
  try {
    if (typeof navigator.permissions !== 'undefined') {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permission.state === 'granted';
    }
    return true; // Assume granted if permissions API not available
  } catch (error) {
    console.warn('⚠️ Could not check audio permissions:', error);
    return true; // Assume granted
  }
};

// Mobile audio error messages
export const getMobileAudioErrorMessage = (error: any): string => {
  if (error.name === 'NotAllowedError') {
    return 'Audio playback blocked. Please tap the button again to play.';
  } else if (error.name === 'NotSupportedError') {
    return 'Audio format not supported on this device.';
  } else if (error.name === 'NetworkError') {
    return 'Network error loading audio. Please check your connection.';
  } else if (error.name === 'AbortError') {
    return 'Audio playback was interrupted.';
  } else {
    return `Audio error: ${error.message || 'Unknown error'}`;
  }
};
