import express from "express"
import mongoose from "mongoose"

import CodingSession from "../models/CodingSession.js"
import { evaluateCodingAnswerAI } from "../utils/aiEvaluator.js"
import { runPiston } from "../utils/piston.js"

const router = express.Router()

const LANGUAGE_STARTERS = {
  javascript: `const fs = require("fs")
const input = fs.readFileSync(0, "utf8").trim()

console.log(input || "Hello World")`,

  python: `import sys

text = sys.stdin.read().strip()
print(text or "Hello World")`,

  java: `import java.util.*;

class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String input = sc.hasNextLine() ? sc.nextLine() : "Hello World";
    System.out.println(input);
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
        javascript: `const fs = require("fs")
const input = fs.readFileSync(0, "utf8").trim()

function reverseString(str) {
  return str.split("").reverse().join("")
}

console.log(reverseString(input))`,

        python: `import sys

s = sys.stdin.read().strip()

def reverse_string(s):
    return s[::-1]

print(reverse_string(s))`,

        java: `import java.util.*;

class Main {
  static String reverseString(String str) {
    return new StringBuilder(str).reverse().toString();
  }

  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String input = sc.hasNextLine() ? sc.nextLine().trim() : "";
    System.out.println(reverseString(input));
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
  char str[1000];

  if (fgets(str, sizeof(str), stdin) == NULL) {
    return 0;
  }

  str[strcspn(str, "\\n")] = '\\0';
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
  string input;
  getline(cin, input);
  cout << reverseString(input);
  return 0;
}`,

        go: `package main

import (
  "bufio"
  "fmt"
  "os"
  "strings"
)

func reverseString(s string) string {
  r := []rune(s)

  for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {
    r[i], r[j] = r[j], r[i]
  }

  return string(r)
}

func main() {
  reader := bufio.NewReader(os.Stdin)
  input, _ := reader.ReadString('\\n')
  input = strings.TrimSpace(input)

  fmt.Println(reverseString(input))
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
        javascript: `const fs = require("fs")
const input = fs.readFileSync(0, "utf8").trim()

const arr = JSON.parse(input)

function findMax(arr) {
  return Math.max(...arr)
}

console.log(findMax(arr))`,

        python: `import sys
import json

arr = json.loads(sys.stdin.read().strip())

def find_max(arr):
    return max(arr)

print(find_max(arr))`,

        java: `import java.util.*;

class Main {
  static int findMax(int[] arr) {
    int max = arr[0];

    for (int num : arr) {
      if (num > max) max = num;
    }

    return max;
  }

  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String input = sc.hasNextLine() ? sc.nextLine().trim() : "";

    input = input.replace("[", "").replace("]", "").trim();

    if (input.isEmpty()) {
      System.out.println(0);
      return;
    }

    String[] parts = input.split(",");
    int[] arr = new int[parts.length];

    for (int i = 0; i < parts.length; i++) {
      arr[i] = Integer.parseInt(parts[i].trim());
    }

    System.out.println(findMax(arr));
  }
}`,

        c: `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int main() {
  char input[2000];

  if (fgets(input, sizeof(input), stdin) == NULL) {
    return 0;
  }

  int max = -2147483648;
  int found = 0;

  char *p = input;

  while (*p) {
    if ((*p >= '0' && *p <= '9') || *p == '-') {
      int num = strtol(p, &p, 10);

      if (!found || num > max) {
        max = num;
        found = 1;
      }
    } else {
      p++;
    }
  }

  if (found) printf("%d", max);

  return 0;
}`,

        cpp: `#include <iostream>
#include <string>
#include <climits>
using namespace std;

int main() {
  string input;
  getline(cin, input);

  int maxValue = INT_MIN;
  bool found = false;

  for (int i = 0; i < input.size(); i++) {
    if (isdigit(input[i]) || input[i] == '-') {
      int sign = 1;

      if (input[i] == '-') {
        sign = -1;
        i++;
      }

      int num = 0;

      while (i < input.size() && isdigit(input[i])) {
        num = num * 10 + (input[i] - '0');
        i++;
      }

      num *= sign;

      if (!found || num > maxValue) {
        maxValue = num;
        found = true;
      }
    }
  }

  if (found) cout << maxValue;

  return 0;
}`,

        go: `package main

import (
  "bufio"
  "fmt"
  "os"
  "regexp"
  "strconv"
)

func main() {
  reader := bufio.NewReader(os.Stdin)
  input, _ := reader.ReadString('\\n')

  re := regexp.MustCompile("-?\\\\d+")
  matches := re.FindAllString(input, -1)

  if len(matches) == 0 {
    return
  }

  max, _ := strconv.Atoi(matches[0])

  for _, item := range matches {
    num, _ := strconv.Atoi(item)

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
        javascript: `const fs = require("fs")
const input = fs.readFileSync(0, "utf8").trim()

function isPalindrome(str) {
  return str === str.split("").reverse().join("")
}

console.log(isPalindrome(input))`,

        python: `import sys

s = sys.stdin.read().strip()

def is_palindrome(s):
    return s == s[::-1]

print(str(is_palindrome(s)).lower())`,

        java: `import java.util.*;

class Main {
  static boolean isPalindrome(String str) {
    return str.equals(new StringBuilder(str).reverse().toString());
  }

  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String input = sc.hasNextLine() ? sc.nextLine().trim() : "";
    System.out.println(isPalindrome(input));
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
  char str[1000];

  if (fgets(str, sizeof(str), stdin) == NULL) {
    return 0;
  }

  str[strcspn(str, "\\n")] = '\\0';
  printf("%s", isPalindrome(str) ? "true" : "false");

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
  string input;
  getline(cin, input);
  cout << (isPalindrome(input) ? "true" : "false");
  return 0;
}`,

        go: `package main

import (
  "bufio"
  "fmt"
  "os"
  "strings"
)

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
  reader := bufio.NewReader(os.Stdin)
  input, _ := reader.ReadString('\\n')
  input = strings.TrimSpace(input)

  fmt.Println(isPalindrome(input))
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
        javascript: `const fs = require("fs")
const input = fs.readFileSync(0, "utf8").trim()

const [arrText, targetText] = input.split("|")
const nums = JSON.parse(arrText)
const target = Number(targetText)

function twoSum(nums, target) {
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

console.log(JSON.stringify(twoSum(nums, target)))`,

        python: `import sys
import json

raw = sys.stdin.read().strip()
arr_text, target_text = raw.split("|")

nums = json.loads(arr_text)
target = int(target_text)

def two_sum(nums, target):
    seen = {}

    for i, num in enumerate(nums):
        needed = target - num

        if needed in seen:
            return [seen[needed], i]

        seen[num] = i

    return []

print(str(two_sum(nums, target)).replace(" ", ""))`,

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
    Scanner sc = new Scanner(System.in);
    String raw = sc.hasNextLine() ? sc.nextLine().trim() : "";
    String[] chunks = raw.split("\\\\|");

    String arrText = chunks[0].replace("[", "").replace("]", "");
    int target = Integer.parseInt(chunks[1].trim());

    String[] parts = arrText.split(",");
    int[] nums = new int[parts.length];

    for (int i = 0; i < parts.length; i++) {
      nums[i] = Integer.parseInt(parts[i].trim());
    }

    System.out.println(Arrays.toString(twoSum(nums, target)).replace(" ", ""));
  }
}`,

        c: `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int main() {
  char input[2000];

  if (fgets(input, sizeof(input), stdin) == NULL) {
    return 0;
  }

  int nums[1000];
  int n = 0;
  int target = 0;
  int afterPipe = 0;

  char *p = input;

  while (*p) {
    if (*p == '|') {
      afterPipe = 1;
      p++;
      continue;
    }

    if ((*p >= '0' && *p <= '9') || *p == '-') {
      int num = strtol(p, &p, 10);

      if (afterPipe) {
        target = num;
      } else {
        nums[n++] = num;
      }
    } else {
      p++;
    }
  }

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
#include <string>
using namespace std;

vector<int> parseNums(string text) {
  vector<int> nums;

  for (int i = 0; i < text.size(); i++) {
    if (isdigit(text[i]) || text[i] == '-') {
      int sign = 1;

      if (text[i] == '-') {
        sign = -1;
        i++;
      }

      int num = 0;

      while (i < text.size() && isdigit(text[i])) {
        num = num * 10 + (text[i] - '0');
        i++;
      }

      nums.push_back(num * sign);
    }
  }

  return nums;
}

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
  string raw;
  getline(cin, raw);

  int pipe = raw.find("|");
  string arrText = raw.substr(0, pipe);
  string targetText = raw.substr(pipe + 1);

  vector<int> nums = parseNums(arrText);
  int target = stoi(targetText);

  vector<int> ans = twoSum(nums, target);

  if (ans.size() == 2) {
    cout << "[" << ans[0] << "," << ans[1] << "]";
  } else {
    cout << "[]";
  }

  return 0;
}`,

        go: `package main

