// Fetches all modules from the JSON file
export async function fetchAllModules() {
    try {
        const response = await fetch('./data/modules.json');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("Error loading modules:", error);
        return [];
    }
}

// Fetches a single module based on the ID provided in the URL
export async function fetchModuleById(id) {
    const modules = await fetchAllModules();
    // Convert the string ID from the URL to a number to match the JSON data
    return modules.find(module => module.id === parseInt(id));
}
