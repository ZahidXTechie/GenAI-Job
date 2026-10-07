import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useauth";
import { useInterview } from "../../auth/use.interview";
import { generateResumePdfByInterviewId } from "../../auth/services/interview.api";

// Converts the backend report contract into the smaller shape used by the UI.
const normalizeReport = (source) => {
  const questionList = (items = []) =>
    items.map((item) => ({
      question: item.question || item.questions || "",
      answer: item.answer || item.answers || "",
      intention: item.intention || "",
    }));

  return {
    id: source?._id || source?.id || "",
    createdAt: source?.createdAt || null,
    jobDescription: source?.jobDescription || source?.jobdescription || "",
    matchScore: source?.matchScore ?? source?.matchscore ?? 0,
    title: source?.title || "Interview preparation report",
    technicalQuestions: questionList(source?.technicalQuestions),
    behavioralQuestions: questionList(source?.behavioralQuestions),
    skillGap: (source?.skillGaps || []).map(({ skill, severity }) => ({
      skill,
      action: severity
        ? severity.charAt(0).toUpperCase() + severity.slice(1)
        : "Review",
    })),
    preparationPlan: (source?.preparationPlan || []).map(
      ({ day, days, focus, tasks }) => ({
        day: day || days,
        text: [focus, tasks].filter(Boolean).join(": "),
      }),
    ),
  };
};

// Keeps the report layout stable while the backend generates the response.
function ReportSkeleton() {
  return (
    <section
      className="report-workspace report-loading"
      aria-busy="true"
      aria-label="Preparing your interview report"
    >
      <div className="report-skeleton-hero">
        <div className="skeleton-copy">
          <span />
          <span />
          <span />
        </div>
        <div className="skeleton-score">
          <span />
        </div>
      </div>

      <div className="report-skeleton-layout">
        <main className="report-skeleton-main">
          <div className="skeleton-tabs">
            <span />
            <span />
            <span />
          </div>
          <div className="skeleton-heading">
            <span />
            <span />
            <span />
          </div>
          <div className="skeleton-question-list">
            <span />
            <span />
            <span />
          </div>
        </main>
        <aside className="report-skeleton-rail">
          <span />
          <span />
          <span />
          <span />
        </aside>
      </div>

      <div className="report-loading-status">
        <span className="loading-spinner" />
        Building your interview report...
      </div>
    </section>
  );
}

