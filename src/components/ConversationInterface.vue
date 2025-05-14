<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import TranslationInterface from './TranslationInterface.vue';

// State for conversation history
const conversations = ref<Array<{
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceAudioUrl: string;
  targetAudioUrl: string;
  translationId: string;
  timestamp: Date;
}>>([]);

// Scroll container reference
const conversationContainer = ref<HTMLElement | null>(null);

// Track current languages
const currentSourceLang = ref('en');
const currentTargetLang = ref('es');

// Reference to translation interface component
const translationInterface = ref<InstanceType<typeof TranslationInterface> | null>(null);

// Function to add a new translation to the conversation
function addTranslation(translation: {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceAudioUrl: string;
  targetAudioUrl: string;
  translationId: string;
}) {
  const newConversation = {
    ...translation,
    timestamp: new Date()
  };
  
  conversations.value.push(newConversation);
  
  // Update current languages
  currentSourceLang.value = translation.sourceLanguage;
  currentTargetLang.value = translation.targetLanguage;
  
  // Scroll to bottom after adding new conversation
  setTimeout(() => {
    scrollToBottom();
    
    // We'll handle the auto-switch in the template with an event listener on the audio element
  }, 100);
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
            {{ item.sourceLanguage }} → {{ item.targetLanguage }}
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
  border-radius: 8px;
  padding: 20px;
  height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.conversation-item.left {
  background-color: #f1f8ff;
  align-self: flex-start;
  margin-right: 15%;
}

.conversation-item.right {
  background-color: #f8f9fa;
  align-self: flex-end;
  margin-left: 15%;
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
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
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
}
</style>