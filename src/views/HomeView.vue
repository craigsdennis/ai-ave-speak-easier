<script setup lang="ts">
import ConversationInterface from '../components/ConversationInterface.vue'
</script>

<template>
  <div class="home-container">
    <ConversationInterface />
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .home-container {
    padding: 0 10px;
  }
}
</style>
