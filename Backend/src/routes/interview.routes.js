const express = require("express");
const interviewRouter = express.Router();
const authUser = require("../middlewares/auth.middleware.js");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware.js");



/*
    @route   GET /interview
    @desc    Get interview report by providing job description, self description, and resume
    @access  Private
*/

interviewRouter.post("/", authUser, upload.single("resume"), interviewController.getInterviewReport);


/*
    @route   GET /interview/:id
    @desc    Get interview report by id
    @access  Private
*/
interviewRouter.get("/:interviewId", authUser, interviewController.getinterviewReportById);

/*
    @route   GET /interview
    @desc    Get all interview reports for the authenticated user
    @access  Private
*/
interviewRouter.get("/", authUser, interviewController.getAllinterviewReports);

/*
    @route   POST /interview/resume/pdf/:interviewId
    @desc    Generate a PDF of the resume for a specific interview
    @access  Private
*/
interviewRouter.post("/resume/pdf/:interviewId", authUser, interviewController.getResumePdfByInterviewId);

module.exports = interviewRouter;