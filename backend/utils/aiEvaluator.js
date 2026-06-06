import OpenAI from "openai"

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) return null

  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
  })
}

const extractJSON = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])

    return null
  }
}

export const evaluateInterviewAnswerAI = async ({
  question,
  answer,
  role,
  difficulty,
  company,
  mode,
  jobDescription,
  extractedSkills
}) => {
  const groq = getGroqClient()

  if (!groq) {
    return {
      score: 60,
      feedback: "Good attempt. Add more structure, depth and project examples.",
      strengths: ["Attempted the answer"],
      weaknesses: ["Needs better structure"],
      improvedAnswer:
        "Use STAR format: situation, task, action and result. Add one real project example."
    }
  }

  const prompt = `
You are an expert technical interviewer.

Evaluate this candidate answer.

Role: ${role}
Difficulty: ${difficulty}
Company: ${company}
Mode: ${mode}
JD Skills: ${(extractedSkills || []).join(", ")}
Job Description: ${jobDescription || "N/A"}

Question:
${question}

Candidate Answer:
${answer}

Return ONLY valid JSON:
{
  "score": 0,
  "feedback": "",
  "strengths": [],
  "weaknesses": [],
  "improvedAnswer": ""
}

Rules:
- score must be 0 to 100
- feedback should be short but useful
- improvedAnswer should be a better interview-ready answer
`

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3
  })

  const parsed = extractJSON(response.choices[0].message.content)

  return {
    score: Math.min(100, Math.max(0, Number(parsed?.score) || 60)),
    feedback: parsed?.feedback || "Good attempt. Improve structure and examples.",
    strengths: Array.isArray(parsed?.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed?.weaknesses) ? parsed.weaknesses : [],
    improvedAnswer:
      parsed?.improvedAnswer ||
      "Give a structured answer with a real project example and measurable impact."
  }
}

export const evaluateCodingAnswerAI = async ({
  problem,
  code,
  testResults
}) => {
  const groq = getGroqClient()

  const passedTests = testResults?.filter((test) => test.passed).length || 0
  const totalTests = testResults?.length || 0

  if (!groq) {
    return {
      score: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 60,
      feedback: `Test cases passed: ${passedTests}/${totalTests}. Improve logic and edge cases.`,
      strengths: ["Submitted a solution"],
      weaknesses: ["Needs better edge case handling"],
      improvedApproach:
        "Understand input/output, return the result, handle edge cases and optimize time complexity."
    }
  }

  const prompt = `
You are a senior software engineer reviewing coding interview solutions.

Problem:
${problem?.title}

Description:
${problem?.description}

Candidate Code:
${code}

Test Results:
${JSON.stringify(testResults || [], null, 2)}

Return ONLY valid JSON:
{
  "score": 0,
  "feedback": "",
  "strengths": [],
  "weaknesses": [],
  "improvedApproach": ""
}

Rules:
- score must be 0 to 100
- consider correctness, readability, edge cases and efficiency
`

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3
  })

  const parsed = extractJSON(response.choices[0].message.content)

  return {
    score: Math.min(100, Math.max(0, Number(parsed?.score) || 60)),
    feedback: parsed?.feedback || `Test cases passed: ${passedTests}/${totalTests}.`,
    strengths: Array.isArray(parsed?.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed?.weaknesses) ? parsed.weaknesses : [],
    improvedApproach:
      parsed?.improvedApproach ||
      "Improve correctness, readability, edge cases and time complexity."
  }
}