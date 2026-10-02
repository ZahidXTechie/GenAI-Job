import { useContext } from "react";
import { interviewContext } from "./interview.context.jsx";
import { generateInterviewReport, generateinterviewReportById, generateAllinterviewReports } from "./services/interview.api.js";


export const useInterview = ()=>{
    const context = useContext(interviewContext);
    if(!context){
        throw new Error("useInterview must be used within an InterviewProvider");
    }
    const {loading, setLoading, report, setReport, reports, setReports} = context;
    const generateReport = async (jobDescription, selfDescription, resumeFile)=>{
        setLoading(true);
        try{
            const response = await generateInterviewReport(resumeFile, jobDescription, selfDescription);
            setReport(response.interviewreport);
            window.localStorage.setItem("prepwise-interview-id", response.interviewreport._id);
            return response.interviewreport;
        } catch (error) {
            console.error("Error generating interview report:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const generateReportById = async (interviewId)=>{
        setLoading(true);
        try{
            const response = await generateinterviewReportById(interviewId);
            setReport(response.interviewreport);
            window.localStorage.setItem("prepwise-interview-id", response.interviewreport._id);
            return response.interviewreport;
        } catch (error) {
            console.error("Error generating interview report by ID:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const generateAllReports = async ()=>{
        setLoading(true);
        try{
            const response = await generateAllinterviewReports();
            const interviewReports = response?.interviewreports || response?.interviewReports || [];
            setReports(Array.isArray(interviewReports) ? interviewReports : []);
            return interviewReports;
        } catch (error) {
            console.error("Error generating all interview reports:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };
    return {loading, report, reports, generateReport, generateReportById, generateAllReports};
}