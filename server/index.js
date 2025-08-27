import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Zwiększ limit JSON do 100MB
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Zwiększ limit URL-encoded

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, '../public')));

// Serve sounds directory
app.use('/sounds', express.static(path.join(__dirname, '../public/sounds')));

// Middleware do obsługi dużych plików - usunięty problematyczny Content-Length
app.use((req, res, next) => {
  // Usunięto problematyczny Content-Length header
  next();
});

// Create sounds directory if it doesn't exist
const soundsDir = path.join(__dirname, '../public/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, soundsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and video files are allowed'));
    }
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all sounds
app.get('/api/sounds', (req, res) => {
  try {
    console.log('🎵 GET /api/sounds - Reading sounds directory...');
    console.log('📁 Sounds directory:', soundsDir);
    
    const sounds = [];
    const files = fs.readdirSync(soundsDir);
    
    console.log('📂 All files in directory:', files);
    
    files.forEach(file => {
      // Akceptuj więcej formatów audio
      if (file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a') || file.endsWith('.ogg')) {
        const filePath = path.join(soundsDir, file);
        const stats = fs.statSync(filePath);
        
        const sound = {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          filePath: `/api/sounds/${file}`, // Pełna ścieżka do endpointu
          publicPath: `/sounds/${file}` // Ścieżka do public/sounds
        };
        
        sounds.push(sound);
        console.log('🎵 Sound found:', sound);
      } else {
        console.log('⚠️ Skipping non-audio file:', file);
      }
    });
    
    console.log(`🎵 Total sounds found: ${sounds.length}`);
    console.log('🎵 Returning sounds:', sounds);
    
    res.json(sounds);
  } catch (error) {
    console.error('❌ Error reading sounds directory:', error);
    res.status(500).json({ error: 'Failed to read sounds directory', details: error.message });
  }
});

// Upload audio file
app.post('/api/upload', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Save trimmed audio file
app.post('/api/sounds/save-trimmed', (req, res) => {
  try {
    console.log('📥 Received save-trimmed request');
    console.log('📊 Request body size:', JSON.stringify(req.body).length, 'characters');
    
    const { audioData, filename, title } = req.body;
    
    if (!audioData || !filename) {
      return res.status(400).json({ error: 'Missing audio data or filename' });
    }
    
    console.log('🔍 Audio data type:', typeof audioData);
    console.log('🔍 Audio data length:', audioData.length);
    console.log('🔍 Filename:', filename);
    console.log('🔍 Title:', title);
    
    // Convert base64 to buffer
    const base64Data = audioData.replace(/^data:audio\/wav;base64,/, '');
    console.log('🔍 Base64 data length (after cleanup):', base64Data.length);
    
    const audioBuffer = Buffer.from(base64Data, 'base64');
    console.log('🔍 Buffer size:', audioBuffer.length, 'bytes');
    
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const finalFilename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${uniqueSuffix}.wav`;
    const filePath = path.join(soundsDir, finalFilename);
    
    // Write file to disk
    fs.writeFileSync(filePath, audioBuffer);
    
    console.log(`💾 Saved trimmed audio: ${finalFilename}`);
    console.log(`📁 File path: ${filePath}`);
    console.log(`📊 File size on disk: ${fs.statSync(filePath).size} bytes`);
    
    res.json({
      message: 'Trimmed audio saved successfully',
      filename: finalFilename,
      filePath: `/api/sounds/${finalFilename}`,
      size: audioBuffer.length
    });
    
  } catch (error) {
    console.error('❌ Error saving trimmed audio:', error);
    res.status(500).json({ error: 'Failed to save trimmed audio' });
  }
});

// Serve audio files
app.get('/api/sounds/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(soundsDir, filename);
  
  console.log('🎵 GET /api/sounds/:filename - Request for file:', filename);
  console.log('📁 Full file path:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    return res.status(404).json({ error: 'File not found', filename });
  }
  
  // Set appropriate headers for audio streaming
  const ext = path.extname(filename).toLowerCase();
  let contentType;
  
  switch (ext) {
    case '.wav':
      contentType = 'audio/wav';
      break;
    case '.mp3':
      contentType = 'audio/mpeg';
      break;
    case '.m4a':
      contentType = 'audio/mp4';
      break;
    case '.ogg':
      contentType = 'audio/ogg';
      break;
    default:
      contentType = 'audio/wav'; // Domyślny
  }
  
  console.log('🎵 File extension:', ext);
  console.log('🎵 Content-Type:', contentType);
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache na 1 godzinę
  
  // Stream the file
  const stream = fs.createReadStream(filePath);
  
  stream.on('error', (error) => {
    console.error('❌ Error streaming file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error streaming file' });
    }
  });
  
  stream.on('open', () => {
    console.log('✅ File stream opened successfully');
  });
  
  stream.pipe(res);
  
  console.log('✅ File streaming started');
});

// Delete audio file
app.delete('/api/sounds/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(soundsDir, filename);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
    }
  }
  
  // Handle payload too large errors
  if (error.type === 'entity.too.large') {
    console.error('📊 Payload too large:', {
      expected: error.expected,
      length: error.length,
      limit: error.limit
    });
    return res.status(413).json({ 
      error: 'Payload too large', 
      details: `Request size: ${error.length}, Limit: ${error.limit}` 
    });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Sounds directory: ${soundsDir}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
