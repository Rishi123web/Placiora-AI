import axios from "axios"

const PISTON_URL =
  process.env.PISTON_URL ||
  "http://localhost:2000/api/v2/execute"

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

export async function runPiston({
  code,
  language,
  stdin = ""
}) {
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

        files: [
          {
            content: code
          }
        ],

        stdin
      },
      {
        timeout: 60000,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    const data = response.data

    return {
      stdout: data.run?.stdout || "",
      stderr: data.run?.stderr || "",
      compile_output:
        data.compile?.stderr ||
        data.compile?.output ||
        "",

      message:
        data.run?.stdout ||
        data.run?.stderr ||
        data.compile?.stderr ||
        "",

      status: {
        id: data.run?.code === 0 ? 3 : 6,
        description:
          data.run?.code === 0
            ? "Accepted"
            : "Runtime/Compile Error"
      },

      raw: data
    }
  } catch (error) {
    console.log(
      "Piston Error:",
      error.response?.data || error.message
    )

    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Piston execution failed"
    )
  }
}