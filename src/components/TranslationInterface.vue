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
  <div class="flex flex-col max-w-6xl mx-auto gap-5 w-full">
    <!-- Language Controls -->
    <div class="flex justify-center items-center gap-5 mb-5 flex-wrap">
      <div class="flex items-center gap-2">
        <label for="source-language" class="text-deep-purple font-medium">Source:</label>
        <select id="source-language" v-model="sourceLanguage" 
                class="p-2 rounded border border-light-grey focus:border-bright-blue focus:outline-none">
          <option v-for="lang in languageOptions" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
      </div>
      
      <button @click="swapLanguages" 
              class="text-2xl border-none bg-transparent cursor-pointer hover:scale-110 transition-transform">
        ↔️
      </button>
      
      <div class="flex items-center gap-2">
        <label for="target-language" class="text-deep-purple font-medium">Target:</label>
        <select id="target-language" v-model="targetLanguage"
                class="p-2 rounded border border-light-grey focus:border-bright-blue focus:outline-none">
          <option v-for="lang in languageOptions" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Translation Panels -->
    <div class="flex gap-6 min-h-[400px] flex-col md:flex-row mb-8">
      <!-- Source Language Panel -->
      <div class="flex-1 border border-light-grey rounded-xl p-6 flex flex-col shadow-lg bg-pure-white hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
        <h2 class="text-center text-2xl font-semibold text-bright-blue mt-0 pb-4 border-b-2 border-light-grey mb-5">
          {{ sourceLanguageName }}
        </h2>
        
        <div class="flex flex-col flex-grow justify-center items-center gap-5">
          <div class="flex flex-col items-center gap-2 w-full">
            <div class="flex flex-col items-center gap-2">
              <button 
                :class="[
                  'px-8 py-4 rounded-full border-none font-bold cursor-pointer transition-all duration-300 text-base tracking-wider shadow-lg',
                  isRecording 
                    ? 'bg-warm-orange text-white animate-pulse' 
                    : 'bg-bright-blue text-white hover:shadow-xl hover:-translate-y-1'
                ]"
                @click="isRecording ? stopRecording() : startRecording()">
                {{ isRecording ? 'Stop Recording' : 'Start Recording' }}
              </button>
              
              <div v-if="isRecording" class="flex items-center gap-2 text-warm-orange font-medium">
                <span class="inline-block w-2.5 h-2.5 bg-warm-orange rounded-full animate-pulse"></span>
                Recording...
              </div>
            </div>
            <div class="text-center italic text-deep-purple text-sm max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {{ recordingStatus }}
            </div>
          </div>
          
          <audio v-if="sourceAudioUrl" :src="sourceAudioUrl" controls class="w-full"></audio>
          
          <button 
            @click="uploadAndTranslate" 
            :disabled="!audioBlob || isRecording"
            class="px-6 py-3 rounded-lg border-none bg-sky-blue text-white font-bold cursor-pointer shadow-lg text-sm tracking-wide transition-all duration-300 hover:-translate-y-1 hover:shadow-xl disabled:bg-light-grey disabled:cursor-not-allowed disabled:transform-none">
            Translate to {{ targetLanguageName }}
          </button>
        </div>
      </div>
      
      <!-- Target Language Panel -->
      <div class="flex-1 border border-light-grey rounded-xl p-6 flex flex-col shadow-lg bg-pure-white hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
        <h2 class="text-center text-2xl font-semibold text-bright-blue mt-0 pb-4 border-b-2 border-light-grey mb-5">
          {{ targetLanguageName }}
        </h2>
        
        <div class="flex flex-col flex-grow justify-center items-center gap-5">
          <div class="text-center italic text-deep-purple text-sm max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            {{ translationStatus }}
          </div>
          
          <audio v-if="targetAudioUrl" :src="targetAudioUrl" controls autoplay class="w-full"></audio>
          
          <button 
            v-if="targetAudioUrl" 
            @click="downloadTranslatedAudio"
            class="px-6 py-3 rounded-lg border-none bg-bright-blue text-white font-bold cursor-pointer mt-2 shadow-lg text-sm transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-xl">
            <span>⬇️</span>
            Download Audio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

