import express from "express"
import mongoose from "mongoose"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { exec } from "child_process"
import { promisify } from "util"

import CodingSession from "../models/CodingSession.js"
import { evaluateCodingAnswerAI } from "../utils/aiEvaluator.js"

const router = express.Router()
const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TEMP_DIR = path.join(__dirname, "../temp-code")

const MSYS_BIN = process.env.MSYS_BIN || "C:\\msys64\\ucrt64\\bin"

const withMsysPath = (command) => {
  return `set "PATH=${MSYS_BIN};%PATH%" && ${command}`
}

const LOCAL_RUNNERS = {
  javascript: {
    file: "main.js",
    command: "node main.js"
  },
  python: {
    file: "main.py",
    command: "python main.py"
  },
  java: {
    file: "Main.java",
    command: "javac Main.java && java Main"
  },
  c: {
    file: "main.c",
    command: withMsysPath(
      `"${MSYS_BIN}\\gcc.exe" main.c -o main.exe && .\\main.exe`
    )
  },
  cpp: {
    file: "main.cpp",
    command: withMsysPath(
      `"${MSYS_BIN}\\g++.exe" main.cpp -o main.exe && .\\main.exe`
    )
  },
  go: {
    file: "main.go",
    command: "go run main.go"
  }
}

const LANGUAGE_STARTERS = {
  javascript: `console.log("Hello World")`,

  python: `print("Hello World")`,

  java: `class Main {
  public static void main(String[] args) {
    System.out.println("Hello World");
  }
}`,

  c: `#include <stdio.h>

int main() {
  printf("Hello World");
  return 0;
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello World";
  return 0;
}`,

  go: `package main

import "fmt"

func main() {
  fmt.Println("Hello World")
}`
}

