<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-pure-white">
    <header class="bg-pure-white shadow-lg p-6 text-center">
      <div class="flex items-center justify-center gap-4 mb-2">
        <span class="text-4xl drop-shadow-sm">🗣️</span>
        <h1 class="text-4xl font-semibold text-bright-blue -tracking-wider">Speak Easier</h1>
        <span class="text-4xl drop-shadow-sm">🔊</span>
      </div>
      <div class="text-medium-purple text-lg font-normal max-w-2xl mx-auto mt-2 flex items-center justify-center flex-wrap gap-2">
        <span class="text-xl">📺</span> As seen on the hit show AI Avenue <span class="text-xl">📺</span>
      </div>
    </header>

    <main class="flex-1 p-8">
      <RouterView />
    </main>

    <footer class="bg-deep-purple text-off-white text-center p-6 sticky bottom-0 w-full z-10 shadow-2xl">
      <div class="flex flex-col items-center justify-center gap-2">
        <div class="flex items-center justify-center flex-wrap gap-2">
          Built with 🧡 using 
          <a href="https://developers.cloudflare.com/" target="_blank" rel="noopener" class="text-off-white border-b border-dotted border-off-white hover:text-bright-blue hover:border-bright-blue transition-colors">Cloudflare Workers</a> &amp;&amp; 
          <a href="https://elevenlabs.io/" target="_blank" rel="noopener" class="text-off-white border-b border-dotted border-off-white hover:text-bright-blue hover:border-bright-blue transition-colors">ElevenLabs</a> &amp;&amp; 
          <a href="https://vuejs.org/" target="_blank" rel="noopener" class="text-off-white border-b border-dotted border-off-white hover:text-bright-blue hover:border-bright-blue transition-colors">Vue</a>
        </div>
        <div class="flex items-center justify-center flex-wrap gap-2">
          <a href="https://github.com/craigsdennis/" target="_blank" rel="noopener" class="text-off-white border-b border-dotted border-off-white hover:text-bright-blue hover:border-bright-blue transition-colors">👀 the code</a>
        </div>
      </div>
    </footer>
  </div>
</template>

