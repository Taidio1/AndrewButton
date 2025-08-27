import { useState, useMemo } from 'react';
import { Search, Plus, Grid3X3, List, Filter, Menu } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { Sound } from '../types';
import SoundButton from './SoundButton';
import UploadForm from './UploadForm';

export default function SoundGrid() {
  console.log('🎵 SoundGrid component rendered');
  const { sounds, searchSounds, deleteSound } = useAudio();
  console.log('🎵 SoundGrid - useAudio hook result:', { sounds, searchSounds, deleteSound });
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'duration' | 'createdAt'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState<string | null>(null);
  const [showMobileControls, setShowMobileControls] = useState(false);

  // Debug: Log sounds whenever they change
  console.log('🎵 SoundGrid - Current sounds:', sounds);
  console.log('🎵 SoundGrid - Sounds count:', sounds.length);

  // Filter and sort sounds
  const filteredAndSortedSounds = useMemo(() => {
    console.log('🔄 Filtering and sorting sounds...');
    console.log('🔍 Input sounds:', sounds);
    console.log('🔍 Search query:', searchQuery);
    
    let filtered = searchQuery ? searchSounds(searchQuery) : sounds;
    console.log('🔍 After search filter:', filtered);
    
    // Sort sounds
    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    console.log('🔍 Final filtered and sorted:', filtered);
    return filtered;
  }, [sounds, searchQuery, searchSounds, sortBy, sortOrder]);

  // Handle play/pause
  const [currentlyPlaying, setCurrentlyPlaying] = useState<Sound | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePlay = (sound: Sound) => {
    console.log('🎵 Playing sound:', sound);
    
    // Stop currently playing audio
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    try {
      // Create new audio element from Blob URL
      // Since we're storing files as Blob URLs, we need to get the actual audio data
      const audio = new Audio();
      audio.volume = 0.7;
      
      // For now, we'll need to store the actual audio data or file reference
      // This is a temporary solution - we'll create a proper audio player
      console.log('🔊 Creating audio element for:', sound.title);
      
      audio.addEventListener('ended', () => {
        console.log('⏹️ Audio ended:', sound.title);
        setCurrentlyPlaying(null);
        setAudioElement(null);
      });

      audio.addEventListener('error', (e) => {
        console.error('❌ Error playing audio:', sound.title, e);
        setCurrentlyPlaying(null);
        setAudioElement(null);
        setError(`Error playing audio: ${sound.title}`);
      });

      audio.addEventListener('canplaythrough', () => {
        console.log('✅ Audio ready to play:', sound.title);
        audio.play().then(() => {
          console.log('▶️ Audio started playing:', sound.title);
          setCurrentlyPlaying(sound);
          setAudioElement(audio);
        }).catch(error => {
          console.error('❌ Error starting audio:', error);
        });
      });

      // Use the audioUrl from the sound object
      if (sound.audioUrl) {
        audio.src = sound.audioUrl;
        console.log('🔗 Audio source set to:', sound.audioUrl);
        
        // Load audio
        audio.load();
      } else {
        console.error('❌ No audio URL found for sound:', sound.title);
        setError(`No audio URL found for sound: ${sound.title}`);
        return;
      }
      
    } catch (error) {
      console.error('❌ Error in handlePlay:', error);
    }
  };

  const handlePause = () => {
    if (audioElement) {
      audioElement.pause();
      setCurrentlyPlaying(null);
      setAudioElement(null);
    }
  };

  // Handle edit sound
  const handleEdit = (sound: Sound) => {
    // For now, just show an alert - you can implement a proper edit form later
    const newTitle = prompt('Enter new title:', sound.title);
    if (newTitle && newTitle.trim() !== sound.title) {
      // Update sound logic would go here
      console.log('Edit sound:', sound.id, 'New title:', newTitle);
    }
  };

  // Handle delete sound
  const handleDelete = (id: string) => {
    deleteSound(id);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Log before render
  console.log('🎨 Rendering SoundGrid with:', {
    soundsCount: sounds.length,
    filteredCount: filteredAndSortedSounds.length,
    searchQuery,
    viewMode,
    sounds: sounds.map(s => ({ id: s.id, title: s.title, audioUrl: s.audioUrl }))
  });
  
  // Debug: Log filtered sounds after they're computed
  console.log('🎵 SoundGrid - Filtered sounds:', filteredAndSortedSounds.map(s => ({ 
    id: s.id, 
    title: s.title, 
    audioUrl: s.audioUrl,
    fileType: s.fileType 
  })));
  console.log('🎵 SoundGrid - Filtered count:', filteredAndSortedSounds.length);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Header */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sound Grid</h1>
            <p className="text-sm text-gray-600">
              {filteredAndSortedSounds.length} of {sounds.length} sounds
            </p>
          </div>
          <button
            onClick={() => setShowMobileControls(!showMobileControls)}
            className="p-2 bg-primary-600 text-white rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        
        {/* Mobile Controls */}
        {showMobileControls && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Sort and View Controls */}
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'title' | 'duration' | 'createdAt')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="title">Title</option>
                <option value="duration">Duration</option>
                <option value="createdAt">Date</option>
              </select>
              
              <button
                onClick={toggleSortOrder}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
              >
                <Filter className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 py-2 text-sm font-medium ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                List
              </button>
            </div>
            
            {/* Add Sound Button */}
            <button
              onClick={() => setShowUploadForm(true)}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Sound</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sound Grid</h1>
          <p className="text-gray-600 mt-1">
            {filteredAndSortedSounds.length} of {sounds.length} sounds
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            />
          </div>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'title' | 'duration' | 'createdAt')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="title">Sort by Title</option>
            <option value="duration">Sort by Duration</option>
            <option value="createdAt">Sort by Date</option>
          </select>
          
          {/* Sort Order */}
          <button
            onClick={toggleSortOrder}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
          >
            <Filter className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
          </button>
          
          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-white text-gray-600 hover:bg-gray-50' : 'bg-primary-500 text-white'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          {/* Add Sound Button */}
          <button
            onClick={() => setShowUploadForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Sound</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-600">❌</div>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sounds Grid/List */}
      {(() => {
        console.log('🎯 Render condition check:', {
          filteredLength: filteredAndSortedSounds.length,
          soundsLength: sounds.length,
          searchQuery,
          willShowEmpty: filteredAndSortedSounds.length === 0
        });
        
        if (filteredAndSortedSounds.length === 0) {
          return (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-400 mb-4">
                <Grid3X3 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No sounds found' : 'No sounds yet'}
              </h3>
              <p className="text-gray-600 mb-6 px-4">
                {searchQuery 
                  ? `No sounds match "${searchQuery}". Try a different search term.`
                  : 'Get started by adding your first sound from an MP4 video file.'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="btn-primary"
                >
                  Add Your First Sound
                </button>
              )}
            </div>
          );
        } else {
          console.log('🎵 Rendering sound grid with sounds:', filteredAndSortedSounds);
          return (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4' 
                : 'space-y-3'
            }>
              {filteredAndSortedSounds.map((sound) => (
                <SoundButton
                  key={sound.id}
                  sound={sound}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isPlaying={currentlyPlaying?.id === sound.id}
                  onPlay={handlePlay}
                  onPause={handlePause}
                />
              ))}
            </div>
          );
        }
      })()}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <UploadForm onClose={() => setShowUploadForm(false)} />
      )}
    </div>
  );
}
