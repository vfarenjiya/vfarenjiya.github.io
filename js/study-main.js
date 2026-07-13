import { fetchModuleById } from './api.js';
import { renderStudyModule } from './render.js';
import { registerPWA } from './pwa-register.js';

async function initStudyPage() {
    // 1. Start the offline Service Worker
    registerPWA();

    // 2. Grab the URL from the browser
    const urlParams = new URLSearchParams(window.location.search);
    
    // 3. Extract the ID (e.g., ?id=2 grabs the '2')
    const moduleId = urlParams.get('id');

    // 4. Fetch the data for that specific ID
    const moduleData = await fetchModuleById(moduleId);

    // 5. Send the data to the UI renderer (which also triggers MathJax)
    await renderStudyModule(moduleData);
}

// Run the function when the script loads
initStudyPage();
