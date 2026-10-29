const axios = require("axios");

function getApiKey() {
  return String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
}

function isGeminiConfigured() {
  const key = getApiKey();
  return Boolean(key) && !/your_api_key|changeme|example/i.test(key);
}

function getModel() {
  return String(process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part.text || "")
    .join("\n")
    .trim();
}

function parseJsonLoose(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        /* continue */
      }
    }
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function generateText(prompt, { temperature = 0.2, maxOutputTokens = 1024 } = {}) {
  if (!isGeminiConfigured()) {
    return { ok: false, reason: "GEMINI_API_KEY not configured" };
  }

  const model = getModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const { data } = await axios.post(
      url,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": getApiKey(),
        },
        timeout: 25000,
      }
    );

    const text = extractText(data);
    if (!text) {
      return { ok: false, reason: "Empty Gemini response" };
    }
    return { ok: true, text, model };
  } catch (err) {
    const detail =
      err.response?.data?.error?.message || err.message || "Gemini request failed";
    console.warn("[gemini]", detail);
    return { ok: false, reason: detail };
  }
}

async function generateJson(prompt, options = {}) {
  const result = await generateText(
    `${prompt}\n\nReturn ONLY valid JSON. No markdown.`,
    options
  );
  if (!result.ok) return result;
  const json = parseJsonLoose(result.text);
  if (!json) {
    return { ok: false, reason: "Gemini did not return valid JSON" };
  }
  return { ok: true, json, model: result.model };
}

module.exports = {
  isGeminiConfigured,
  getModel,
  generateText,
  generateJson,
};