import (
  "bufio"
  "fmt"
  "os"
  "regexp"
  "strconv"
  "strings"
)

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

func parseNums(text string) []int {
  re := regexp.MustCompile("-?\\\\d+")
  matches := re.FindAllString(text, -1)
  nums := []int{}

  for _, item := range matches {
    num, _ := strconv.Atoi(item)
    nums = append(nums, num)
  }

  return nums
}

func main() {
  reader := bufio.NewReader(os.Stdin)
  raw, _ := reader.ReadString('\\n')
  raw = strings.TrimSpace(raw)

  parts := strings.Split(raw, "|")
  nums := parseNums(parts[0])
  target, _ := strconv.Atoi(strings.TrimSpace(parts[1]))

  ans := twoSum(nums, target)

  if len(ans) == 2 {
    fmt.Printf("[%d,%d]", ans[0], ans[1])
  } else {
    fmt.Print("[]")
  }
}`
      },
      testCases: [
        { input: "[2, 7, 11, 15]|9", expectedOutput: "[0,1]" },
        { input: "[3, 2, 4]|6", expectedOutput: "[1,2]" }
      ]
    }
  ]
}

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

const prepareProblemForLanguage = (problem, language = "javascript") => {
  const safeLanguage = normalizeLanguage(language)

  return {
    ...problem,
    language: safeLanguage,
    starterCode:
      problem.languageStarters?.[safeLanguage] ||
      problem.languageStarters?.javascript ||
      LANGUAGE_STARTERS[safeLanguage] ||
      LANGUAGE_STARTERS.javascript
  }
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

router.get("/problem", (req, res) => {
  try {
    const difficulty = req.query.difficulty || "Beginner"
    const language = normalizeLanguage(req.query.language || "javascript")
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