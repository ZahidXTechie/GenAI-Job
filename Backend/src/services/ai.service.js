const { GoogleGenAI } = require("@google/genai");
const {z} = require("zod/v3");
const {zodToJsonSchema} = require("zod-to-json-schema");
require("dotenv").config();
const puppeteer = require("puppeteer");
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY, 
});

const interviewReportSchema = z.object({
    matchScore:z.number().describe("The match score is a numerical value that indicates how well the candidate's qualifications, skills, and experience align with the requirements of the job. It is typically expressed as a percentage or a score out of a certain maximum value, such as 100. A higher match score suggests a stronger alignment between the candidate and the job, while a lower score indicates a weaker fit. This score can be used by employers to quickly assess the suitability of candidates for a particular role."),
    technicalQuestions:z.array(z.object({
        question:z.string().describe("The technical can be question asked in the interview"),
        intention:z.string().describe("The intent of the interviewer behind asking the question"),
        answer:z.string().describe("How to answer the question , what point to cover, what approach to take ")
    
})),
    behavioralQuestions:z.array(z.object({
        question:z.string().describe("The behavioral can be question asked in the interview"),
        intention:z.string().describe("The intent of the interviewer behind asking the question"),
        answer:z.string().describe("How to answer the question , what point to cover, what approach to take ")
    })),
    skillGaps:z.array(z.object({
        skill:z.string().describe(""),
        severity:z.string().describe(""),
    })),
    preparationPlan:z.array(z.object({
        day:z.number().describe(""),
        focus:z.string().describe(""),
        tasks:z.string().describe("")

    })),
    title:z.string().describe("The title of Job position for which the interview report is generated")

})

async function generateInterviewReport({jobDescription, resume, selfDescription}) {

    const prompt = `Generate an interview report based on the following information:
Job Description: ${jobDescription}
Resume: ${resume}
Self Description: ${selfDescription}
`
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config:{
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema)
        }
    })  
    const report = interviewReportSchema.parse(JSON.parse(response.text));
    
    return report;
}


async function generateResumeHtml({resume, jobDescription, selfDescription}) {
    const prompt = `Create a polished, ATS-friendly resume as a complete HTML document.
Return only valid HTML, with no Markdown fences or explanation. Use inline or embedded CSS so the document renders correctly in a browser and prints cleanly to PDF. Do not invent personal details, employers, dates, education, skills, or achievements; only improve organization and wording using the supplied information.
It should not look like Ai generated content. Use a professional, modern design with clear headings, sections, and formatting. Ensure the resume is concise, well-structured, and highlights the candidate's strengths and relevant experience.
Use strategic highlighting to emphasize key information and make the content more engaging.


Resume: ${resume || "Not provided"}
Target job description: ${jobDescription || "Not provided"}
Additional candidate description: ${selfDescription || "Not provided"}`;

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "text/plain",
        },
    });

    const html = response.text.trim().replace(/^```html\s*/i, "").replace(/\s*```$/i, "");
    if (!html.toLowerCase().includes("<html")) {
        throw new Error("AI did not return a complete resume HTML document");
    }

    return html;
}

async function generateResumePdf(html) {
    if (typeof html !== "string" || !html.trim()) {
        throw new TypeError("Resume HTML must be a non-empty string");
    }

    const browser = await puppeteer.launch({headless: true});
    try {
        const page = await browser.newPage();
        await page.setContent(html, {waitUntil: "networkidle0"});
        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: true,
            margin: {
                top: "12mm",
                right: "12mm",
                bottom: "15mm",
                left: "12mm",
            },
        });
        return Buffer.from(pdf);
    } finally {
        await browser.close();
    }
}


    

module.exports = {generateInterviewReport, generateResumeHtml, generateResumePdf};


