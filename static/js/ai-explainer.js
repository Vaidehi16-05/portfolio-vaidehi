// exampleSite/static/js/ai-explainer.js

async function callAIProjectExplainer(projectId, overrideQuestion) {
    try {
      // Load project context from the static JSON
      const projectsRes = await fetch("/ai_projects.json");
      const projects = await projectsRes.json();
  
      const project = projects[projectId];
      if (!project) {
        throw new Error("Unknown projectId: " + projectId);
      }
  
      const payload = {
        projectId,
        projectContext: project.context,
        userQuestion: overrideQuestion || project.defaultQuestion
      };
  
      const res = await fetch("/.netlify/functions/ai_project_explainer.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
  
      if (!res.ok) {
        const text = await res.text();
        throw new Error("Function error: " + text);
      }
  
      const data = await res.json();
      return data.answer;
    } catch (err) {
      console.error(err);
      return "Sorry, something went wrong while generating this explanation.";
    }
  }
  
  // Attach listeners once DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll("[data-ai-explain-project]");
  
    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const projectId = btn.getAttribute("data-ai-explain-project");
        const outputSelector = btn.getAttribute("data-ai-output-target");
        const outputEl = document.querySelector(outputSelector);
  
        if (!outputEl) return;
  
        outputEl.innerText = "Thinking with AI…";
  
        const answer = await callAIProjectExplainer(projectId);
        outputEl.innerText = answer;
      });
    });
  });
  
