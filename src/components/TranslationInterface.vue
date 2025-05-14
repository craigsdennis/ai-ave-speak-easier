<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Define component emits
const emit = defineEmits(['translation-complete']);

// Define exposed functions
defineExpose({
  swapLanguages
});

// State management
const audioBlob = ref<Blob | null>(null);
const isRecording = ref(false);
const recordingStatus = ref('');
const translationId = ref('');
const translationStatus = ref('');
const expectedDuration = ref(0);
const pollingInterval = ref<number | null>(null);
const sourceLanguage = ref('en');
const targetLanguage = ref('es');
const sourceAudioUrl = ref('');
const targetAudioUrl = ref('');
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedChunks = ref<BlobPart[]>([]);

// Language options based on ElevenLabs supported languages
const languageOptions = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'cs', name: 'Czech' },
  { code: 'cy', name: 'Welsh' },
  { code: 'da', name: 'Danish' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'es', name: 'Spanish' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'ms', name: 'Malay' },
  { code: 'nl', name: 'Dutch' },
  { code: 'no', name: 'Norwegian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'zh', name: 'Chinese' }
];

// Computed properties
const sourceLanguageName = computed(() => {
  return languageOptions.find(lang => lang.code === sourceLanguage.value)?.name || '';
});

const targetLanguageName = computed(() => {
  return languageOptions.find(lang => lang.code === targetLanguage.value)?.name || '';
});

// Watch for language changes and reset state
watch(sourceLanguage, () => {
  resetRecordingState();
});

watch(targetLanguage, () => {
  resetRecordingState();
});

// Start recording audio
async function startRecording() {
  try {
    recordingStatus.value = 'Requesting microphone access...';
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    recordedChunks.value = [];
    mediaRecorder.value = new MediaRecorder(stream);
    
    mediaRecorder.value.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.value.push(e.data);
      }
    };
    
    mediaRecorder.value.onstop = async () => {
      const audioData = new Blob(recordedChunks.value, { type: 'audio/webm' });
      audioBlob.value = audioData;
      sourceAudioUrl.value = URL.createObjectURL(audioData);
      recordingStatus.value = 'Recording stopped. Ready to translate.';
    };
    
    mediaRecorder.value.start();
    isRecording.value = true;
    recordingStatus.value = 'Recording...';
  } catch (error) {
    console.error('Error accessing microphone:', error);
    recordingStatus.value = 'Error: Could not access microphone';
  }
}

// Stop recording audio
function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    // Stop all tracks from the stream
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop());
    isRecording.value = false;
  }
}

// Upload audio and start translation
async function uploadAndTranslate() {
  if (!audioBlob.value) {
    recordingStatus.value = 'No audio recorded';
    return;
  }
  
  recordingStatus.value = 'Uploading audio...';
  
  const formData = new FormData();
  formData.append('audio', audioBlob.value);
  formData.append('source_lang', sourceLanguage.value);
  formData.append('target_lang', targetLanguage.value);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    translationId.value = data.dubbing_id;
    expectedDuration.value = data.expected_duration_sec || 10;
    recordingStatus.value = 'Uploaded successfully';
    translationStatus.value = 'Translation in progress...';
    
    // Start polling after expected duration
    setTimeout(() => {
      startPolling();
    }, expectedDuration.value * 1000);
    
  } catch (error) {
    console.error('Error uploading audio:', error);
    recordingStatus.value = `Error: ${error}`;
  }
}

// Start polling for translation status
function startPolling() {
  translationStatus.value = 'Checking translation status...';
  // Poll every 3 seconds
  pollingInterval.value = window.setInterval(checkTranslationStatus, 3000);
}

// Check translation status
async function checkTranslationStatus() {
  if (!translationId.value) return;
  
  try {
    const response = await fetch(`/api/translations/${translationId.value}/status`);
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }
    
    const data = await response.json();
    translationStatus.value = `Status: ${data.status}`;
    
    if (data.status === 'done' || data.status === 'dubbed') {
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
      }
      loadTranslatedAudio();
    }
  } catch (error) {
    console.error('Error checking translation status:', error);
    translationStatus.value = `Error: ${error}`;
  }
}

// Load the translated audio when ready
async function loadTranslatedAudio() {
  translationStatus.value = 'Loading translated audio...';
  
  try {
    // Create an audio URL from the streaming endpoint with target language
    targetAudioUrl.value = `/api/translations/${translationId.value}/audio?target_lang=${targetLanguage.value}`;
    translationStatus.value = 'Translation complete';
    
    // Emit event with translation data for conversation history
    emit('translation-complete', {
      id: Date.now().toString(),
      sourceLanguage: sourceLanguage.value,
      targetLanguage: targetLanguage.value,
      sourceAudioUrl: sourceAudioUrl.value,
      targetAudioUrl: targetAudioUrl.value,
      translationId: translationId.value
    });
    
    // We'll let the template handle autoplay with the autoplay attribute
  } catch (error) {
    console.error('Error loading translated audio:', error);
    translationStatus.value = `Error: ${error}`;
  }
}

