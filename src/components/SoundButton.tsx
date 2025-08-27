import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Edit3, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Sound } from '../types';
import { formatTime, formatFileSize } from '../utils/audioUtils';

interface SoundButtonProps {
  sound: Sound;
  onEdit: (sound: Sound) => void;
  onDelete: (id: string) => void;
  isPlaying: boolean;
  onPlay: (sound: Sound) => void;
  onPause: () => void;
}

export default function SoundButton({ 
  sound, 
  onEdit, 
  onDelete, 
  isPlaying, 
  onPlay, 
  onPause 
}: SoundButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
        setShowVolumeControl(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle play/pause
  const handlePlayPause = (event: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to avoid double-tap zoom on mobile
    event.preventDefault();
    
    // Add touch-specific handling
    if (event.type === 'touchstart') {
      console.log('👆 Touch event detected on button');
    }
    
    if (isPlaying) {
      onPause();
    } else {
      onPlay(sound);
    }
  };

  // Handle touch events specifically for mobile
  const handleTouchStart = (event: React.TouchEvent) => {
    console.log('👆 Touch start on sound button:', sound.title);
    // Add visual feedback for touch
    event.currentTarget.style.transform = 'scale(0.95)';
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    console.log('👆 Touch end on sound button:', sound.title);
    // Restore normal size
    event.currentTarget.style.transform = 'scale(1)';
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(1);
    } else {
      setIsMuted(true);
      setVolume(0);
    }
  };

  // Handle edit
  const handleEdit = () => {
    setShowMenu(false);
    onEdit(sound);
  };

  // Handle delete
  const handleDelete = () => {
    setShowMenu(false);
    if (window.confirm(`Are you sure you want to delete "${sound.title}"?`)) {
      onDelete(sound.id);
    }
  };

  return (
    <div className="relative group">
      {/* Main Button */}
      <button
        onClick={handlePlayPause}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`
          w-full h-20 sm:h-24 bg-gradient-to-br from-primary-500 to-primary-600 
          hover:from-primary-600 hover:to-primary-700 
          text-white rounded-xl shadow-lg hover:shadow-xl 
          transition-all duration-200 transform hover:scale-105 active:scale-95
          focus:outline-none focus:ring-4 focus:ring-primary-300 
          flex flex-col items-center justify-center space-y-1 sm:space-y-2
          ${isPlaying ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
          touch-manipulation
        `}
        aria-label={`${isPlaying ? 'Pause' : 'Play'} sound: ${sound.title}`}
        title={`${sound.title} (${formatTime(sound.duration)}) - ${sound.fileType} - ${formatFileSize(sound.fileSize)}`}
      >
        {/* Play/Pause Icon */}
        <div className="text-xl sm:text-2xl">
          {isPlaying ? <Pause size={20} className="sm:w-6 sm:h-6" /> : <Play size={20} className="sm:w-6 sm:h-6" />}
        </div>
        
        {/* Title */}
        <div className="text-center px-1 sm:px-2 w-full">
          <p className="text-xs sm:text-sm font-medium leading-tight line-clamp-2">
            {sound.title}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {formatTime(sound.duration)}
          </p>
        </div>
      </button>

      {/* Action Menu Button - Mobile Optimized */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`
          absolute top-1 right-1 sm:top-2 sm:right-2 w-8 h-8 sm:w-6 sm:h-6 bg-white bg-opacity-20 
          hover:bg-opacity-30 rounded-full flex items-center justify-center 
          transition-all duration-200 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
          focus:outline-none focus:ring-2 focus:ring-white touch-manipulation
          sm:opacity-0 sm:group-hover:opacity-100
        `}
        aria-label="More options"
      >
        <span className="text-white text-xs sm:text-xs">⋯</span>
      </button>

      {/* Volume Control Button - Mobile Optimized */}
      <button
        onClick={() => setShowVolumeControl(!showVolumeControl)}
        className={`
          absolute top-1 left-1 sm:top-2 sm:left-2 w-8 h-8 sm:w-6 sm:h-6 bg-white bg-opacity-20 
          hover:bg-opacity-30 rounded-full flex items-center justify-center 
          transition-all duration-200 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
          focus:outline-none focus:ring-2 focus:ring-white touch-manipulation
          sm:opacity-0 sm:group-hover:opacity-100
        `}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={14} className="sm:w-3 sm:h-3" /> : <Volume2 size={14} className="sm:w-3 sm:h-3" />}
      </button>

      {/* Action Menu - Mobile Optimized */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 w-32 sm:w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 mt-1"
        >
          <button
            onClick={handleEdit}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 touch-manipulation"
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 touch-manipulation"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Volume Control - Mobile Optimized */}
      {showVolumeControl && (
        <div
          ref={volumeRef}
          className="absolute top-full left-0 w-32 sm:w-32 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10 mt-1"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Volume</span>
              <button
                onClick={handleMuteToggle}
                className="text-gray-500 hover:text-gray-700 touch-manipulation"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="text-xs text-gray-500 text-center">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
