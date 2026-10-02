require("dotenv").config();
const app = require("./app");



const connectDB = require("./config/db");

const port = process.env.PORT || 3000;

async function startServer() {
    await connectDB();
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error("Server startup failed", error);
    process.exit(1);
});