// Download translated audio as MP3 file
async function downloadTranslatedAudio() {
  if (!translationId.value) return;
  
  try {
    const downloadUrl = `/api/translations/${translationId.value}/download?target_lang=${targetLanguage.value}`;
    
    // Fetch the file first to ensure we're getting the proper content
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a blob URL for the audio file
    const audioBlob = new Blob([blob], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `translated_audio_${targetLanguage.value}.mp3`;
    
    // Append to body, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    setTimeout(() => {
      URL.revokeObjectURL(audioUrl);
    }, 100);
    
  } catch (error) {
    console.error('Error downloading audio:', error);
    translationStatus.value = `Download error: ${error}`;
  }
}

// Swap source and target languages
function swapLanguages() {
  // Clear any existing recordings and translations
  resetRecordingState();
  
  // Swap the languages
  const temp = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = temp;
  
  return { sourceLanguage: sourceLanguage.value, targetLanguage: targetLanguage.value };
}

// Reset recording and translation state
function resetRecordingState() {
  // Stop recording if active
  if (isRecording.value) {
    stopRecording();
  }
  
  // Clear recording data
  audioBlob.value = null;
  recordedChunks.value = [];
  sourceAudioUrl.value = '';
  recordingStatus.value = '';
  
  // Clear translation data
  translationId.value = '';
  translationStatus.value = '';
  targetAudioUrl.value = '';
  
  // Clear any polling
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
}
</script>

<template>
  <div class="translation-container">
    <div class="language-controls">
      <div class="language-selector">
        <label for="source-language">Source:</label>
        <select id="source-language" v-model="sourceLanguage">
          <option v-for="lang in languageOptions" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
      </div>
      
      <button class="swap-btn" @click="swapLanguages">↔️</button>
      
      <div class="language-selector">
        <label for="target-language">Target:</label>
        <select id="target-language" v-model="targetLanguage">
          <option v-for="lang in languageOptions" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="translation-panels">
      <!-- Source Language Panel -->
      <div class="panel source-panel">
        <h2>{{ sourceLanguageName }}</h2>
        
        <div class="panel-content">
          <div class="recording-controls">
            <div class="record-button-container">
              <button 
                :class="['record-btn', isRecording ? 'recording' : '']" 
                @click="isRecording ? stopRecording() : startRecording()">
                {{ isRecording ? 'Stop Recording' : 'Start Recording' }}
              </button>
              <div v-if="isRecording" class="recording-indicator">
                <span class="recording-dot"></span>
                Recording...
              </div>
            </div>
            <div class="status">{{ recordingStatus }}</div>
          </div>
          
          <audio v-if="sourceAudioUrl" :src="sourceAudioUrl" controls></audio>
          
          <button 
            class="translate-btn" 
            @click="uploadAndTranslate" 
            :disabled="!audioBlob || isRecording">
            Translate to {{ targetLanguageName }}
          </button>
        </div>
      </div>
      
      <!-- Target Language Panel -->
      <div class="panel target-panel">
        <h2>{{ targetLanguageName }}</h2>
        
        <div class="panel-content">
          <div class="translation-status">{{ translationStatus }}</div>
          
          <audio v-if="targetAudioUrl" :src="targetAudioUrl" controls autoplay></audio>
          
          <button 
            v-if="targetAudioUrl" 
            class="download-btn"
            @click="downloadTranslatedAudio">
            Download Audio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.translation-container {
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  gap: 20px;
  width: 100%;
}

.language-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap; /* Allows wrapping on small screens */
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.language-selector select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.swap-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.translation-panels {
  display: flex;
  gap: 20px;
  height: auto; /* Changed from fixed height to auto */
  min-height: 400px;
  flex-direction: row; /* Explicit row for large screens */
}

.panel {
  flex: 1;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.panel h2 {
  text-align: center;
  margin-top: 0;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.panel-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.recording-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.record-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.record-btn {
  padding: 15px 30px;
  border-radius: 50px;
  border: none;
  background-color: #3498db;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.record-btn.recording {
  background-color: #e74c3c;
  animation: pulse 1.5s infinite;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e74c3c;
  font-weight: 500;
}

.recording-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  background-color: #e74c3c;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}

.translate-btn {
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  background-color: #2ecc71;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.translate-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.download-btn {
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  background-color: #3498db;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}

.status, .translation-status {
  text-align: center;
  font-style: italic;
  color: #7f8c8d;
}

audio {
  width: 100%;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .translation-panels {
    flex-direction: column;
  }
  
  .panel {
    width: 100%;
  }
  
  .language-controls {
    padding: 0 10px;
  }
}

</style>