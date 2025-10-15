# Linux Audio Plugin

Linux-specific audio implementation using naudiodon2 for recording, playback, transcription, and text-to-speech.

## Overview

The `@tokenring-ai/linux-audio` package provides a Linux-specific implementation of the AudioProvider interface using the naudiodon2 library for native audio operations. It enables recording, playback, transcription, and text-to-speech capabilities on Linux systems within the Token Ring AI framework.

## Key Features

- **Recording**: Capture audio from microphone using naudiodon2
- **Playback**: Play WAV audio files through system audio
- **Transcription**: Convert audio to text using OpenAI Whisper
- **Text-to-Speech**: Generate speech from text using OpenAI TTS
- **Format Support**: WAV format for recording/playback, MP3 for TTS
- **Native Performance**: Uses naudiodon2 for efficient audio I/O

## Core Components

### LinuxAudioProvider

Concrete implementation of AudioProvider for Linux systems.

**Key Methods:**
- `record(abortSignal, options?)`: Record audio from microphone
  - Returns path to recorded WAV file
  - Supports abort signal for stopping recording
- `transcribe(audioFile, options?)`: Convert audio to text using OpenAI Whisper
  - Supports various audio formats
  - Returns transcription text
- `speak(text, options?)`: Convert text to speech using OpenAI TTS
  - Generates MP3 audio file
  - Returns path to audio file
- `playback(filename, options?)`: Play audio files through system audio
  - Supports WAV format playback
  - Uses naudiodon2 for audio output

## Installation

Requires naudiodon2 native dependencies for Linux audio support:

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt-get install libasound2-dev

# Package is installed as part of Token Ring monorepo
```

## Usage Example

```typescript
import { LinuxAudioProvider } from '@tokenring-ai/linux-audio';
import { AudioService } from '@tokenring-ai/audio';

// Create and register provider
const provider = new LinuxAudioProvider({
  sampleRate: 48000,
  channels: 1,
  format: 'wav'
});

const audioService = new AudioService();
audioService.registerProvider('linux', provider);
audioService.setActiveProvider('linux');

// Record audio
const abortController = new AbortController();
const recording = await audioService.record(abortController.signal);

// Transcribe audio
const transcription = await audioService.transcribe(recording);
console.log('Transcription:', transcription);

// Text-to-speech
const audioFile = await audioService.speak('Hello, world!');

// Playback
await audioService.playback(audioFile);
```

## Configuration Options

- `sampleRate`: Audio sample rate in Hz (default: 48000)
- `channels`: Number of audio channels (default: 1 for mono)
- `format`: Audio format (default: 'wav')
- OpenAI API key required for transcription and TTS (via environment variable)

## Dependencies

- `@tokenring-ai/audio@0.1.0`: Abstract audio framework
- `@tokenring-ai/agent@0.1.0`: Agent integration
- `naudiodon2@^3.2.0`: Native audio I/O for Node.js
- `wav@^1.0.2`: WAV file format support
- `@openai/openai@^4.0.0`: OpenAI SDK for transcription and TTS

## System Requirements

- Linux operating system
- ALSA audio system (libasound2-dev)
- OpenAI API key for transcription and TTS features
