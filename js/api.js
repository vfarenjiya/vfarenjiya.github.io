// Fetches the entire database (subjects and topics) from the JSON file
export async function fetchDatabase() {
    try {
        const response = await fetch('./data/modules.json');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("Error loading database:", error);
        // Return a safe empty structure if the fetch fails
        return { subjects: {}, topics: [] };
    }
}

// Fetches a single topic based on its specific ID (e.g., 's42')
export async function fetchTopicById(id) {
    const db = await fetchDatabase();
    
    // Find the specific topic object
    const topic = db.topics.find(t => t.id === id);
    
    // If found, attach its parent subject metadata (name, color) so the renderer can use it
    if (topic) {
        topic.subjectMeta = db.subjects[topic.s]; 
    }
    
    return topic;
}
