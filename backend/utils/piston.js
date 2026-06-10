import axios from "axios"

const PISTON_URL = "https://emkc.org/api/v2/piston/execute"

const RUNTIMES = {
  javascript: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  c: { language: "c", version: "10.2.0" },
  cpp: { language: "c++", version: "10.2.0" },
  go: { language: "go", version: "1.16.2" }
}

export async function runPiston({ code, language, stdin = "" }) {
  const runtime = RUNTIMES[language]

  if (!runtime) {
    throw new Error("Unsupported language")
  }

  const response = await axios.post(
    PISTON_URL,
    {
      language: runtime.language,
      version: runtime.version,
      files: [
        {
          content: code
        }
      ],
      stdin
    },
    {
      timeout: 30000,
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
    message: run.output || compile.output || "",
    status: {
      id: run.code === 0 ? 3 : 6,
      description: run.code === 0 ? "Accepted" : "Runtime/Compile Error"
    },
    time: null,
    memory: null
  }
}