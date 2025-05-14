<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import TranslationInterface from './TranslationInterface.vue';

// Language mapping from codes to full names
const languageMap = {
  en: 'English',
  ar: 'Arabic',
  bg: 'Bulgarian',
  ca: 'Catalan',
  cs: 'Czech',
  cy: 'Welsh',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  es: 'Spanish',
  et: 'Estonian',
  fi: 'Finnish',
  fr: 'French',
  he: 'Hebrew',
  hi: 'Hindi',
  hu: 'Hungarian',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  lt: 'Lithuanian',
  lv: 'Latvian',
  ms: 'Malay',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sk: 'Slovak',
  sl: 'Slovenian',
  sv: 'Swedish',
  sw: 'Swahili',
  th: 'Thai',
  tr: 'Turkish',
  uk: 'Ukrainian',
  vi: 'Vietnamese',
  zh: 'Chinese'
};

// State for conversation history
const conversations = ref<Array<{
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceAudioUrl: string;
  targetAudioUrl: string;
  translationId: string;
  timestamp: Date;
  sourceTranscript?: string;
  targetTranscript?: string;
}>>([]);

// Scroll container reference
const conversationContainer = ref<HTMLElement | null>(null);

// Track current languages
const currentSourceLang = ref('en');
const currentTargetLang = ref('es');

// Reference to translation interface component
const translationInterface = ref<InstanceType<typeof TranslationInterface> | null>(null);

// Function to add a new translation to the conversation
async function addTranslation(translation: {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceAudioUrl: string;
  targetAudioUrl: string;
  translationId: string;
}) {
  // Create a new conversation object with timestamp
  const newConversation = {
    ...translation,
    timestamp: new Date()
  };
  
  // Add to conversations before fetching transcripts to show content immediately
  conversations.value.push(newConversation);
  
  // Update current languages
  currentSourceLang.value = translation.sourceLanguage;
  currentTargetLang.value = translation.targetLanguage;
  
  // Scroll to bottom after adding new conversation
  setTimeout(() => {
    scrollToBottom();
  }, 100);
  
  // Fetch target transcript in the background
  try {
    // Only fetch target transcript since source transcript may not be available
    const targetResponse = await fetch(
      `/api/translations/${translation.translationId}/transcript?language=target&target_lang=${translation.targetLanguage}&format=srt`
    );
    
    if (targetResponse.ok) {
      const targetTranscript = await targetResponse.text();
      // Find the conversation and update it with target transcript
      const convo = conversations.value.find(c => c.id === translation.id);
      if (convo) {
        convo.targetTranscript = targetTranscript;
      }
    }
  } catch (error) {
    console.error("Error fetching transcript:", error);
  }
}

// Function to scroll the conversation container to the bottom
function scrollToBottom() {
  if (conversationContainer.value) {
    conversationContainer.value.scrollTop = conversationContainer.value.scrollHeight;
  }
}


// Initial scroll to bottom on mount
onMounted(() => {
  scrollToBottom();
});

// Format SRT transcript for display
function formatTranscript(srtContent: string): string {
  if (!srtContent) return '';
  
  // Extract only the text content from SRT format
  // SRT format: sequence number, timestamp, text content, blank line
  const lines = srtContent.split('\n');
  const textLines: string[] = [];
  
  // Skip sequence numbers and timestamps, keep text content
  for (let i = 0; i < lines.length; i++) {
    // Skip sequence numbers
    if (/^\d+$/.test(lines[i].trim())) {
      continue;
    }
    
    // Skip timestamp lines (contain --> format)
    if (lines[i].includes('-->')) {
      continue;
    }
    
    // Skip empty lines
    if (lines[i].trim() === '') {
      continue;
    }
    
    // Keep actual text content
    textLines.push(lines[i].trim());
  }
  
  // Join text lines with spaces to form a coherent paragraph
  return textLines.join(' ');
}

// Get language full name from language code
function getLanguageName(langCode: string): string {
  return languageMap[langCode as keyof typeof languageMap] || langCode;
}
</script>

<template>
  <div class="conversation-wrapper">
    <!-- Main translation interface -->
    <TranslationInterface ref="translationInterface" @translation-complete="addTranslation" />
    
    
    <!-- Conversation history -->
    <div class="conversation-container" ref="conversationContainer">
      <div v-if="conversations.length === 0" class="empty-state">
        Your conversation will appear here
      </div>
      
      <div v-for="(item, index) in conversations" :key="item.id" :class="['conversation-item', index % 2 === 0 ? 'left' : 'right']">
        <div class="conversation-header">
          <div class="language-badge">
            {{ getLanguageName(item.sourceLanguage) }} → {{ getLanguageName(item.targetLanguage) }}
          </div>
          <div class="timestamp">
            {{ new Date(item.timestamp).toLocaleTimeString() }}
          </div>
        </div>
        
        <div class="audio-players">
          <div class="source-audio">
            <div class="audio-label">Original</div>
            <audio :src="item.sourceAudioUrl" controls></audio>
          </div>
          
          <div class="target-audio">
            <div class="audio-label">Translated</div>
            <audio 
              :src="item.targetAudioUrl" 
              controls
            ></audio>
          </div>
        </div>
        
        <div v-if="item.targetTranscript" class="transcript-container">
          <div class="transcript target-transcript">
            <div class="transcript-header">Transcript</div>
            <div class="transcript-content">{{ formatTranscript(item.targetTranscript) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  gap: 20px;
  height: 100%;
}


.conversation-container {
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 25px;
  height: 450px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: #fcfcfc;
  margin-bottom: 20px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-style: italic;
}

.conversation-item {
  padding: 18px;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 80%;
}

.conversation-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.12);
}

.conversation-item.left {
  background-color: #f0f7ff;
  align-self: flex-start;
  border-left: 4px solid var(--primary-color);
}

.conversation-item.right {
  background-color: #f8f9fa;
  align-self: flex-end;
  border-right: 4px solid var(--secondary-color);
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.language-badge {
  background-color: #3498db;
  color: white;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timestamp {
  font-size: 0.8rem;
  color: #777;
}

.audio-players {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.source-audio, .target-audio {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.audio-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #555;
}

audio {
  width: 100%;
}

.transcript-container {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transcript {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 10px;
  border-left: 3px solid #3498db;
}

.target-transcript {
  border-left-color: #2ecc71;
}

.transcript-header {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 6px;
  color: #555;
}

.transcript-content {
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  color: #333;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .conversation-item.left,
  .conversation-item.right {
    margin-left: 0;
    margin-right: 0;
    width: 100%;
  }
  
  .conversation-container {
    height: 350px;
  }
  
  .transcript-container {
    margin-top: 10px;
  }
}
</style>