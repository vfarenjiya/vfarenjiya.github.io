import { fetchAllModules } from './api.js';
import { registerPWA } from './pwa-register.js';

async function initDashboard() {
    // 1. Start the offline Service Worker
    registerPWA();

    // 2. Get all math modules
    const modules = await fetchAllModules();
    
    // 3. Find the list container in the HTML
    const list = document.getElementById('module-links');
    list.innerHTML = ''; // Clear the "Loading..." text

    // 4. Create a link for each module and append it to the list
    modules.forEach(mod => {
        const li = document.createElement('li');
        // The URL passes the ID so study.html knows what to load
        li.innerHTML = `<a href="study.html?id=${mod.id}">${mod.title}</a>`;
        list.appendChild(li);
    });
}

// Run the function when the script loads
initDashboard();
