import axios from "axios"

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358"

export const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  c: 50,
  cpp: 54,
  go: 60
}

export async function runJudge0({ code, language, stdin = "" }) {
  const languageId = LANGUAGE_IDS[language]

  if (!languageId) {
    throw new Error("Unsupported language")
  }

  const response = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      source_code: code,
      language_id: languageId,
      stdin
    },
    {
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      }
    }
  )

  return response.data
}