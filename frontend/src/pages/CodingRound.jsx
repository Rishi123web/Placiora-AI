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
  Lightbulb,
  BookOpen,
  Target,
  ClipboardCheck
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
  const [customRunResult, setCustomRunResult] = useState(null)

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
        setCustomRunResult(null)
        setStdin("")

        const response = await axios.get(`${API}/problem`, {
          params: { difficulty, language, category },
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

  const normalizeOutput = (value) => {
    return String(value || "")
      .replace(/\r/g, "")
      .trim()
  }

  const getRunOutput = (data) => {
    return data.stdout || ""
  }

  const getRunError = (data) => {
    if (data.status?.id === 3 || data.status?.description === "Accepted") {
      return ""
    }

    return data.stderr || data.compile_output || data.message || ""
  }

  const isAccepted = (data) => {
    return data.status?.id === 3 || data.status?.description === "Accepted"
  }

  const detectInputIssue = (inputValue = "") => {
    if (!problem) return ""

    const sampleInput = String(problem.testCases?.[0]?.input || "")
    const custom = String(inputValue || "").trim()

    if (!custom) {
      return "Custom input is empty. Enter input first or click Submit to run official test cases."
    }

    if (sampleInput.startsWith("[") && !custom.startsWith("[")) {
      return "Input may be in wrong format. This problem expects array-style input like [1,2,3]."
    }

    if (sampleInput.includes("|") && !custom.includes("|")) {
      return "Input may be incomplete. This problem expects multiple parts separated by |."
    }

    return ""
  }

  const runOneTest = async ({ input = "", expectedOutput = "" }) => {
    const response = await axios.post(`${API}/run`, {
      code,
      language,
      stdin: input,
      input
    })

    const data = response.data
    const actualOutput = getRunOutput(data)
    const runtimeError = getRunError(data)

    const passed =
      isAccepted(data) &&
      normalizeOutput(actualOutput) === normalizeOutput(expectedOutput)

    return {
      data,
      actualOutput,
      runtimeError,
      passed
    }
  }

  const runCodeAndReturnResults = async () => {
    const tests =
      problem?.testCases?.length > 0
        ? problem.testCases
        : [
            {
              input: "",
              expectedOutput: problem?.expectedOutput || ""
            }
          ]

    const allResults = []
    let collectedHints = []

    for (let i = 0; i < tests.length; i++) {
      const testCase = tests[i]

      const runResult = await runOneTest({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput
      })

      allResults.push({
        index: i + 1,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: runResult.actualOutput || runResult.runtimeError || "",
        runtimeError: runResult.runtimeError,
        passed: runResult.passed
      })

      if (Array.isArray(runResult.data.hints)) {
        collectedHints = [...collectedHints, ...runResult.data.hints]
      }
    }

    return {
      allResults,
      collectedHints: [...new Set(collectedHints)].slice(0, 5)
    }
  }

  const runCode = async () => {
    if (!code.trim()) {
      setError("Please write code before running.")
      return
    }

    if (!stdin.trim()) {
      setError(
        "Enter custom input first, or click Submit to run official test cases."
      )
      setHints([
        "Run is for custom input only.",
        "Submit checks the official visible test cases.",
        "Use the sample input format shown in the problem."
      ])
      return
    }

    try {
      setRunning(true)
      setError("")
      setResult(null)
      setOutput("")
      setHints([])
      setTestResults([])
      setCustomRunResult(null)

      const response = await axios.post(`${API}/run`, {
        code,
        language,
        stdin,
        input: stdin
      })

      const data = response.data
      const actualOutput = getRunOutput(data)
      const runtimeError = getRunError(data)
      const inputIssue = detectInputIssue(stdin)
      const hasError = Boolean(runtimeError)

      const customResult = {
        input: stdin,
        actualOutput: actualOutput || "",
        runtimeError,
        inputIssue,
        passed: !hasError,
        status: hasError ? "Failed" : "Custom Run Passed"
      }

      setCustomRunResult(customResult)

      setOutput(
        "Custom Input:\n" +
          stdin +
          "\n\nYour Output:\n" +
          (normalizeOutput(actualOutput) || "No Output") +
          (inputIssue ? "\n\nInput Format Warning:\n" + inputIssue : "") +
          (runtimeError ? "\n\nError:\n" + runtimeError : "")
      )

      if (hasError) {
        setHints(
          data.hints?.length
            ? data.hints
            : [
                "Check syntax, brackets, indentation and input parsing.",
                "Make sure your code reads input from stdin.",
                "Print only the final answer.",
                "Match the expected input format exactly."
              ]
        )
      } else if (inputIssue) {
        setHints([
          inputIssue,
          "Compare your custom input with the sample test case format.",
          "Your code executed, but the custom input format may not match the problem."
        ])
      } else {
        setHints([
          "Custom input executed successfully.",
          "Your custom run is not judged against official expected output.",
          "Click Submit to verify official visible test cases."
        ])
      }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Custom run failed."

      const receivedHints = Array.isArray(err.response?.data?.hints)
        ? err.response.data.hints
        : [
            "Check if backend, Piston, ngrok and PISTON_URL are working.",
            "Verify all brackets and parentheses are closed.",
            "Ensure input is read from stdin.",
            "Print only the final answer."
          ]

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
      setCustomRunResult(null)

      const runData = await runCodeAndReturnResults()
      const finalTestResults = runData.allResults

      setTestResults(finalTestResults)

      const failed = finalTestResults.some((item) => !item.passed)

      if (failed) {
        setHints(
          runData.collectedHints.length
            ? runData.collectedHints
            : [
                "Read input from stdin instead of hardcoding sample values.",
                "Run your code against every official test case.",
                "Match expected output exactly.",
                "Check edge cases and formatting."
              ]
        )
      } else {
        setHints([
          "All official visible test cases passed.",
          "You can now review the AI feedback below."
        ])
      }

      const combinedOutput = finalTestResults
        .map((item) => {
          const status = item.passed ? "Passed" : "Failed"
          const actual = normalizeOutput(item.actualOutput) || "No Output"
          const errorLine = item.runtimeError
            ? "\nError: " + item.runtimeError
            : ""

          return (
            "Test Case " +
            item.index +
            ": " +
            status +
            "\nInput: " +
            item.input +
            "\nExpected: " +
            item.expectedOutput +
            "\nYour Output: " +
            actual +
            errorLine
          )
        })
        .join("\n\n")

      setOutput(combinedOutput || "No Output")

      const user = JSON.parse(localStorage.getItem("user") || "{}")
      const userId = user?._id || user?.id || ""

      const response = await axios.post(`${API}/submit`, {
        userId,
        code,
        language,
        problem,
        testResults: finalTestResults
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
      <div className="max-w-[1600px] mx-auto space-y-8 page-fade">
        <section
          onMouseMove={handleMouseMove}
          className="glow-card relative overflow-hidden rounded-[3rem] border border-cyan-400/20 bg-slate-950/90 p-6 sm:p-8 shadow-[0_0_120px_rgba(34,211,238,0.12)]"
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
                  Practice coding questions with a polished editor, custom
                  input execution, official test cases, Piston execution, AI
                  review and smart correction hints.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
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
          className="glow-card rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-6 hover:border-cyan-300/30"
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
          <div className="grid grid-cols-1 2xl:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)] gap-8 items-start">
            <section
              onMouseMove={handleMouseMove}
              className="glow-card rounded-[2.3rem] border border-cyan-400/10 bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-6 hover:border-cyan-300/30"
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
                  <h3 className="text-blue-300 font-bold mb-2 flex items-center gap-2">
                    <BookOpen size={18} />
                    Problem Understanding
                  </h3>

                  <p className="text-slate-300 leading-7">
                    Read the input carefully, apply the correct{" "}
                    {problem?.category || "programming"} concept and print only
                    the final answer. Avoid debug output and extra text.
                  </p>
                </div>

                <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-5">
                  <h3 className="text-purple-300 font-bold mb-2 flex items-center gap-2">
                    <Target size={18} />
                    Practice Focus
                  </h3>

                  <p className="text-slate-300 leading-7">
                    Focus on correctness, edge cases, clean stdin parsing,
                    output formatting and interview-ready explanation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <InfoMini
                  title="Input Format"
                  value={
                    problem.inputFormat ||
                    "Input is provided through standard input."
                  }
                />

                <InfoMini
                  title="Constraints"
                  value={
                    problem.constraints ||
                    "Use an efficient solution and handle edge cases."
                  }
                />
              </div>

              {problem.companies?.length > 0 && (
                <div className="mb-6">
                  <p className="text-slate-400 text-sm mb-2">
                    Commonly Asked In
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {problem.companies.map((company) => (
                      <span
                        key={company}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 text-sm"
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-4">Test Cases</h3>

              <div className="space-y-3">
                {(problem.testCases || []).map((testCase, index) => (
                  <div
                    key={`${testCase.input}-${index}`}
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
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ClipboardCheck size={20} className="text-cyan-300" />
                    Official Test Results
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

                      <RunBlock title="Input" value={test.input} tone="cyan" />
                      <RunBlock
                        title="Expected Output"
                        value={test.expectedOutput}
                        tone="green"
                      />
                      <RunBlock
                        title="Your Output"
                        value={normalizeOutput(test.actualOutput)}
                        tone={test.passed ? "green" : "red"}
                      />

                      {test.runtimeError && (
                        <RunBlock
                          title="Runtime / Syntax Error"
                          value={test.runtimeError}
                          tone="red"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {customRunResult && (
                <div
                  className={`mt-8 rounded-[2rem] border p-5 ${
                    customRunResult.runtimeError
                      ? "border-red-400/20 bg-red-500/10"
                      : "border-emerald-400/20 bg-emerald-500/10"
                  }`}
                >
                  <h3
                    className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                      customRunResult.runtimeError
                        ? "text-red-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {customRunResult.runtimeError ? (
                      <XCircle size={20} />
                    ) : (
                      <CheckCircle size={20} />
                    )}
                    {customRunResult.runtimeError
                      ? "Custom Run Failed"
                      : "Custom Run Passed"}
                  </h3>

                  <p className="text-slate-300 leading-7 mb-4">
                    This run uses your custom input only. It is useful for
                    experimenting with your own cases. Click Submit to verify
                    official visible test cases.
                  </p>

                  <div className="space-y-4">
                    <RunBlock
                      title="Custom Input"
                      value={customRunResult.input}
                      tone="cyan"
                    />

                    <RunBlock
                      title="Your Output"
                      value={
                        normalizeOutput(customRunResult.actualOutput) ||
                        "No Output"
                      }
                      tone="green"
                    />

                    {customRunResult.inputIssue && (
                      <RunBlock
                        title="Input Format Warning"
                        value={customRunResult.inputIssue}
                        tone="yellow"
                      />
                    )}

                    {customRunResult.runtimeError && (
                      <RunBlock
                        title="Runtime / Syntax Error"
                        value={customRunResult.runtimeError}
                        tone="red"
                      />
                    )}
                  </div>
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
                      <p key={`${hint}-${index}`} className="text-yellow-100 leading-7">
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
              className="glow-card rounded-[2.3rem] border border-cyan-400/10 bg-slate-950/80 p-4 hover:border-cyan-300/30 2xl:sticky 2xl:top-24"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 px-2">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Code Editor
                  </h2>

                  <p className="text-slate-400 text-sm">
                    Run uses custom input. Submit verifies official test cases.
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
                  height="min(68vh, 720px)"
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
                  placeholder="Enter custom input exactly like the sample format. Example: [1,2,3] or hello"
                  className="w-full h-28 resize-none rounded-2xl bg-slate-900/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />

                <p className="text-white font-bold mt-4 mb-2">
                  {customRunResult ? "Custom Run Output" : "Output"}
                </p>

                <pre className="min-h-28 max-h-60 overflow-auto rounded-2xl bg-black/50 border border-white/10 px-4 py-3 text-emerald-300 whitespace-pre-wrap">
                  {output || "Run with custom input to see output here..."}
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

function InfoMini({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-slate-500 text-sm mb-2">{title}</p>
      <p className="text-slate-300 leading-6 text-sm">{value}</p>
    </div>
  )
}

function RunBlock({ title, value, tone = "cyan" }) {
  const tones = {
    cyan: "text-cyan-300",
    green: "text-emerald-300",
    red: "text-red-300",
    yellow: "text-yellow-200"
  }

  return (
    <div className="mt-3">
      <p className="text-slate-400 text-sm mb-1">{title}</p>

      <pre
        className={`rounded-xl bg-black/40 border border-white/10 p-4 overflow-auto whitespace-pre-wrap ${
          tones[tone] || tones.cyan
        }`}
      >
        {value || "No data"}
      </pre>
    </div>
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