import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

function OAuthSuccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const token = params.get("token")
    const user = params.get("user")

    if (token && user) {
      localStorage.setItem("token", token)
      localStorage.setItem("user", decodeURIComponent(user))
      navigate("/dashboard")
    } else {
      navigate("/login")
    }
  }, [params, navigate])

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
      Logging you in...
    </div>
  )
}

export default OAuthSuccess
