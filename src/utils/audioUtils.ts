// Tymczasowo wyłączone FFmpeg - strona będzie działać bez konwersji wideo
// import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile } from '@ffmpeg/util';
import { TrimSettings } from '../types';

// FFmpeg instance - tymczasowo wyłączone
let ffmpeg: any = null;

// Initialize FFmpeg - tymczasowo wyłączone
export async function initFFmpeg(): Promise<void> {
  console.log('FFmpeg temporarily disabled - video conversion not available');
  return;
}

// Convert MP4 to MP3
export async function convertMP4ToMP3(file: File): Promise<ArrayBuffer> {
  if (!ffmpeg || !ffmpeg.loaded) {
    await initFFmpeg();
  }

  try {
    const inputName = 'input.mp4';
    const outputName = 'output.mp3';

    // Write input file to FFmpeg virtual filesystem
    ffmpeg.FS('writeFile', inputName, new Uint8Array(await file.arrayBuffer()));

    // Run conversion command
    await ffmpeg.run('-i', inputName, '-vn', '-acodec', 'libmp3lame', '-ab', '192k', outputName);

    // Read output file
    const data = ffmpeg.FS('readFile', outputName);

    // Clean up virtual files
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);

    return data.buffer;
  } catch (error) {
    console.error('Error converting MP4 to MP3:', error);
    throw new Error('Failed to convert video to audio');
  }
}

// Trim audio file
export async function trimAudio(audioBuffer: ArrayBuffer, trimSettings: TrimSettings): Promise<ArrayBuffer> {
  if (!ffmpeg || !ffmpeg.loaded) {
    await initFFmpeg();
  }

  try {
    const inputName = 'input.mp3';
    const outputName = 'output.mp3';

    // Write input file to FFmpeg virtual filesystem
    ffmpeg.FS('writeFile', inputName, new Uint8Array(audioBuffer));

    // Calculate duration
    const duration = trimSettings.endTime - trimSettings.startTime;

    // Run trim command
    await ffmpeg.run(
      '-i', inputName,
      '-ss', trimSettings.startTime.toString(),
      '-t', duration.toString(),
      '-acodec', 'copy',
      outputName
    );

    // Read output file
    const data = ffmpeg.FS('readFile', outputName);

    // Clean up virtual files
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);

    return data.buffer;
  } catch (error) {
    console.error('Error trimming audio:', error);
    throw new Error('Failed to trim audio');
  }
}

// Get audio duration
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio file'));
    });

    audio.src = url;
  });
}

// Validate file type
export function validateFileType(file: File): boolean {
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  return allowedTypes.includes(file.type);
}

// Validate file size (max 100MB)
export function validateFileSize(file: File): boolean {
  const maxSize = 100 * 1024 * 1024; // 100MB
  return file.size <= maxSize;
}

// Format time in seconds to MM:SS
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Parse time from MM:SS format to seconds
export function parseTime(timeString: string): number {
  const [minutes, seconds] = timeString.split(':').map(Number);
  return (minutes * 60) + seconds;
}

// Format file size in human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Create blob URL from ArrayBuffer
export function createBlobURL(buffer: ArrayBuffer, mimeType: string): string {
  const blob = new Blob([buffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

// Download file
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Clean up FFmpeg resources
export function cleanupFFmpeg(): void {
  if (ffmpeg) {
    try {
      ffmpeg.terminate();
      ffmpeg = null;
    } catch (error) {
      console.error('Error cleaning up FFmpeg:', error);
    }
  }
}

// Create trimmed audio using Web Audio API
export async function createTrimmedAudio(file: File, trimSettings: TrimSettings): Promise<Blob> {
  try {
    console.log('✂️ Creating trimmed audio...');
    console.log('📁 Input file:', file.name, file.type, file.size);
    console.log('⏰ Trim settings:', trimSettings);
    
    // Validate trim settings
    if (trimSettings.startTime < 0 || trimSettings.endTime <= 0) {
      throw new Error('Invalid trim settings: start time must be >= 0, end time must be > 0');
    }
    
    if (trimSettings.startTime >= trimSettings.endTime) {
      throw new Error('Invalid trim settings: start time must be less than end time');
    }
    
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('🎵 Audio context created, sample rate:', audioContext.sampleRate);
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('📦 File read as ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // Decode audio data with timeout
    const audioBuffer = await Promise.race([
      audioContext.decodeAudioData(arrayBuffer),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Audio decoding timeout')), 30000)
      )
    ]) as AudioBuffer;
    console.log('🔊 Audio decoded:', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      length: audioBuffer.length
    });
    
    // Calculate trim points in samples
    const startSample = Math.floor(trimSettings.startTime * audioBuffer.sampleRate);
    const endSample = Math.floor(trimSettings.endTime * audioBuffer.sampleRate);
    const length = endSample - startSample;
    
    console.log(`🎵 Trimming from ${trimSettings.startTime}s to ${trimSettings.endTime}s`);
    console.log(`📊 Sample range: ${startSample} to ${endSample} (${length} samples)`);
    
    // Create trimmed buffer
    const trimmedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      length,
      audioBuffer.sampleRate
    );
    
    // Copy trimmed portion for each channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        trimmedData[i] = channelData[startSample + i];
      }
    }
    
    console.log('✂️ Audio data copied to trimmed buffer');
    
    // Convert to WAV blob
    const wavBlob = await audioBufferToWav(trimmedBuffer);
    console.log('💾 WAV blob created, size:', wavBlob.size);
    
    console.log('✅ Trimmed audio created successfully');
    return wavBlob;
    
  } catch (error) {
    console.error('❌ Error creating trimmed audio:', error);
    throw new Error('Failed to create trimmed audio');
  }
}

// Preview trimmed audio (without saving) - simplified version without FFmpeg
export async function previewTrimmedAudio(file: File, trimSettings: TrimSettings): Promise<string> {
  try {
    // Create audio element from file
    const audio = new Audio(URL.createObjectURL(file));
    
    return new Promise((resolve, reject) => {
      audio.addEventListener('loadedmetadata', () => {
        try {
          // Calculate trim points
          const startTime = Math.min(trimSettings.startTime, audio.duration);
          const endTime = Math.min(trimSettings.endTime, audio.duration);
          
          // Create a simple preview by setting audio time
          // This is a simplified preview - just shows the trim range
          const previewUrl = URL.createObjectURL(file);
          
          // Store trim info in the URL for later use
          const previewAudio = new Audio(previewUrl);
          previewAudio.currentTime = startTime;
          
          // Create a custom preview object with trim info
          const previewData = {
            url: previewUrl,
            startTime,
            endTime,
            duration: endTime - startTime
          };
          
          // Store in sessionStorage for the preview player
          sessionStorage.setItem('audio-preview', JSON.stringify(previewData));
          
          resolve(previewUrl);
        } catch (error) {
          reject(error);
        }
      });
      
      audio.addEventListener('error', reject);
    });
  } catch (error) {
    console.error('Error creating preview:', error);
    throw new Error('Failed to create audio preview');
  }
}

// Convert AudioBuffer to WAV Blob
async function audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  // Create WAV file
  const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

// Convert AudioBuffer to Blob (legacy function) - removed as unused
