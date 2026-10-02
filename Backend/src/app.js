const express = require("express");

const app = express();
const cors = require("cors");
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://jobprep-d4ukdyumf-zahidxtechie.vercel.app",
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
}));
app.use(express.json());
const cookieParser = require("cookie-parser");

app.use(cookieParser());
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");
app.use("/api/auth", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
}, authRouter);

app.use("/api/interview", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
}, interviewRouter);

app.use((err, req, res, next) => {
    console.error(`${req.method} ${req.originalUrl} failed`, err);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || err.status || 500;
    return res.status(statusCode).json({
        message: "Request failed",
        error: err.message || "Unexpected server error",
    });
});

module.exports = app;