const problems = {
  Beginner: [
    {
      title: "Reverse a String",
      difficulty: "Beginner",
      category: "String",
      description:
        "Write a function/program that returns the reversed version of a string.",
      expectedOutput: "olleh",
      languageStarters: {
        javascript: `function reverseString(str) {
  return str.split("").reverse().join("")
}

console.log(reverseString("hello"))`,

        python: `def reverse_string(s):
    return s[::-1]

print(reverse_string("hello"))`,

        java: `class Main {
  static String reverseString(String str) {
    return new StringBuilder(str).reverse().toString();
  }

  public static void main(String[] args) {
    System.out.println(reverseString("hello"));
  }
}`,

        c: `#include <stdio.h>
#include <string.h>

void reverseString(char str[]) {
  int n = strlen(str);

  for (int i = 0; i < n / 2; i++) {
    char temp = str[i];
    str[i] = str[n - i - 1];
    str[n - i - 1] = temp;
  }
}

int main() {
  char str[] = "hello";
  reverseString(str);
  printf("%s", str);
  return 0;
}`,

        cpp: `#include <iostream>
#include <algorithm>
using namespace std;

string reverseString(string str) {
  reverse(str.begin(), str.end());
  return str;
}

int main() {
  cout << reverseString("hello");
  return 0;
}`,

        go: `package main

import "fmt"

func reverseString(s string) string {
  r := []rune(s)

  for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {
    r[i], r[j] = r[j], r[i]
  }

  return string(r)
}

func main() {
  fmt.Println(reverseString("hello"))
}`
      },
      testCases: [
        { input: "hello", expectedOutput: "olleh" },
        { input: "raju", expectedOutput: "ujar" }
      ]
    },

    {
      title: "Find Maximum Number",
      difficulty: "Beginner",
      category: "Array",
      description:
        "Write a function/program that returns the largest number from an array.",
      expectedOutput: "9",
      languageStarters: {
        javascript: `function findMax(arr) {
  return Math.max(...arr)
}

console.log(findMax([4, 8, 1, 9, 2]))`,

        python: `def find_max(arr):
    return max(arr)

print(find_max([4, 8, 1, 9, 2]))`,

        java: `class Main {
  static int findMax(int[] arr) {
    int max = arr[0];

    for (int num : arr) {
      if (num > max) max = num;
    }

    return max;
  }

  public static void main(String[] args) {
    System.out.println(findMax(new int[]{4, 8, 1, 9, 2}));
  }
}`,

        c: `#include <stdio.h>

int findMax(int arr[], int n) {
  int max = arr[0];

  for (int i = 1; i < n; i++) {
    if (arr[i] > max) max = arr[i];
  }

  return max;
}

int main() {
  int arr[] = {4, 8, 1, 9, 2};
  printf("%d", findMax(arr, 5));
  return 0;
}`,

        cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
  vector<int> arr = {4, 8, 1, 9, 2};
  cout << *max_element(arr.begin(), arr.end());
  return 0;
}`,

        go: `package main

import "fmt"

func main() {
  arr := []int{4, 8, 1, 9, 2}
  max := arr[0]

  for _, num := range arr {
    if num > max {
      max = num
    }
  }

  fmt.Println(max)
}`
      },
      testCases: [
        { input: "[4, 8, 1, 9, 2]", expectedOutput: "9" },
        { input: "[10, 3, 25, 7]", expectedOutput: "25" }
      ]
    }
  ],

  Intermediate: [
    {
      title: "Check Palindrome",
      difficulty: "Intermediate",
      category: "String",
      description:
        "Write a function/program that checks whether a string is a palindrome.",
      expectedOutput: "true",
      languageStarters: {
        javascript: `function isPalindrome(str) {
  return str === str.split("").reverse().join("")
}

console.log(isPalindrome("madam"))`,

        python: `def is_palindrome(s):
    return s == s[::-1]

print(str(is_palindrome("madam")).lower())`,

        java: `class Main {
  static boolean isPalindrome(String str) {
    return str.equals(new StringBuilder(str).reverse().toString());
  }

  public static void main(String[] args) {
    System.out.println(isPalindrome("madam"));
  }
}`,

        c: `#include <stdio.h>
#include <string.h>

int isPalindrome(char str[]) {
  int i = 0;
  int j = strlen(str) - 1;

  while (i < j) {
    if (str[i] != str[j]) return 0;
    i++;
    j--;
  }

  return 1;
}

int main() {
  printf("%s", isPalindrome("madam") ? "true" : "false");
  return 0;
}`,

        cpp: `#include <iostream>
#include <algorithm>
using namespace std;

bool isPalindrome(string str) {
  string rev = str;
  reverse(rev.begin(), rev.end());
  return str == rev;
}

int main() {
  cout << (isPalindrome("madam") ? "true" : "false");
  return 0;
}`,

        go: `package main

import "fmt"

func isPalindrome(s string) bool {
  r := []rune(s)

  for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {
    if r[i] != r[j] {
      return false
    }
  }

  return true
}

func main() {
  fmt.Println(isPalindrome("madam"))
}`
      },
      testCases: [
        { input: "madam", expectedOutput: "true" },
        { input: "hello", expectedOutput: "false" }
      ]
    }
  ],

  Advanced: [
    {
      title: "Two Sum",
      difficulty: "Advanced",
      category: "DSA",
      description: "Return indices of two numbers whose sum equals the target.",
      expectedOutput: "[0,1]",
      languageStarters: {
        javascript: `function twoSum(nums, target) {
  const map = new Map()

  for (let i = 0; i < nums.length; i++) {
    const needed = target - nums[i]

    if (map.has(needed)) {
      return [map.get(needed), i]
    }

    map.set(nums[i], i)
  }

  return []
}

console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)))`,

        python: `def two_sum(nums, target):
    seen = {}

    for i, num in enumerate(nums):
        needed = target - num

        if needed in seen:
            return [seen[needed], i]

        seen[num] = i

    return []

print(two_sum([2, 7, 11, 15], 9))`,

        java: `import java.util.*;

class Main {
  static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
      int needed = target - nums[i];

      if (map.containsKey(needed)) {
        return new int[]{map.get(needed), i};
      }

      map.put(nums[i], i);
    }

    return new int[]{};
  }

  public static void main(String[] args) {
    System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9)).replace(" ", ""));
  }
}`,

        c: `#include <stdio.h>

int main() {
  int nums[] = {2, 7, 11, 15};
  int target = 9;
  int n = 4;

  for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
      if (nums[i] + nums[j] == target) {
        printf("[%d,%d]", i, j);
        return 0;
      }
    }
  }

  printf("[]");
  return 0;
}`,

        cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int> nums, int target) {
  unordered_map<int, int> mp;

  for (int i = 0; i < nums.size(); i++) {
    int needed = target - nums[i];

    if (mp.count(needed)) {
      return {mp[needed], i};
    }

    mp[nums[i]] = i;
  }

  return {};
}

int main() {
  vector<int> ans = twoSum({2, 7, 11, 15}, 9);
  cout << "[" << ans[0] << "," << ans[1] << "]";
  return 0;
}`,

        go: `package main

import "fmt"

func twoSum(nums []int, target int) []int {
  seen := map[int]int{}

  for i, num := range nums {
    needed := target - num

    if index, ok := seen[needed]; ok {
      return []int{index, i}
    }

    seen[num] = i
  }

  return []int{}
}

func main() {
  ans := twoSum([]int{2, 7, 11, 15}, 9)
  fmt.Printf("[%d,%d]", ans[0], ans[1])
}`
      },
      testCases: [
        { input: "[2, 7, 11, 15], 9", expectedOutput: "[0,1]" },
        { input: "[3, 2, 4], 6", expectedOutput: "[1,2]" }
      ]
    }
  ]
}

