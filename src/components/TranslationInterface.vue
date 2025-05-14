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
const countdownInterval = ref<number | null>(null);
const remainingSeconds = ref(0);
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

const estimatedCompletionMinutes = computed(() => {
  return Math.ceil(expectedDuration.value / 60);
});

const formattedRemainingTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  
  if (minutes > 1) {
    return `About ${minutes} minutes`;
  } else if (minutes === 1) {
    return `About 1 minute`;
  } else {
    return `Less than a minute`;
  }
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
    remainingSeconds.value = expectedDuration.value;
    recordingStatus.value = 'Uploaded successfully';
    translationStatus.value = `Translation in progress... (${formattedRemainingTime.value} remaining)`;
    
    // Start countdown timer
    startCountdownTimer();
    
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

// Start countdown timer
function startCountdownTimer() {
  // Update the countdown every second
  countdownInterval.value = window.setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
      translationStatus.value = `Translation in progress... (${formattedRemainingTime.value} remaining)`;
    } else {
      // Clear the interval when we reach zero
      if (countdownInterval.value) {
        clearInterval(countdownInterval.value);
        countdownInterval.value = null;
      }
    }
  }, 1000);
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
      // Clear the polling interval
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
      }
      
      // Clear the countdown interval
      if (countdownInterval.value) {
        clearInterval(countdownInterval.value);
        countdownInterval.value = null;
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
  
  // Clear countdown timer
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
  remainingSeconds.value = 0;
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
  gap: 25px;
  height: auto; 
  min-height: 400px;
  flex-direction: row; 
  margin-bottom: 30px;
}

.panel {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.panel h2 {
  text-align: center;
  margin-top: 0;
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
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
  padding: 15px 32px;
  border-radius: 50px;
  border: none;
  background-color: #3498db;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
  font-size: 1rem;
  letter-spacing: 0.5px;
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
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background-color: #2ecc71;
  color: white;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
  font-size: 0.95rem;
  letter-spacing: 0.3px;
  transition: all 0.3s;
}

.translate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(46, 204, 113, 0.5);
}

.translate-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.download-btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background-color: #3498db;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
  font-size: 0.95rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(52, 152, 219, 0.5);
}

.download-btn:before {
  content: "⬇️";
  font-size: 1.1rem;
}

.status, .translation-status {
  text-align: center;
  font-style: italic;
  color: #7f8c8d;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
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