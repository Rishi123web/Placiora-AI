import express from "express"
import mongoose from "mongoose"

import CodingSession from "../models/CodingSession.js"
import { evaluateCodingAnswerAI } from "../utils/aiEvaluator.js"
import { runPiston } from "../utils/piston.js"
import {
  getProblemList,
  prepareProblemForLanguage,
  CATEGORY_NAMES
} from "../data/codingProblemBank.js"

const router = express.Router()

const normalizeLanguage = (language = "javascript") => {
  const map = {
    JavaScript: "javascript",
    Javascript: "javascript",
    javascript: "javascript",
    Python: "python",
    python: "python",
    Java: "java",
    java: "java",
    C: "c",
    c: "c",
    "C++": "cpp",
    CPP: "cpp",
    Cpp: "cpp",
    cpp: "cpp",
    Go: "go",
    go: "go"
  }

  return map[language] || "javascript"
}

const createHints = ({ language, errorText }) => {
  const safeLanguage = normalizeLanguage(language)
  const text = String(errorText || "").toLowerCase()
  const hints = []

  if (!text.trim()) return hints

  if (
    text.includes("not found") ||
    text.includes("connection refused") ||
    text.includes("econnrefused")
  ) {
    hints.push(
      "Piston server is not reachable. Make sure Docker Piston and ngrok are running."
    )
    hints.push("Check PISTON_URL in Render environment variables.")
  }

  if (
    text.includes("expected") ||
    text.includes("syntax") ||
    text.includes("parse") ||
    text.includes("unexpected")
  ) {
    hints.push("Check brackets, semicolons, quotes, commas and input parsing.")
  }

  if (text.includes("undeclared") || text.includes("cannot find symbol")) {
    hints.push("A variable or function name may be misspelled.")
  }

  if (text.includes("main")) {
    hints.push("Make sure your program has a valid main function/class.")
  }

  if (safeLanguage === "java") {
    hints.push("Java class name must be Main.")
    hints.push("Use: class Main { public static void main(String[] args) { } }")
  }

  if (safeLanguage === "python") {
    hints.push("Check indentation carefully.")
    hints.push("Read input using sys.stdin when solving test-case based problems.")
  }

  if (safeLanguage === "javascript") {
    hints.push("Use console.log(...) to print output.")
    hints.push("Read input using fs.readFileSync(0, 'utf8').")
  }

  if (safeLanguage === "c" || safeLanguage === "cpp") {
    hints.push("Check #include statements and missing semicolons.")
    hints.push("Read input from stdin instead of hardcoding sample values.")
  }

  if (safeLanguage === "go") {
    hints.push("Go code must start with package main.")
    hints.push('Use fmt.Println(...) and import "fmt".')
  }

  return [...new Set(hints)].slice(0, 5)
}

router.get("/categories", (req, res) => {
  res.json({
    success: true,
    categories: ["All", ...CATEGORY_NAMES]
  })
})

router.get("/problem", (req, res) => {
  try {
    const difficulty = req.query.difficulty || "Beginner"
    const category = req.query.category || "All"
    const language = normalizeLanguage(req.query.language || "javascript")

    let list = getProblemList({ difficulty, category })

    if (!list.length && category !== "All") {
      list = getProblemList({ difficulty, category: "All" })
    }

    if (!list.length) {
      list = getProblemList({ difficulty: "Beginner", category: "All" })
    }

    const randomProblem = list[Math.floor(Math.random() * list.length)]

    res.json({
      success: true,
      totalAvailable: list.length,
      problem: prepareProblemForLanguage(randomProblem, language)
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Problem fetch failed",
      error: error.message
    })
  }
})

router.post("/run", async (req, res) => {
  try {
    const { code, stdin = "", input = "" } = req.body
    const language = normalizeLanguage(req.body.language)

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required"
      })
    }

    const result = await runPiston({
      code,
      language,
      stdin: stdin || input || ""
    })

    res.json({
      success: true,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      compile_output: result.compile_output || "",
      message: result.message || "",
      hints:
        result.status?.id === 3
          ? []
          : createHints({
              language,
              errorText:
                result.stderr || result.compile_output || result.message || ""
            }),
      status: result.status || {
        id: 0,
        description: "Unknown"
      },
      time: result.time,
      memory: result.memory
    })
  } catch (error) {
    const errorText =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message

    res.json({
      success: true,
      stdout: "",
      stderr: "",
      compile_output: "",
      message: errorText,
      hints: createHints({
        language: req.body?.language,
        errorText
      }),
      status: {
        id: 13,
        description: "Piston Connection Error"
      }
    })
  }
})

router.post("/submit", async (req, res) => {
  try {
    const { userId, code, problem, testResults, language = "javascript" } =
      req.body

    if (!code || !problem) {
      return res.status(400).json({
        success: false,
        message: "Code and problem are required"
      })
    }

    const safeLanguage = normalizeLanguage(language)
    const safeTestResults = Array.isArray(testResults) ? testResults : []

    const passedTests = safeTestResults.filter((item) => item.passed).length
    const totalTests = safeTestResults.length
    const fallbackScore =
      totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

    let result

    try {
      result = await evaluateCodingAnswerAI({
        problem: {
          ...problem,
          language: safeLanguage
        },
        code,
        testResults: safeTestResults
      })
    } catch (aiError) {
      console.log("AI Evaluation Error:", aiError.message)

      result = {
        score: fallbackScore,
        feedback:
          fallbackScore === 100
            ? "All visible test cases passed. Great job!"
            : `${passedTests}/${totalTests} test cases passed. Check failed cases and avoid hardcoding.`,
        strengths:
          fallbackScore === 100
            ? ["Correct output for visible test cases"]
            : ["Code executed through Piston"],
        weaknesses:
          fallbackScore === 100 ? [] : ["Some visible test cases failed"],
        improvedApproach:
          "Read input from stdin and solve for every test case, not only the sample input."
      }
    }

    const codingSession = await CodingSession.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      title: problem.title || "",
      difficulty: problem.difficulty || "",
      category: problem.category || "",
      description: problem.description || "",
      language: safeLanguage,
      code,
      score: result.score || fallbackScore,
      feedback: result.feedback || "",
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      improvedApproach: result.improvedApproach || "",
      testResults: safeTestResults,
      passedTests,
      totalTests
    })

    res.json({
      success: true,
      result,
      codingSession
    })
  } catch (error) {
    console.log("Submit Error:", error.message)

    res.json({
      success: true,
      result: {
        score: 0,
        feedback: "Code submitted, but saving or AI feedback failed.",
        strengths: [],
        weaknesses: ["Submission fallback used"],
        improvedApproach:
          "Check backend logs and AI API key if AI feedback is required."
      },
      codingSession: null
    })
  }
})

router.get("/history/:userId", async (req, res) => {
  try {
    const sessions = await CodingSession.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      sessions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Coding history failed",
      error: error.message
    })
  }
})

export default router
