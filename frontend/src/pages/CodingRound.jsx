import { useEffect, useState } from "react"
import axios from "axios"
import Editor from "@monaco-editor/react"
import MainLayout from "../layouts/MainLayout.jsx"

import {
  Code2,
  Sparkles,
  RefreshCw,
  Send,
  Trophy,
  AlertCircle,
  Play,
  CheckCircle,
  XCircle,
  Layers,
  Cpu,
  Timer,
  Lightbulb
} from "lucide-react"

import API_BASE from "../config/api"

const API = `${API_BASE}/api/coding`

const LANGUAGES = [
  { label: "JavaScript", value: "javascript", monaco: "javascript" },
  { label: "Python", value: "python", monaco: "python" },
  { label: "Java", value: "java", monaco: "java" },
  { label: "C", value: "c", monaco: "c" },
  { label: "C++", value: "cpp", monaco: "cpp" },
  { label: "Go", value: "go", monaco: "go" }
]

const CATEGORIES = [
  "All",
  "Arrays",
  "Strings",
  "Linked List",
  "Stack",
  "Queue",
  "HashMap",
  "Recursion",
  "Dynamic Programming",
  "Greedy",
  "Graph",
  "Tree",
  "Binary Search",
  "SQL",
  "OOP",
  "Java Collections",
  "Multithreading",
  "DBMS",
  "Operating System",
  "Computer Networks"
]

