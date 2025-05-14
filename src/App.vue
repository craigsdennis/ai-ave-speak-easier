<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header>
      <div class="logo-container">
        <img src="@/assets/logo.svg" alt="Logo" class="logo" />
        <h1 class="app-title">Conversational Dubbing</h1>
      </div>
      <div class="description">
        Seamlessly translate your spoken words across languages
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer>
      <div class="footer-text">
        Built with 🧡 using 
        <a href="https://workers.cloudflare.com/" target="_blank" rel="noopener">Cloudflare Workers</a> &amp;&amp; 
        <a href="https://elevenlabs.io/" target="_blank" rel="noopener">ElevenLabs</a> &amp;&amp; 
        <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue</a>
      </div>
      <div class="footer-code">
        <a href="https://github.com/cloudflare/ai-avenue" target="_blank" rel="noopener">👀 the code</a>
      </div>
    </footer>
  </div>
</template>

<style>
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --dark-color: #2c3e50;
  --light-color: #ecf0f1;
  --accent-color: #e74c3c;
  --background-color: #f9f9f9;
  --card-background: #ffffff;
  --border-radius: 8px;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--dark-color);
  background-color: var(--background-color);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: var(--card-background);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  text-align: center;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.logo {
  width: 40px;
  height: 40px;
}

.app-title {
  font-size: 1.8rem;
  color: var(--primary-color);
  margin: 0;
}

.description {
  color: #666;
  font-size: 1rem;
}

main {
  flex: 1;
  padding: 2rem 1rem;
}

footer {
  background-color: var(--dark-color);
  color: var(--light-color);
  text-align: center;
  padding: 1.5rem;
  margin-top: auto;
}

footer a {
  color: var(--light-color);
  text-decoration: none;
  border-bottom: 1px dotted var(--light-color);
  transition: var(--transition);
}

footer a:hover {
  color: #3498db;
  border-bottom-color: #3498db;
}

.footer-text {
  margin-bottom: 0.8rem;
}

.footer-code {
  font-weight: 500;
  font-size: 1.1rem;
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--border-radius);
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: var(--transition);
}

button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .logo-container {
    flex-direction: column;
  }
  
  .app-title {
    font-size: 1.5rem;
  }
  
  .description {
    font-size: 0.9rem;
  }
}
</style>