import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import "../styles/LegalTech.css";

const LegalTech = () => {
  const navigate = useNavigate();
  const { isLoggedin, userData } = useContext(AppContext);

  // States
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showUpload, setShowUpload] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "bot",
      content:
        "Hello! Ask me:\n• Is this risky?\n• Can they terminate anytime?\n• Who owns the IP?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Refs
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedin) {
      navigate("/login");
    }
  }, [isLoggedin, navigate]);

  // API Base URL - adjust according to your setup
  const LEGAL_TECH_API = import.meta.env.VITE_LEGAL_TECH_API_URL || "http://localhost:8000";


  // ─── Theme Toggle ─────────────────────
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "light" : "dark",
    );
  };

  // ─── Logout ────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ─── File Handling ────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add("dragover");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = async (file) => {
    if (isAnalyzing) return;

    const allowed = /\.(pdf|docx|jpg|jpeg|png)$/i;
    if (!allowed.test(file.name)) {
      toast.error(
        "Unsupported file type. Please upload PDF, DOCX, JPG, JPEG, or PNG.",
      );
      return;
    }

    setIsAnalyzing(true);
    setFileName(file.name);

    try {
      // Step 1: Upload file
      toast.info("Uploading and extracting text...");
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${LEGAL_TECH_API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      setCurrentDocumentId(uploadData.document_id);

      // Step 2: Analyze
      toast.info("Analyzing contract with AI...");
      const analyzeRes = await fetch(`${LEGAL_TECH_API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: uploadData.document_id }),
      });

      if (!analyzeRes.ok) {
        const error = await analyzeRes.json();
        throw new Error(error.error || "Analysis failed");
      }

      const analysisResult = await analyzeRes.json();
      setAnalysisData(analysisResult);
      setShowUpload(false);
      setChatHistory([]);
      setChatMessages([
        {
          role: "bot",
          content: "Contract analyzed! Ask me anything about it.",
        },
      ]);

      toast.success("Contract analyzed successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Chat Functions ───────────────────
  const sendChat = async () => {
    const question = chatInput.trim();
    if (!question || !currentDocumentId) {
      if (!currentDocumentId) toast.error("Please upload a contract first");
      return;
    }

    setChatInput("");
    const newMessages = [...chatMessages, { role: "user", content: question }];
    setChatMessages(newMessages);

    try {
      const res = await fetch(`${LEGAL_TECH_API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: currentDocumentId,
          question,
          history: chatHistory,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Chat failed");
      }

      const data = await res.json();
      setChatMessages([
        ...newMessages,
        { role: "bot", content: data.response },
      ]);
      setChatHistory([
        ...chatHistory,
        { role: "user", content: question },
        { role: "assistant", content: data.response },
      ]);
    } catch (err) {
      toast.error(err.message || "Failed to get response");
      setChatMessages([
        ...newMessages,
        {
          role: "bot",
          content: "⚠️ " + (err.message || "Something went wrong"),
        },
      ]);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ─── Back Button ──────────────────────
  const goBack = () => {
    setShowUpload(true);
    setCurrentDocumentId(null);
    setChatHistory([]);
    setChatMessages([
      {
        role: "bot",
        content:
          "Hello! Ask me:\n• Is this risky?\n• Can they terminate anytime?\n• Who owns the IP?",
      },
    ]);
    setAnalysisData(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className="legal-tech-container"
      data-theme={isDarkMode ? "dark" : "light"}>
      {/* Navbar */}
      <nav className="legal-navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <i className="fas fa-scale-balanced"></i>
            <span>LegalAssist</span>-AI
          </div>
          <div className="navbar-actions">
            <button className="theme-btn" onClick={toggleTheme}>
              <i className={`fas fa-${isDarkMode ? "sun" : "moon"}`}></i>
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="legal-content container-centered">
        {/* Upload Section */}
        {showUpload ? (
          <section className="upload-section">
            <div className="hero-content">
              <div className="hero-left">
                <span className="badge-ai">AI Powered Legal Intelligence</span>
                <h1 className="hero-title">
                  Analyze Legal Contracts <span>In Seconds</span>
                </h1>
                <p className="hero-text">
                  Upload agreements and instantly receive AI summaries, risk
                  detection, legal insights, and smart negotiation suggestions.
                </p>
                <div className="feature-pills">
                  <div className="pill">
                    <i className="fas fa-shield-halved"></i>
                    Risk Detection
                  </div>
                  <div className="pill">
                    <i className="fas fa-file-contract"></i>
                    AI Summary
                  </div>
                  <div className="pill">
                    <i className="fas fa-robot"></i>
                    AI Chatbot
                  </div>
                </div>
              </div>

              <div className="hero-right">
                <div className="upload-card">
                  <div className="upload-header">
                    <div className="upload-icon">
                      <i className="fas fa-cloud-arrow-up"></i>
                    </div>
                    <h3>Upload Contract</h3>
                    <p>PDF / DOCX supported</p>
                  </div>

                  <div
                    className="drop-zone"
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInput}
                      accept=".pdf,.docx,.jpg,.jpeg,.png"
                      style={{ display: "none" }}
                    />
                    <div className="drop-content">
                      <i className="fas fa-file-arrow-up"></i>
                      <h5>Drag & Drop File</h5>
                      <p>or click to browse</p>
                    </div>
                  </div>

                  <button
                    className={`analyze-btn ${isAnalyzing ? "loading" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <span className="spinner"></span>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-wand-magic-sparkles"></i>
                        Analyze Contract
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Dashboard Section */
          <section className="dashboard-section">
            <div className="dashboard-header">
              <div>
                <h2>Contract Analysis</h2>
                <p className="file-name">{fileName}</p>
              </div>
              <button className="back-btn" onClick={goBack}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
            </div>

            <div className="dashboard-grid">
              {/* Left Column */}
              <div className="dashboard-left">
                {/* Stats */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-gauge-high"></i>
                    </div>
                    <div>
                      <p>Risk Score</p>
                      <h3>{analysisData?.risk_score || "0"}/10</h3>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon yellow">
                      <i className="fas fa-gavel"></i>
                    </div>
                    <div>
                      <p>Risk Clauses</p>
                      <h3>{(analysisData?.risky_clauses || []).length}</h3>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon danger">
                      <i className="fas fa-hourglass-half"></i>
                    </div>
                    <div>
                      <p>Deadlines</p>
                      <h3>{(analysisData?.deadlines || []).length}</h3>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="glass-card">
                  <h4 className="section-title">
                    <i className="fas fa-file-lines"></i>
                    Contract Summary
                  </h4>
                  <p className="summary-text">
                    {analysisData?.summary || "No summary available"}
                  </p>
                </div>

                {/* Contract Type & Parties */}
                <div className="glass-card">
                  <h4 className="section-title">
                    <i className="fas fa-info-circle"></i>
                    Contract Details
                  </h4>
                  <div className="detail-item">
                    <strong>Type:</strong>{" "}
                    {analysisData?.contract_type || "Unknown"}
                  </div>
                  <div className="detail-item">
                    <strong>Parties:</strong>
                    {analysisData?.parties &&
                    analysisData.parties.length > 0 ? (
                      <ul>
                        {analysisData.parties.map((party, i) => (
                          <li key={i}>{party}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Not identified</p>
                    )}
                  </div>
                </div>

                {/* Risk Analysis */}
                {analysisData?.risky_clauses &&
                  analysisData.risky_clauses.length > 0 && (
                    <div className="glass-card">
                      <h4 className="section-title">
                        <i className="fas fa-shield-halved"></i>
                        Risk Analysis
                      </h4>
                      {analysisData.risky_clauses.map((clause, i) => (
                        <div
                          key={i}
                          className={`risk-item severity-${(clause.severity || "high").toLowerCase()}`}>
                          <div className="risk-content">
                            <h6>{clause.title || `Clause ${i + 1}`}</h6>
                            <p>{clause.reason || "Risk identified"}</p>
                          </div>
                          <span
                            className={`risk-badge ${(clause.severity || "high").toLowerCase()}`}>
                            {clause.severity || "High"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Recommendations */}
                {analysisData?.recommendations &&
                  analysisData.recommendations.length > 0 && (
                    <div className="glass-card">
                      <h4 className="section-title">
                        <i className="fas fa-lightbulb"></i>
                        AI Suggestions
                      </h4>
                      {analysisData.recommendations.map((rec, i) => (
                        <div key={i} className="suggestion">
                          <i className="fas fa-check-circle"></i>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Right Column - Chat */}
              <div className="dashboard-right">
                <div className="chat-card">
                  <div className="chat-header">
                    <h4>
                      <i className="fas fa-robot"></i>
                      AI Legal Assistant
                    </h4>
                    <p>Ask contract questions</p>
                  </div>

                  <div className="chat-messages" ref={chatMessagesRef}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`chat-message ${msg.role}`}>
                        <div className="chat-bubble">
                          {msg.content.split("\n").map((line, j) => (
                            <div key={j}>{line}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="chat-input-area">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendChat()}
                      placeholder="Ask something..."
                    />
                    <button onClick={sendChat} className="chat-send">
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default LegalTech;
