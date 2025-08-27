import React, { useState } from 'react';
import { Music, Settings, Download, Upload, Trash2, Menu } from 'lucide-react';
import { useAudio } from './contexts/AudioContext';
import SoundGrid from './components/SoundGrid';
import { cleanupFFmpeg } from './utils/audioUtils';

export default function App() {
  const { sounds, clearSounds } = useAudio();
  const [activeTab, setActiveTab] = useState<'grid' | 'settings'>('grid');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Handle clear all sounds
  const handleClearAll = () => {
    if (window.confirm(`Are you sure you want to delete all ${sounds.length} sounds? This action cannot be undone.`)) {
      clearSounds();
    }
  };

  // Handle export sounds
  const handleExport = () => {
    const dataStr = JSON.stringify(sounds, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `sounds-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Cleanup FFmpeg on unmount
  React.useEffect(() => {
    return () => {
      cleanupFFmpeg();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg">
                <Music className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">AndrewButton</h1>
                <p className="text-xs sm:text-sm text-gray-600">Process MP4 videos to interactive sound buttons</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">AndrewButton</h1>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden sm:flex space-x-1">
              <button
                onClick={() => setActiveTab('grid')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'grid'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Sound Grid
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="sm:hidden border-t border-gray-200 py-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('grid');
                  setShowMobileMenu(false);
                }}
                className={`w-full px-4 py-2 rounded-lg text-left font-medium transition-colors ${
                  activeTab === 'grid'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Sound Grid
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setShowMobileMenu(false);
                }}
                className={`w-full px-4 py-2 rounded-lg text-left font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Settings
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === 'grid' ? (
          <SoundGrid />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Settings Header */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your audio application settings and data</p>
            </div>

            {/* Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Export Sounds */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Download className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Export Sounds</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  Export all your sounds data as a JSON file for backup or transfer.
                </p>
                <button
                  onClick={handleExport}
                  disabled={sounds.length === 0}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Export {sounds.length} Sounds
                </button>
              </div>

              {/* Import Sounds */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Import Sounds</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  Import sounds from a previously exported JSON file.
                </p>
                <button
                  onClick={() => alert('Import functionality coming soon!')}
                  className="btn-secondary w-full text-sm sm:text-base"
                >
                  Import Sounds
                </button>
              </div>

              {/* Clear All Sounds */}
              <div className="card">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Clear All Sounds</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  Permanently delete all sounds and start fresh. This action cannot be undone.
                </p>
                <button
                  onClick={handleClearAll}
                  disabled={sounds.length === 0}
                  className="btn-danger w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Clear All Sounds
                </button>
              </div>

              {/* Application Info */}
              <div className="card md:col-span-2 lg:col-span-3">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Application Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Features</h4>
                    <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <li>• MP4 to MP3 conversion using FFmpeg.js</li>
                      <li>• Audio trimming and editing</li>
                      <li>• Interactive sound button grid</li>
                      <li>• Search and filter functionality</li>
                      <li>• Local storage persistence</li>
                      <li>• Responsive design</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Technical Details</h4>
                    <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <li>• React 18 with TypeScript</li>
                      <li>• Tailwind CSS for styling</li>
                      <li>• FFmpeg.js for audio processing</li>
                      <li>• Local storage for data persistence</li>
                      <li>• Responsive grid layout (2x10 mobile)</li>
                      <li>• Accessibility features included</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