// Displays lightweight saved reports and opens the selected full report on demand.
function PreparationHistory({ reports, loading, error, onOpen }) {
  return (
    <section className="preparation-history" aria-labelledby="history-title">
      <div className="history-heading">
        <div>
          <p className="section-kicker">Your library</p>
          <h2 id="history-title">Previous preparations</h2>
        </div>
        <span>{reports.length} saved</span>
      </div>

      {loading ? (
        <div className="history-status" aria-live="polite">
          <span className="loading-spinner" /> Loading your preparations...
        </div>
      ) : error ? (
        <p className="history-status history-error">{error}</p>
      ) : reports.length === 0 ? (
        <p className="history-status">
          Your saved interview preparations will appear here.
        </p>
      ) : (
        <div className="preparation-list">
          {reports.map((savedReport) => (
            <article className="preparation-card" key={savedReport.id}>
              <div className="preparation-card-topline">
                <span className="preparation-date">
                  {savedReport.createdAt
                    ? new Date(savedReport.createdAt).toLocaleDateString()
                    : "Saved preparation"}
                </span>
                <span className="preparation-score">
                  {savedReport.matchScore}% match
                </span>
              </div>
              <h3>{savedReport.title}</h3>
              <p className="preparation-role">
                {savedReport.jobDescription || "Interview preparation"}
              </p>
              <div className="preparation-plan-preview">
                {savedReport.preparationPlan.slice(0, 2).map((step) => (
                  <span key={`${step.day}-${step.text}`}>{step.text}</span>
                ))}
              </div>
              <button
                className="preparation-open"
                type="button"
                onClick={() => onOpen(savedReport.id)}
              >
                Open preparation <span aria-hidden="true">-&gt;</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function InterviewHome() {
  const { user } = useAuth();
  const {
    report: fetchedReport,
    reports: fetchedReports,
    loading: interviewLoading,
    generateReport,
    generateAllReports,
    generateReportById,
  } = useInterview();

  // These values are collected by the preparation form and sent to the API.
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");

  // These flags control the form, loading skeleton, and finished report states.
  const [isPrepared, setIsPrepared] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [activeView, setActiveView] = useState("technical");
  const [resumeDownloadError, setResumeDownloadError] = useState("");
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);

  // Normalize the latest context value on every render so API data drives the UI.
  const report = normalizeReport(fetchedReport);
  const reportHistory = (fetchedReports || []).map(normalizeReport);

  // Loads lightweight summaries for the preparation library.
  useEffect(() => {
    const loadReportHistory = async () => {
      try {
        await generateAllReports();
      } catch (error) {
        setHistoryError(
          error.response?.data?.message ||
            "Saved preparations could not be loaded. Try refreshing the page.",
        );
      } finally {
        setHistoryLoading(false);
      }
    };

    loadReportHistory();
    // The provider owns the request function; this runs once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The provider restores the full report; this opens the report view once ready.
  useEffect(() => {
    if (fetchedReport) {
      setIsPrepared(true);
    }

    if (!interviewLoading && !historyLoading) {
      setIsPreparing(false);
    }
  }, [fetchedReport, historyLoading, interviewLoading]);

  // Submits the candidate data, waits for the backend report, then opens the report view.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setIsPreparing(true);

    try {
      await generateReport(jobDescription, selfDescription, resume);
      setIsPrepared(true);
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          "We could not prepare your interview. Please try again.",
      );
    } finally {
      setIsPreparing(false);
    }
  };

  // Fetches the complete question-level report only when a saved card is opened.
  const handleOpenReport = async (reportId) => {
    setSubmitError("");
    setIsPreparing(true);

    try {
      await generateReportById(reportId);
      setIsPrepared(true);
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          "This preparation could not be opened. Please try again.",
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!report.id) {
      setResumeDownloadError("This preparation does not have a downloadable resume.");
      return;
    }

    setResumeDownloadError("");
    setIsDownloadingResume(true);

    try {
      const pdfBlob = await generateResumePdfByInterviewId(report.id);
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `optimized-resume-${report.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setResumeDownloadError(
        error.response?.data?.message ||
          "The optimized resume could not be generated. Please try again.",
      );
    } finally {
      setIsDownloadingResume(false);
    }
  };

  // Keeps the three report tabs connected to their corresponding API arrays.
  const workspaceContent = {
    technical: {
      eyebrow: "Technical questions",
      title: "Show how you think, not just what you know.",
      description:
        "These prompts are tailored to the role and the experience in your profile.",
      items: report.technicalQuestions,
      type: "question",
    },
    behavioral: {
      eyebrow: "Behavioral questions",
      title: "Make your experience memorable.",
      description:
        "Use the STAR structure to turn your strongest stories into clear answers.",
      items: report.behavioralQuestions,
      type: "question",
    },
    roadmap: {
      eyebrow: "Your roadmap",
      title: "A calm plan for the days ahead.",
      description:
        "Focus your preparation where it will have the greatest effect on your interview.",
      items: report.preparationPlan,
      type: "plan",
    },
  };

  const currentContent = workspaceContent[activeView];

  return (
    <main className="interview-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Prepwise home">
          <span className="brand-mark">P</span>
          <span>prepwise</span>
        </a>
        <div className="topbar-meta">
          <span className="status-dot" aria-hidden="true" />
          <span>{user?.username || "Your workspace"}</span>
          <button className="avatar" type="button" aria-label="Open profile">
            {(user?.username || "Y").charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {isPreparing ? (
        <ReportSkeleton />
      ) : !isPrepared ? (
        <>
          <section className="interview-intro">
            <div>
              <p className="section-kicker">Interview workspace / 01</p>
              <h1>Turn your experience into a sharper interview.</h1>
              <p className="intro-copy">
                Bring the role and your story together. We will shape the
                preparation around the opportunity you actually want.
              </p>
            </div>
            <div className="intro-note">
              <span className="note-number">01</span>
              <span>Candidate profile</span>
            </div>
          </section>

          <form className="interview-form" onSubmit={handleSubmit}>
            <section className="form-section resume-section">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Your foundation</p>
                  <h2>Resume</h2>
                </div>
                <span className="step-label">Required</span>
              </div>

              <label
                className={`resume-dropzone${resume ? " has-file" : ""}`}
                htmlFor="resume-upload"
              >
                <input
                  id="resume-upload"
                  name="resume"
                  type="file"
                  accept=".pdf,application/pdf"
                  required
                  onChange={(event) =>
                    setResume(event.target.files?.[0] || null)
                  }
                />
                <span className="upload-icon" aria-hidden="true">
                  ↑
                </span>
                <span className="upload-title">
                  {resume ? resume.name : "Drop your resume here"}
                </span>
                <span className="upload-caption">
                  PDF format · up to 10 MB
                </span>
                <span className="browse-link">
                  {resume ? "Choose a different file" : "Browse files"}
                </span>
              </label>
            </section>

            <section className="form-section details-section">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">The context</p>
                  <h2>Tell us where you are headed</h2>
                </div>
                <span className="step-label">02—03</span>
              </div>

              <div className="field-grid">
                <label className="field-label" htmlFor="job-description">
                  <span>Job description</span>
                  <span className="field-count">
                    {jobDescription.length}/2000
                  </span>
                  <textarea
                    id="job-description"
                    name="jobDescription"
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    placeholder="Paste the role, responsibilities, and requirements..."
                    maxLength={2000}
                    rows={8}
                  />
                </label>

                <label className="field-label" htmlFor="self-description">
                  <span>Self description</span>
                  <span className="field-count">
                    {selfDescription.length}/2000
                  </span>
                  <textarea
                    id="self-description"
                    name="selfDescription"
                    value={selfDescription}
                    onChange={(event) => setSelfDescription(event.target.value)}
                    placeholder="Share your experience, strengths, and the work you are proud of..."
                    maxLength={2000}
                    rows={8}
                  />
                </label>
              </div>
            </section>

            <footer className="form-footer">
              <p>
                {submitError ||
                  "Ready when you are. Your answers stay in this workspace."}
              </p>
              <button className="primary-button" type="submit">
                <span>Prepare my interview</span>
                <span aria-hidden="true">→</span>
              </button>
            </footer>
          </form>
        </>
      ) : (
        <section
          className="report-workspace"
          aria-label="Interview preparation report"
        >
          <header className="report-hero">
            <div className="report-hero-copy">
              <p className="section-kicker">Your interview report / 02</p>
              <h1>{report.title}</h1>
              <p>
                We found the areas that matter most for this role. Start with
                the questions, then use the plan to turn gaps into confidence.
              </p>
            </div>
            <div className="report-score-card">
              <div className="report-score-ring">
                <strong>{report.matchScore}</strong>
                <span>/ 100</span>
              </div>
              <div>
                <span className="report-score-label">Match score</span>
                <strong className="report-score-title">
                  {report.matchScore >= 70
                    ? "Strong starting point"
                    : "Room to grow"}
                </strong>
                <span className="report-score-note">
                  Based on your profile and role fit
                </span>
              </div>
            </div>
          </header>

          <div className="report-layout">
            <main className="report-main">
              {/* Tabs change only the visible report section; all data comes from the API response. */}
              <nav className="report-tabs" aria-label="Report sections">
                {Object.entries(workspaceContent).map(([view, content]) => (
                  <button
                    className={activeView === view ? "active" : ""}
                    type="button"
                    key={view}
                    onClick={() => setActiveView(view)}
                    aria-pressed={activeView === view}
                  >
                    <span>{content.eyebrow}</span>
                    <small>
                      {content.items.length} {content.type === "question" ? "questions" : "steps"}
                    </small>
                  </button>
                ))}
              </nav>

              <section className="report-question-section">
                <div className="report-section-heading">
                  <div>
                    <p className="section-kicker">{currentContent.eyebrow}</p>
                    <h2>{currentContent.title}</h2>
                  </div>
                  <span className="report-section-count">
                    {currentContent.items.length} items
                  </span>
                </div>
                <p className="report-description">
                  {currentContent.description}
                </p>

                {/* Questions expand to reveal their answer and interviewer intent. */}
                <div className="report-question-list">
                  {currentContent.items.map((item, index) =>
                    currentContent.type === "question" ? (
                      <details className="report-question" key={item.question}>
                        <summary>
                          <span className="report-question-index">0{index + 1}</span>
                          <span>{item.question}</span>
                          <span className="report-question-toggle" aria-hidden="true">
                            +
                          </span>
                        </summary>
                        <div className="report-answer">
                          <p>
                            <strong>Suggested answer</strong>
                            {item.answer}
                          </p>
                          <p>
                            <strong>What they are looking for</strong>
                            {item.intention}
                          </p>
                          <button type="button" className="report-practice">
                            Practice this question <span aria-hidden="true">-&gt;</span>
                          </button>
                        </div>
                      </details>
                    ) : (
                      <article
                        className="report-plan-item"
                        key={`${item.day}-${item.text}`}
                      >
                        <span className="report-question-index">0{index + 1}</span>
                        <p>{item.text}</p>
                        <span className="report-plan-check" aria-hidden="true">
                          ○
                        </span>
                      </article>
                    ),
                  )}
                </div>
              </section>
            </main>

            <aside className="report-rail" aria-label="Preparation summary">
              <section className="report-rail-card">
                <div className="report-rail-title">
                  <p className="section-kicker">Focus next</p>
                  <span>{report.skillGap.length} areas</span>
                </div>
                <h2>Close the skill gap.</h2>
                <p>
                  Small, focused practice will make the largest difference
                  before you interview.
                </p>
                <ul className="report-skill-list">
                  {report.skillGap.map(({ skill, action }) => (
                    <li key={skill}>
                      <span>{skill}</span>
                      <b>{action}</b>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="report-rail-card report-plan-card">
                <p className="section-kicker">A simple plan</p>
                <h2>Make time for these.</h2>
                <ol>
                  {report.preparationPlan.map((step) => (
                    <li key={`${step.day}-${step.text}`}>{step.text}</li>
                  ))}
                </ol>
              </section>

              <button
                className="report-edit"
                type="button"
                onClick={() => setIsPrepared(false)}
              >
                <span aria-hidden="true">&lt;-</span> Edit my profile
              </button>
            </aside>
          </div>

          <footer className="optimized-resume-action">
              <div>
                <p className="section-kicker">Ready for the next step?</p>
                <h2>Take your tailored resume with you.</h2>
                {resumeDownloadError && (
                  <p className="optimized-resume-error" role="alert">
                    {resumeDownloadError}
                  </p>
                )}
              </div>
              <button
                className="optimized-resume-button"
                type="button"
                onClick={handleDownloadResume}
                disabled={isDownloadingResume}
              >
                <span>{isDownloadingResume ? "Building resume..." : "Get Optimized Resume"}</span>
                <span aria-hidden="true">↓</span>
              </button>
          </footer>
        </section>
      )}

      {!isPreparing && (
        <PreparationHistory
          reports={reportHistory}
          loading={historyLoading}
          error={historyError}
          onOpen={handleOpenReport}
        />
      )}
    </main>
  );
}

export default InterviewHome;
