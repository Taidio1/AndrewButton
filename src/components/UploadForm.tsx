import { useState, useRef, useCallback } from 'react';
import { Upload, Music, Scissors, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { 
  validateFileType, 
  validateFileSize, 
  getAudioDuration,
  formatTime,
  previewTrimmedAudio,
  createTrimmedAudio
} from '../utils/audioUtils';
import { UploadFormData, TrimSettings, AudioProcessingState } from '../types';

interface UploadFormProps {
  onClose: () => void;
}

export default function UploadForm({ onClose }: UploadFormProps) {
  const { addSound } = useAudio();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
    title: '',
    trimSettings: { startTime: 0, endTime: 0 }
  });
  const [processingState, setProcessingState] = useState<AudioProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    error: null,
    previewAudio: null,
    isPreviewPlaying: false
  });
  const [dragActive, setDragActive] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      // Validate file
      if (!validateFileType(file)) {
        throw new Error('Please select a valid MP4 video file');
      }
      if (!validateFileSize(file)) {
        throw new Error('File size must be less than 100MB');
      }

      setFormData(prev => ({ ...prev, file }));
      
      // Get audio duration for trimming
      const duration = await getAudioDuration(file);
      setAudioDuration(duration);
      setFormData(prev => ({
        ...prev,
        trimSettings: { startTime: 0, endTime: duration }
      }));

      // Auto-generate title from filename
      const title = file.name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({ ...prev, title }));
    } catch (error) {
      setProcessingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process file'
      }));
    }
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.title.trim()) {
      setProcessingState(prev => ({
        ...prev,
        error: 'Please select a file and enter a title'
      }));
      return;
    }

    try {
      // Clean up preview audio if exists
      if (processingState.previewAudio) {
        URL.revokeObjectURL(processingState.previewAudio);
      }
      
      // Clean up sessionStorage
      sessionStorage.removeItem('audio-preview');

      setProcessingState({
        isProcessing: true,
        progress: 0,
        currentStep: 'Processing audio file...',
        error: null,
        previewAudio: null,
        isPreviewPlaying: false
      });

      // Step 1: Create trimmed audio
      setProcessingState(prev => ({
        ...prev,
        progress: 50,
        currentStep: 'Trimming audio...'
      }));
      
      // Create trimmed audio using Web Audio API
      const trimmedAudioBlob = await createTrimmedAudio(formData.file, formData.trimSettings);
      
      // Calculate final duration
      const finalDuration = formData.trimSettings.endTime - formData.trimSettings.startTime;
      
      setProcessingState(prev => ({
        ...prev,
        progress: 75,
        currentStep: 'Creating sound...'
      }));
      
      // Convert blob to base64 for server upload
      const reader = new FileReader();
      
      reader.onerror = () => {
        console.error('❌ FileReader error');
        setProcessingState(prev => ({
          ...prev,
          error: 'Failed to read audio file',
          isProcessing: false
        }));
      };
      
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Save trimmed audio to server
          const response = await fetch('/api/sounds/save-trimmed', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audioData: base64Data,
              filename: `${formData.title.trim()}_trimmed.wav`,
              title: formData.title.trim()
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
          }
          
          const result = await response.json();
          console.log('✅ Audio saved to server:', result);
          
          // Add sound with server file info
          addSound({
            title: formData.title.trim(),
            filename: result.filename, // Server filename
            duration: finalDuration,
            fileType: 'audio/wav', // Trimmed audio is WAV
            fileSize: result.size, // Server file size
            audioUrl: result.filePath // Server file path
          });
          
          console.log('🎵 Sound added to context with:', {
            title: formData.title.trim(),
            filename: result.filename,
            duration: finalDuration,
            audioUrl: result.filePath
          });
          
          // Success - close form
          setTimeout(() => {
            onClose();
          }, 1500);
          
        } catch (error) {
          console.error('❌ Error saving to server:', error);
          setProcessingState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Failed to save audio to server',
            isProcessing: false
          }));
        }
      };
      
      reader.readAsDataURL(trimmedAudioBlob);

      setProcessingState(prev => ({
        ...prev,
        progress: 100,
        currentStep: 'Creating sound...'
      }));

    } catch (error) {
      setProcessingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process audio'
      }));
    }
  };

  // Handle trim settings change
  const handleTrimChange = (field: keyof TrimSettings, value: number) => {
    setFormData(prev => ({
      ...prev,
      trimSettings: {
        ...prev.trimSettings,
        [field]: Math.max(0, Math.min(audioDuration, value))
      }
    }));
  };

  // Preview trimmed audio
  const handlePreview = async () => {
    if (!formData.file || !formData.title.trim()) {
      setProcessingState(prev => ({
        ...prev,
        error: 'Please select a file and enter a title first'
      }));
      return;
    }

    try {
      setProcessingState(prev => ({
        ...prev,
        currentStep: 'Creating preview...',
        error: null
      }));

      // Create preview directly from file (no FFmpeg conversion needed)
      const previewUrl = await previewTrimmedAudio(formData.file, formData.trimSettings);
      
      setProcessingState(prev => ({
        ...prev,
        previewAudio: previewUrl,
        currentStep: 'Preview ready! Click play to listen.'
      }));

    } catch (error) {
      setProcessingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create preview'
      }));
    }
  };

  // Play preview audio
  const handlePlayPreview = () => {
    if (processingState.previewAudio) {
      const audio = new Audio(processingState.previewAudio);
      
      // Get trim info from sessionStorage
      const previewDataStr = sessionStorage.getItem('audio-preview');
      if (previewDataStr) {
        try {
          const previewData = JSON.parse(previewDataStr);
          
          // Set start time to trim start
          audio.currentTime = previewData.startTime;
          
          // Add event listener to stop at trim end
          const timeUpdateHandler = () => {
            if (audio.currentTime >= previewData.endTime) {
              audio.pause();
              audio.currentTime = previewData.startTime;
              setProcessingState(prev => ({ ...prev, isPreviewPlaying: false }));
              audio.removeEventListener('timeupdate', timeUpdateHandler);
            }
          };
          
          audio.addEventListener('timeupdate', timeUpdateHandler);
        } catch (error) {
          console.error('Error parsing preview data:', error);
        }
      }
      
      audio.addEventListener('ended', () => {
        setProcessingState(prev => ({ ...prev, isPreviewPlaying: false }));
      });
      
      audio.addEventListener('play', () => {
        setProcessingState(prev => ({ ...prev, isPreviewPlaying: true }));
      });
      
      audio.play();
    }
  };

  // Stop preview audio
  const handleStopPreview = () => {
    setProcessingState(prev => ({ ...prev, isPreviewPlaying: false }));
  };

  // Reset form
  const resetForm = () => {
    // Clean up preview audio URL
    if (processingState.previewAudio) {
      URL.revokeObjectURL(processingState.previewAudio);
    }
    
    // Clean up sessionStorage
    sessionStorage.removeItem('audio-preview');
    
    setFormData({
      file: null,
      title: '',
      trimSettings: { startTime: 0, endTime: 0 }
    });
    setProcessingState({
      isProcessing: false,
      progress: 0,
      currentStep: '',
      error: null,
      previewAudio: null,
      isPreviewPlaying: false
    });
    setAudioDuration(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add New Sound</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close form"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File (MP4)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : formData.file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {formData.file ? (
                <div className="space-y-2">
                  <CheckCircle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
                  <p className="text-sm text-gray-600">{formData.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drag and drop your MP4 file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-600 hover:text-primary-500 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum file size: 100MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Sound Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="Enter a title for your sound"
              required
            />
          </div>

          {/* Audio Trimming */}
          {formData.file && audioDuration > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Scissors className="h-5 w-5 text-gray-600" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Trim Audio</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={audioDuration}
                    step="0.1"
                    value={formData.trimSettings.startTime}
                    onChange={(e) => handleTrimChange('startTime', parseFloat(e.target.value))}
                    className="w-full touch-manipulation"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {formatTime(formData.trimSettings.startTime)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={audioDuration}
                    step="0.1"
                    value={formData.trimSettings.endTime}
                    onChange={(e) => handleTrimChange('endTime', parseFloat(e.target.value))}
                    className="w-full touch-manipulation"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {formatTime(formData.trimSettings.endTime)}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Duration: {formatTime(formData.trimSettings.endTime - formData.trimSettings.startTime)}
                </p>
              </div>

              {/* Preview Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={processingState.isProcessing}
                  className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 flex-1 sm:flex-none"
                >
                  <Music className="h-4 w-4" />
                  <span>Create Preview</span>
                </button>

                {processingState.previewAudio && (
                  <>
                    <button
                      type="button"
                      onClick={handlePlayPreview}
                      disabled={processingState.isPreviewPlaying}
                      className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 flex-1 sm:flex-none"
                    >
                      <Music className="h-4 w-4" />
                      <span>{processingState.isPreviewPlaying ? 'Playing...' : 'Play Preview'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStopPreview}
                      className="btn-secondary flex items-center justify-center space-x-2 flex-1 sm:flex-none"
                    >
                      <X className="h-4 w-4" />
                      <span>Stop</span>
                    </button>
                  </>
                )}
              </div>

              {processingState.previewAudio && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✅ Preview ready! Listen to the trimmed audio before saving.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Processing State */}
          {processingState.isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Music className="h-5 w-5 text-primary-600 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">
                  {processingState.currentStep}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingState.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {processingState.error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{processingState.error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary flex-1 sm:flex-none"
              disabled={processingState.isProcessing}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 sm:flex-none"
              disabled={processingState.isProcessing || !formData.file || !formData.title.trim()}
            >
              {processingState.isProcessing ? 'Processing...' : 'Create Sound'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