const prepareProblemForLanguage = (problem, language = "javascript") => {
  return {
    ...problem,
    language,
    starterCode:
      problem.languageStarters?.[language] ||
      problem.languageStarters?.javascript ||
      LANGUAGE_STARTERS[language] ||
      LANGUAGE_STARTERS.javascript
  }
}

const createHints = ({ language, errorText }) => {
  const text = String(errorText || "").toLowerCase()
  const hints = []

  if (!text.trim()) return hints

  if (text.includes("not recognized")) {
    hints.push("Compiler is not installed or not added to PATH.")
    hints.push("Restart backend after fixing PATH.")
  }

  if (text.includes("expected") || text.includes("syntax")) {
    hints.push("Check missing brackets, semicolons, quotes or commas.")
  }

  if (text.includes("undeclared") || text.includes("cannot find symbol")) {
    hints.push("A variable or function name may be misspelled.")
  }

  if (text.includes("main")) {
    hints.push("Make sure your program has a valid main function/class.")
  }

  if (language === "java") {
    hints.push("Java class name must be Main.")
    hints.push("Use: class Main { public static void main(String[] args) { } }")
  }

  if (language === "python") {
    hints.push("Check indentation carefully.")
    hints.push("Python uses : after function/if/for/while blocks.")
  }

  if (language === "javascript") {
    hints.push("Use console.log(...) to print output.")
  }

  if (language === "c" || language === "cpp") {
    hints.push("Check #include statements and missing semicolons.")
    hints.push("Make sure main returns int.")
  }

  if (language === "go") {
    hints.push("Go code must start with package main.")
    hints.push("Use fmt.Println(...) and import \"fmt\".")
  }

  return [...new Set(hints)].slice(0, 5)
}

router.get("/problem", (req, res) => {
  try {
    const difficulty = req.query.difficulty || "Beginner"
    const language = req.query.language || "javascript"
    const list = problems[difficulty] || problems.Beginner
    const randomProblem = list[Math.floor(Math.random() * list.length)]

    res.json({
      success: true,
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
  let folderPath = ""

  try {
    const { code, language, stdin = "" } = req.body

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: "Code and language are required"
      })
    }

    const runner = LOCAL_RUNNERS[language]

    if (!runner) {
      return res.status(400).json({
        success: false,
        message: "This language is not supported by local runner.",
        hints: ["Choose JavaScript, Python, Java, C, C++ or Go."]
      })
    }

    folderPath = path.join(
      TEMP_DIR,
      `${Date.now()}-${Math.random().toString(36).slice(2)}`
    )

    await fs.mkdir(folderPath, { recursive: true })
    await fs.writeFile(path.join(folderPath, runner.file), code)

    if (stdin) {
      await fs.writeFile(path.join(folderPath, "input.txt"), stdin)
    }

    const command = stdin ? `${runner.command} < input.txt` : runner.command

    const { stdout, stderr } = await execAsync(command, {
      cwd: folderPath,
      timeout: 30000,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 10,
      env: {
        ...process.env,
        PATH: `${MSYS_BIN};${process.env.PATH}`
      }
    })

    res.json({
      success: true,
      stdout,
      stderr,
      compile_output: "",
      message: "",
      hints: [],
      status: {
        id: 3,
        description: "Accepted"
      }
    })
  } catch (error) {
    const errorText = error.stderr || error.stdout || error.message

    res.json({
      success: true,
      stdout: "",
      stderr: error.stderr || "",
      compile_output: error.stdout || "",
      message: error.message,
      hints: createHints({
        language: req.body?.language,
        errorText
      }),
      status: {
        id: 6,
        description: "Runtime/Compile Error"
      }
    })
  } finally {
    if (folderPath) {
      fs.rm(folderPath, { recursive: true, force: true }).catch(() => {})
    }
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

    const safeTestResults = Array.isArray(testResults) ? testResults : []

    const result = await evaluateCodingAnswerAI({
      problem: {
        ...problem,
        language
      },
      code,
      testResults: safeTestResults
    })

    const passedTests = safeTestResults.filter((item) => item.passed).length
    const totalTests = safeTestResults.length

    const codingSession = await CodingSession.create({
      userId:
        userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      title: problem.title || "",
      difficulty: problem.difficulty || "",
      category: problem.category || "",
      description: problem.description || "",
      language,
      code,
      score: result.score,
      feedback: result.feedback,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      improvedApproach: result.improvedApproach,
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
    res.status(500).json({
      success: false,
      message: "AI code evaluation failed",
      error: error.message
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