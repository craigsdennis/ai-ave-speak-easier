# Speak Easier - Conversational Dubbing App

## Overview
This backend wraps ElevenLabs dubbing API. The front-end is a Vue 3 app with TypeScript and Tailwind CSS. The idea is that one person will record some audio and it will translate to the other language. The application is split with one language on one side and one on the other. The result returns `expected_duration_sec` which is used for polling timing.

## Features
- **Real-time Translation**: Record audio in source language, get dubbed audio in target language
- **Conversation History**: Maintains a scrollable conversation history with alternating message layout
- **Mobile Responsive**: Optimized for both desktop and mobile use
- **Language Support**: Full support for ElevenLabs supported languages
- **Transcript Integration**: Displays transcripts for dubbed audio in conversation history
- **Modern UI**: Clean design using official color palette with Tailwind CSS

## Technical Implementation
- **Frontend**: Vue 3 + TypeScript + Tailwind CSS v4
- **Backend**: Cloudflare Workers + Hono
- **Styling**: Official color palette implemented via Tailwind @theme directive
- **Audio**: Native HTML5 audio controls with streaming support
- **Polling**: Smart polling system that waits for expected duration before checking status
- **API Integration**: ElevenLabs dubbing and transcript APIs

## Supported Languages
See the complete list: https://elevenlabs.io/docs/capabilities/dubbing#list-of-supported-languages-for-dubbing

## Recent Updates
- ✅ Migrated to Tailwind CSS v4 for better maintainability
- ✅ Implemented official brand color palette
- ✅ Enhanced conversation interface with better UX
- ✅ Added transcript support using ElevenLabs transcript API
- ✅ Improved mobile responsiveness
- ✅ Added proper two-line footer layout

## Color Palette
**Primary Colors:**
- Deep Purple: #4A3B8C
- Bright Blue: #2E5BFF
- Warm Orange: #FF6B3D
- Soft Pink: #FF9EC7

**Secondary Colors:**
- Medium Purple: #7B68EE
- Sky Blue: #5DADE2
- Peach Orange: #FFB366
- Light Pink: #F8C8DC

**Accent Colors:**
- Golden Yellow: #FFD700
- Pure White: #FFFFFF
- Off White: #F5F5F5
- Light Grey: #E8E8E8 