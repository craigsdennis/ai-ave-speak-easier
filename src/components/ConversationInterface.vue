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
  <div class="flex flex-col max-w-6xl mx-auto gap-5 h-full">
    <!-- Main translation interface -->
    <TranslationInterface ref="translationInterface" @translation-complete="addTranslation" />
    
    <!-- Conversation history -->
    <div class="border border-light-grey rounded-xl p-6 h-96 overflow-y-auto flex flex-col gap-5 shadow-lg bg-pure-white mb-5" ref="conversationContainer">
      <div v-if="conversations.length === 0" class="flex justify-center items-center h-full text-medium-purple italic">
        Your conversation will appear here
      </div>
      
      <div v-for="(item, index) in conversations" :key="item.id" 
           :class="[
             'p-4 rounded-xl shadow-md transition-all duration-200 w-4/5 hover:-translate-y-1 hover:shadow-lg',
             index % 2 === 0 
               ? 'bg-off-white self-start border-l-4 border-bright-blue' 
               : 'bg-off-white self-end border-r-4 border-sky-blue'
           ]">
        
        <div class="flex justify-between items-center mb-2">
          <div class="bg-bright-blue text-white px-2 py-1 rounded-full text-sm font-medium shadow-sm">
            {{ getLanguageName(item.sourceLanguage) }} → {{ getLanguageName(item.targetLanguage) }}
          </div>
          <div class="text-xs text-medium-purple">
            {{ new Date(item.timestamp).toLocaleTimeString() }}
          </div>
        </div>
        
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-1">
            <div class="text-xs font-medium text-deep-purple">Original</div>
            <audio :src="item.sourceAudioUrl" controls class="w-full"></audio>
          </div>
          
          <div class="flex flex-col gap-1">
            <div class="text-xs font-medium text-deep-purple">Translated</div>
            <audio :src="item.targetAudioUrl" controls class="w-full"></audio>
          </div>
        </div>
        
        <div v-if="item.targetTranscript" class="mt-3">
          <div class="bg-off-white rounded p-2 border-l-4 border-sky-blue">
            <div class="font-medium text-sm mb-1 text-deep-purple">Transcript</div>
            <div class="text-sm leading-relaxed whitespace-pre-wrap text-deep-purple">
              {{ formatTranscript(item.targetTranscript) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

