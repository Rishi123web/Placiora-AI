import axios from "axios"

const PISTON_URL =
  process.env.PISTON_URL || "http://localhost:2000/api/v2/execute"

export const LANGUAGE_CONFIG = {
  javascript: {
    language: "javascript",
    version: "20.11.1"
  },
  python: {
    language: "python",
    version: "3.12.0"
  },
  java: {
    language: "java",
    version: "15.0.2"
  },
  c: {
    language: "c",
    version: "10.2.0"
  },
  cpp: {
    language: "c++",
    version: "10.2.0"
  },
  go: {
    language: "go",
    version: "1.16.2"
  }
}

export async function runPiston({ code, language, stdin = "" }) {
  const config = LANGUAGE_CONFIG[language]

  if (!config) {
    throw new Error(`Unsupported language: ${language}`)
  }

  try {
    const response = await axios.post(
      PISTON_URL,
      {
        language: config.language,
        version: config.version,
        stdin,
        files: [
          {
            name: getFileName(language),
            content: code
          }
        ]
      },
      {
        timeout: 60000,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    const data = response.data
    const run = data.run || {}
    const compile = data.compile || {}

    return {
      stdout: run.stdout || "",
      stderr: run.stderr || "",
      compile_output: compile.stderr || compile.output || "",
      message:
        run.output ||
        compile.output ||
        run.stderr ||
        compile.stderr ||
        "",
      status: {
        id: run.code === 0 ? 3 : 6,
        description:
          run.code === 0 ? "Accepted" : "Runtime/Compile Error"
      },
      raw: data
    }
  } catch (error) {
    console.log("Piston Error:", error.response?.data || error.message)

    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Piston execution failed"
    )
  }
}

function getFileName(language) {
  const files = {
    javascript: "main.js",
    python: "main.py",
    java: "Main.java",
    c: "main.c",
    cpp: "main.cpp",
    go: "main.go"
  }

  return files[language] || "main.txt"
}