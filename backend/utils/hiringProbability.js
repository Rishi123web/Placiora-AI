export const calculateHiringProbability = (
  technical,
  communication,
  confidence
) => {
  const probability =
    technical * 0.5 +
    communication * 0.3 +
    confidence * 0.2

  let verdict = ""
  let level = ""

  if (probability >= 85) {
    verdict =
      "Strong candidate. High chance of clearing technical and HR rounds."

    level = "Excellent"
  }
  else if (probability >= 70) {
    verdict =
      "Good candidate. Likely to clear initial rounds with minor improvements."

    level = "Good"
  }
  else if (probability >= 50) {
    verdict =
      "Average candidate. Requires more preparation before placements."

    level = "Moderate"
  }
  else {
    verdict =
      "Needs significant improvement before appearing for interviews."

    level = "Low"
  }

  return {
    probability: Math.round(probability),
    verdict,
    level
  }
}