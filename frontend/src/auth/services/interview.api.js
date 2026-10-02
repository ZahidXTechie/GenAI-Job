import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/',
    withCredentials: true,
})

const generateInterviewReport = async (resumeFile, jobDescription, selfDescription) => {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);
    formData.append('selfDescription', selfDescription);

    const response = await api.post('/api/interview', formData)
    return response.data;
}

const generateinterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/${interviewId}`)
    return response.data;
}

const generateAllinterviewReports = async () => {
    const response = await api.get('/api/interview')
    return response.data;
}

const generateResumePdfByInterviewId = async (interviewId) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewId}`, null, {
        responseType: 'blob',
    });
    return response.data;
}

export {generateInterviewReport, generateinterviewReportById, generateAllinterviewReports, generateResumePdfByInterviewId};