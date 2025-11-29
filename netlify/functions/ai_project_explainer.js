// netlify/functions/ai-project-explainer.js

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const token = process.env.portfolio_vai;
    if (!token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "portfolio_vai token not set in environment" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { projectId, projectContext, userQuestion } = body;

    if (!projectId || !projectContext) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "projectId and projectContext are required" }),
      };
    }

    // Build a prompt that explains one of your experiences/projects
    const question = userQuestion && userQuestion.trim().length
      ? userQuestion
      : "Explain this experience to a hiring manager or recruiter in 3–4 sentences, focusing on impact and business value.";

    const prompt = `
You are an AI assistant helping explain a candidate's project or work experience on their portfolio site.

Project/Experience ID: ${projectId}

Detailed context:
${projectContext}

Task:
${question}

Constraints:
- Answer in 3–4 sentences.
- Be clear, non-jargony, but still technical enough for a hiring manager.
- Emphasize impact, scale, and technologies where relevant.
`;

    const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 220,
          temperature: 0.4,
        },
      }),
    });

    if (!hfResponse.ok) {
      const text = await hfResponse.text();
      console.error("HF error:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "HF API error", details: text }),
      };
    }

    const data = await hfResponse.json();

    // HF returns an array of generations typically
    const generatedText = Array.isArray(data) && data[0]?.generated_text
      ? data[0].generated_text
      : JSON.stringify(data);

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: generatedText }),
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