function CodingRound() {
  const [difficulty, setDifficulty] = useState("Beginner")
  const [language, setLanguage] = useState("javascript")
  const [category, setCategory] = useState("All")
  const [refreshKey, setRefreshKey] = useState(0)

  const [problem, setProblem] = useState(null)
  const [code, setCode] = useState("")
  const [stdin, setStdin] = useState("")
  const [output, setOutput] = useState("")
  const [hints, setHints] = useState([])
  const [result, setResult] = useState(null)
  const [testResults, setTestResults] = useState([])

  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const selectedMonacoLanguage =
    LANGUAGES.find((item) => item.value === language)?.monaco || "javascript"

  useEffect(() => {
    const controller = new AbortController()

    async function fetchQuestion() {
      try {
        setLoading(true)
        setError("")
        setResult(null)
        setOutput("")
        setHints([])
        setTestResults([])

        const response = await axios.get(`${API}/problem`, {
          params: {
            difficulty,
            language,
            category
          },
          signal: controller.signal
        })

        const receivedProblem = response.data?.problem || null

        if (!receivedProblem) {
          setProblem(null)
          setCode("")
          setError("No problem received from backend.")
          return
        }

        setProblem(receivedProblem)
        setCode(receivedProblem.starterCode || "")
      } catch (err) {
        if (err.name === "CanceledError") return

        setProblem(null)
        setCode("")
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load coding problem."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchQuestion()

    return () => controller.abort()
  }, [difficulty, language, category, refreshKey])

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty("--x", `${e.clientX - rect.left}px`)
    card.style.setProperty("--y", `${e.clientY - rect.top}px`)
  }

  const runCode = async () => {
    if (!code.trim()) {
      setError("Please write code before running.")
      return
    }

    try {
      setRunning(true)
      setError("")
      setResult(null)
      setOutput("")
      setHints([])
      setTestResults([])

      const response = await axios.post(`${API}/run`, {
        code,
        language,
        stdin
      })

      const data = response.data

      const finalOutput =
        data.stdout ||
        data.stderr ||
        data.compile_output ||
        data.message ||
        "No Output"

      const receivedHints = Array.isArray(data.hints) ? data.hints : []

      setOutput(finalOutput)
      setHints(receivedHints)

      setTestResults([
        {
          index: 1,
          input: stdin || "Custom input not provided",
          expectedOutput: problem?.expectedOutput || "Manual Run",
          actualOutput: finalOutput,
          runtimeError: data.stderr || data.compile_output || data.message || "",
          passed:
            problem?.expectedOutput &&
            finalOutput.trim() === String(problem.expectedOutput).trim()
        }
      ])
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Code execution failed."

      const receivedHints = Array.isArray(err.response?.data?.hints)
        ? err.response.data.hints
        : ["Check if your backend server is running on port 5000."]

      setError(message)
      setOutput(message)
      setHints(receivedHints)
    } finally {
      setRunning(false)
    }
  }

  const submitCode = async () => {
    if (!code.trim()) {
      setError("Please write code before submitting.")
      return
    }

    if (!problem) {
      setError("Problem not loaded.")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const userId = user?._id || user?.id || ""

      const response = await axios.post(`${API}/submit`, {
        userId,
        code,
        language,
        problem,
        testResults
      })

      setResult(response.data.result || null)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Code submission failed."
      )
    } finally {
      setSubmitting(false)
    }
  }

  const passedCount = testResults.filter((item) => item.passed).length
  const totalTests = testResults.length

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
        >
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-cyan-500/20 blur-[140px]" />
          <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-purple-600/20 blur-[140px]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-[0_0_45px_rgba(34,211,238,0.35)]">
                <Code2 className="text-white" size={34} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 text-cyan-300 mb-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                  <Sparkles size={16} />
                  <span className="text-sm">
                    Multi-Language AI Coding Round
                  </span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-black text-white text-glow">
                  Coding Round
                </h1>

                <p className="text-slate-400 mt-3 leading-7 max-w-4xl">
                  Practice coding questions with a polished editor, test cases,
                  AI review, local compiler execution and smart correction hints.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon={Layers} label="Level" value={difficulty} />
              <MiniStat
                icon={Cpu}
                label="Language"
                value={language.toUpperCase()}
              />
              <MiniStat icon={Timer} label="Mode" value="Practice" />
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-300 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <section
          onMouseMove={handleMouseMove}
          className="glow-card rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-6 hover:border-cyan-300/30"
        >
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Select Round Setup
              </h2>

              <p className="text-slate-400 mt-1">
                Choose difficulty, language and topic category.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-3 text-white outline-none focus:border-cyan-400"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-3 text-white outline-none focus:border-cyan-400"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-3 text-white outline-none focus:border-cyan-400"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setRefreshKey((prev) => prev + 1)}
                disabled={loading}
                className="glow-button px-5 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-2xl text-white flex items-center justify-center gap-2 disabled:opacity-50 border border-cyan-300/20"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                {loading ? "Loading..." : "New Problem"}
              </button>
            </div>
          </div>
        </section>

        {problem ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-6 hover:border-cyan-300/30"
            >
              <div className="flex flex-wrap gap-3 mb-5">
                <Badge text={problem.category || "Programming"} />
                <Badge text={problem.difficulty || difficulty} tone="purple" />
                <Badge text={language.toUpperCase()} tone="green" />

                {totalTests > 0 && (
                  <Badge
                    text={`${passedCount}/${totalTests} Passed`}
                    tone={passedCount === totalTests ? "green" : "yellow"}
                  />
                )}
              </div>

              <h2 className="text-3xl font-bold text-white mb-5">
                {problem.title || "Coding Problem"}
              </h2>

              <p className="text-slate-300 leading-8 mb-6">
                {problem.description || "Solve the coding problem."}
              </p>

              <h3 className="text-xl font-bold text-white mb-4">Test Cases</h3>

              <div className="space-y-3">
                {(problem.testCases || []).map((testCase, index) => (
                  <div
                    key={index}
                    className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5 hover:border-cyan-400/20 transition-all"
                  >
                    <p className="text-slate-400 text-sm mb-1">Input</p>

                    <code className="text-cyan-300 break-words">
                      {testCase.input}
                    </code>

                    <p className="text-slate-400 text-sm mt-4 mb-1">
                      Expected Output
                    </p>

                    <code className="text-emerald-300 break-words">
                      {testCase.expectedOutput}
                    </code>
                  </div>
                ))}
              </div>

              {testResults.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-xl font-bold text-white">
                    Test Results
                  </h3>

                  {testResults.map((test) => (
                    <div
                      key={test.index}
                      className={`rounded-[1.5rem] border p-5 ${
                        test.passed
                          ? "bg-emerald-500/10 border-emerald-400/20"
                          : "bg-red-500/10 border-red-400/20"
                      }`}
                    >
                      <p
                        className={`font-semibold flex items-center gap-2 ${
                          test.passed ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {test.passed ? (
                          <CheckCircle size={18} />
                        ) : (
                          <XCircle size={18} />
                        )}
                        Test Case {test.index}:{" "}
                        {test.passed ? "Passed" : "Failed"}
                      </p>

                      <p className="text-slate-300 mt-2">
                        Expected: {test.expectedOutput}
                      </p>

                      <p className="text-slate-300">
                        Your Output: {test.actualOutput}
                      </p>

                      {test.runtimeError && (
                        <p className="text-red-300 mt-2">
                          Error: {test.runtimeError}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {hints.length > 0 && (
                <div className="mt-8 rounded-[2rem] border border-yellow-400/20 bg-yellow-500/10 p-5">
                  <div className="flex items-center gap-2 text-yellow-300 mb-3">
                    <Lightbulb size={20} />
                    <h3 className="text-xl font-bold">Correction Hints</h3>
                  </div>

                  <div className="space-y-2">
                    {hints.map((hint, index) => (
                      <p key={index} className="text-yellow-100 leading-7">
                        {index + 1}. {hint}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {result && (
                <div className="relative overflow-hidden mt-8 p-6 rounded-[2rem] bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-cyan-300 mb-4">
                    <Trophy size={22} />
                    <h3 className="text-2xl font-bold">AI Feedback</h3>
                  </div>

                  <h2 className="text-7xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent mb-4">
                    {result.score || 0}%
                  </h2>

                  <p className="text-slate-300 leading-7 mb-5">
                    {result.feedback || "No feedback available."}
                  </p>

                  {result.improvedApproach && (
                    <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-blue-200 leading-7">
                      {result.improvedApproach}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] border border-cyan-400/10 bg-slate-950/80 p-4 hover:border-cyan-300/30 xl:sticky xl:top-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 px-2">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Code Editor
                  </h2>

                  <p className="text-slate-400 text-sm">
                    Local runner enabled for JavaScript, Python, Java, C, C++
                    and Go.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={runCode}
                    disabled={running}
                    className="glow-button px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play size={18} />
                    {running ? "Running..." : "Run"}
                  </button>

                  <button
                    type="button"
                    onClick={submitCode}
                    disabled={submitting}
                    className="glow-button px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send size={18} />
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] overflow-hidden border border-cyan-400/20 bg-slate-950 shadow-[0_0_50px_rgba(34,211,238,0.12)]">
                <Editor
                  height="700px"
                  language={selectedMonacoLanguage}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{
                    fontSize: 15,
                    minimap: { enabled: false },
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false
                  }}
                />
              </div>

              <div className="mt-4 rounded-[2rem] border border-cyan-400/20 bg-slate-950/80 p-4 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
                <p className="text-white font-bold mb-2">Custom Input</p>

                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input here..."
                  className="w-full h-28 resize-none rounded-2xl bg-slate-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />

                <p className="text-white font-bold mt-4 mb-2">Output</p>

                <pre className="min-h-28 max-h-60 overflow-auto rounded-2xl bg-black/50 border border-white/10 px-4 py-3 text-emerald-300 whitespace-pre-wrap">
                  {output || "Run your code to see output here..."}
                </pre>
              </div>
            </section>
          </div>
        ) : (
          <section className="glow-card rounded-[3rem] p-12 text-center border border-cyan-400/10 hover:border-cyan-300/30">
            <Code2 className="mx-auto text-cyan-300 mb-5" size={70} />

            <p className="text-slate-400 text-lg">
              {loading ? "Loading problem..." : "No problem loaded."}
            </p>
          </section>
        )}
      </div>
    </MainLayout>
  )
}

function Badge({ text, tone = "cyan" }) {
  const tones = {
    cyan: "bg-cyan-500/10 border-cyan-400/20 text-cyan-300",
    purple: "bg-purple-500/10 border-purple-400/20 text-purple-300",
    green: "bg-emerald-500/10 border-emerald-400/20 text-emerald-300",
    yellow: "bg-yellow-500/10 border-yellow-400/20 text-yellow-300"
  }

  return (
    <span
      className={`px-4 py-2 rounded-xl border text-sm ${
        tones[tone] || tones.cyan
      }`}
    >
      {text}
    </span>
  )
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 min-w-[120px]">
      <div className="flex items-center gap-2 text-cyan-300 mb-1">
        <Icon size={16} />
        <span className="text-xs">{label}</span>
      </div>

      <p className="text-white font-semibold text-sm truncate">{value}</p>
    </div>
  )
}

export default CodingRound
