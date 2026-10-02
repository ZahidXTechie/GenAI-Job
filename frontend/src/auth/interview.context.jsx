import { createContext, useEffect, useState } from "react";
import { generateinterviewReportById } from "./services/interview.api.js";

export const interviewContext = createContext();

export const InterviewProvider = ({children})=>{
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [reports, setReports] = useState([]);

    // Restores the last opened report after a browser reload.
    useEffect(() => {
        const restoreReport = async () => {
            const interviewId = window.localStorage.getItem("prepwise-interview-id");

            if (!interviewId) {
                return;
            }

            setLoading(true);
            try {
                const response = await generateinterviewReportById(interviewId);
                setReport(response.interviewreport);
            } catch (error) {
                window.localStorage.removeItem("prepwise-interview-id");
                console.error("Could not restore the saved interview report:", error);
            } finally {
                setLoading(false);
            }
        };

        restoreReport();
    }, []);
    
    return (
        <interviewContext.Provider value={{loading, setLoading, report, setReport, reports, setReports}}>
            {children}
        </interviewContext.Provider>
    )
}