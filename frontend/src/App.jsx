import { BrowserRouter, Routes, Route } from "react-router-dom"

import LandingPage from "./pages/LandingPage.jsx"

import Signup from "./pages/Signup.jsx"
import Login from "./pages/Login.jsx"
import Dashboard from "./pages/Dashboard.jsx"

import Interview from "./pages/Interview.jsx"
import LiveInterview from "./pages/LiveInterview.jsx"
import HRRound from "./pages/HRRound.jsx"
import GDRound from "./pages/GDRound.jsx"
import LiveGDRound from "./pages/LiveGDRound.jsx"

import ResumeAnalyzer from "./pages/ResumeAnalyzer.jsx"
import ResumeBuilder from "./pages/ResumeBuilder.jsx"

import CodingRound from "./pages/CodingRound.jsx"
import AptitudeRound from "./pages/AptitudeRound.jsx"
import OAAssessment from "./pages/OAAssessment.jsx"

import PlacementReadiness from "./pages/PlacementReadiness.jsx"
import SystemDesignInterview from "./pages/SystemDesignInterview.jsx"
import SkillRoadmap from "./pages/SkillRoadmap.jsx"
import PlacementPredictor from "./pages/PlacementPredictor.jsx"
import MockPlacementDrive from "./pages/MockPlacementDrive.jsx"
import RecruiterDashboard from "./pages/RecruiterDashboard.jsx"

import History from "./pages/History.jsx"
import Certificate from "./pages/Certificate.jsx"

import About from "./pages/About.jsx"
import HelpSupport from "./pages/HelpSupport.jsx"
import Account from "./pages/Account.jsx"
import Settings from "./pages/Settings.jsx"
import PrivacySecurity from "./pages/PrivacySecurity.jsx"
import OAuthSuccess from "./pages/OAuthSuccess.jsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/interview" element={<Interview />} />
        <Route path="/live-interview" element={<LiveInterview />} />
        <Route path="/hr-round" element={<HRRound />} />
        <Route path="/gd-round" element={<GDRound />} />
        <Route path="/live-gd-round" element={<LiveGDRound />} />

        <Route path="/resume" element={<ResumeAnalyzer />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />

        <Route path="/coding-round" element={<CodingRound />} />
        <Route path="/aptitude" element={<AptitudeRound />} />
        <Route path="/oa-assessment" element={<OAAssessment />} />

        <Route path="/placement-readiness" element={<PlacementReadiness />} />
        <Route path="/system-design" element={<SystemDesignInterview />} />
        <Route path="/skill-roadmap" element={<SkillRoadmap />} />
        <Route path="/placement-predictor" element={<PlacementPredictor />} />
        <Route path="/mock-placement" element={<MockPlacementDrive />} />
        <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />

        <Route path="/history" element={<History />} />
        <Route path="/certificate" element={<Certificate />} />

        <Route path="/about" element={<About />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="/support" element={<HelpSupport />} />
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/privacy" element={<PrivacySecurity />} />
        <Route path="/security" element={<PrivacySecurity />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App