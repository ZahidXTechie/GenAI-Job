require("dotenv").config();
const app = require("./app");



const connectDB = require("./config/db");

connectDB();


const port = process.env.PORT || 3000;

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
})
