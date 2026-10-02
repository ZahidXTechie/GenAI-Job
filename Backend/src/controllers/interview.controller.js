const pdfParse = require("pdf-parse");
const { generateInterviewReport, generateResumeHtml, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model")

async function getInterviewReport(req, res) {
    const resumeFile = req.file;
    if (!resumeFile) {
        return res.status(400).json({ message: "Resume PDF is required" });
    }

    const parsedResume = await (new pdfParse.PDFParse(Uint8Array.from(resumeFile.buffer))).getText();
    const resumecontent = parsedResume.text;
    const { jobDescription, selfDescription } = req.body;
    const interviewReportByAI = await generateInterviewReport({ resume: resumecontent, jobDescription, selfDescription });
    const interviewreport = await interviewReportModel.create({
        userId: req.user.id,
        resumepdf: resumecontent,
        selfDescription,
        jobdescription: jobDescription,
        matchscore: interviewReportByAI.matchScore,
        technicalQuestions: interviewReportByAI.technicalQuestions.map(({ question, intention, answer }) => ({
            questions: question,
            intention,
            answers: answer,
        })),
        behavioralQuestions: interviewReportByAI.behavioralQuestions.map(({ question, intention, answer }) => ({
            questions: question,
            intention,
            answers: answer,
        })),
        skillGaps: interviewReportByAI.skillGaps.map(({ skill, severity }) => ({
            skill,
            severity: severity.toLowerCase(),
        })),
        preparationPlan: interviewReportByAI.preparationPlan.map(({ day, focus, tasks }) => ({
            days: day,
            focus,
            tasks,
        })),
        title: interviewReportByAI.title

    });
    res.status(201).json({message:"Interview report generated successfully", interviewreport})

    
    

};
const getinterviewReportById = async (req, res) => {
    const { interviewId } = req.params;
    const interviewreport = await interviewReportModel.findById(interviewId);
    if(!interviewreport){
        return res.status(404).json({ message: "Interview report not found" });
    }
    const response = res.status(200).json({ interviewreport });
    return response;

}

const getAllinterviewReports = async (req, res) =>{
    const interviewreports = await interviewReportModel.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .select("-userId -__v -resumepdf -technicalQuestions -behavioralQuestions -skillGaps");
    return res.status(200).json({ interviewreports, message: "All interview reports fetched successfully" });

}

const getResumePdfByInterviewId = async (req, res) => {
    const { interviewId } = req.params;
    const interviewreport = await interviewReportModel.findOne({
        _id: interviewId,
        userId: req.user.id,
    });

    if (!interviewreport) {
        return res.status(404).json({ message: "Interview report not found" });
    }

    const resumeHtml = await generateResumeHtml({
        resume: interviewreport.resumepdf,
        jobDescription: interviewreport.jobdescription,
        selfDescription: interviewreport.selfDescription,
    });
    const resumePdf = await generateResumePdf(resumeHtml);

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume-${interviewId}.pdf"`,
        "Content-Length": resumePdf.length,
    });

    return res.send(resumePdf);
};

module.exports = {
    getInterviewReport,
    getinterviewReportById,
    getAllinterviewReports,
    getResumePdfByInterviewId,
};