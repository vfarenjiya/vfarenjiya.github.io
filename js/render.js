export async function renderStudyModule(moduleData) {
    // If the URL has an invalid ID, show an error message
    if (!moduleData) {
        document.getElementById('module-title').innerText = "Module Not Found";
        document.getElementById('module-content').innerText = "Please return to the home page.";
        return;
    }

    // Inject the main title and text
    document.getElementById('module-title').innerText = moduleData.title;
    document.getElementById('module-content').innerText = moduleData.content;

    // Clear the "Loading..." text and inject the practice problems
    const problemsList = document.getElementById('problems-list');
    problemsList.innerHTML = ''; 
    
    moduleData.problems.forEach(problem => {
        const li = document.createElement('li');
        li.innerText = problem;
        problemsList.appendChild(li);
    });

    // Force MathJax to process the new math strings we just added to the page
    if (window.MathJax) {
        try {
            await window.MathJax.typesetPromise();
        } catch (err) {
            console.error("MathJax rendering failed: ", err);
        }
    }
}
