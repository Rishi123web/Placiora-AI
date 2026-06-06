import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function generateFollowUpQuestion({
  question,
  answer
}) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content:
            "You are an AI interviewer. Generate ONE short intelligent follow-up interview question."
        },
        {
          role: "user",
          content: `
Current Question:
${question}

Candidate Answer:
${answer}
`
        }
      ],
      temperature: 0.7,
      max_tokens: 60
    })

    return (
      completion.choices?.[0]?.message?.content ||
      "Can you explain that in more detail?"
    )
  } catch (error) {
    console.log("Groq followup error:", error)

    return "Can you explain that in more detail?"
  }
}