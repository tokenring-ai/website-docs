---
slug: audio-plugins
title: Audio Plugins - Voice Interaction Support
authors: [mdierolf]
tags: [tokenring, plugins, audio, voice, announcement]
---

# Audio Plugins - Voice Interaction Support

TokenRing Coder now supports voice interaction with audio recording, playback, transcription, and text-to-speech.

<!-- truncate -->

## Audio Plugin

Abstract audio framework defining core capabilities:

### Features
- **Recording**: Capture audio from microphone
- **Playback**: Play audio files through system audio
- **Transcription**: Convert audio to text using AI services
- **Text-to-Speech**: Generate speech from text
- **Provider Architecture**: Abstract interface for platform-specific implementations

### Chat Commands
```bash
/voice record    # Record audio
/voice transcribe audio.wav  # Convert to text
/voice speak "Hello world"   # Generate speech
/voice playback audio.mp3    # Play audio
```

## Linux Audio Plugin

Linux-specific implementation using naudiodon2:

### Features
- **Native Performance**: Uses naudiodon2 for efficient audio I/O
- **OpenAI Integration**: Whisper for transcription, TTS for speech
- **Format Support**: WAV for recording/playback, MP3 for TTS
- **ALSA Support**: Works with Linux audio system

### Usage
```typescript
const provider = new LinuxAudioProvider({
  sampleRate: 48000,
  channels: 1,
  format: 'wav'
});

const audioService = new AudioService();
audioService.registerProvider('linux', provider);

// Record and transcribe
const recording = await audioService.record(abortSignal);
const transcription = await audioService.transcribe(recording);

// Text-to-speech and playback
const audioFile = await audioService.speak('Hello, world!');
await audioService.playback(audioFile);
```

## Use Cases

- Voice commands for hands-free coding
- Transcribe meeting notes and discussions
- Generate audio documentation
- Accessibility features for visually impaired developers

Voice interaction makes AI assistance more natural and accessible.

---

*Mark Dierolf*  
*Creator of TokenRing AI*
