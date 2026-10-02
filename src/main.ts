import { createApp } from 'vue';
import App from './App.vue';
import { watchViewport } from './core/Device';
import './ui/styles/main.css';

watchViewport();
createApp(App).mount('#app');
