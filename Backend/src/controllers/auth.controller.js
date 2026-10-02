const userModel = require("../models/user.model");
const blacklistModel = require("../models/blacklist.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authCookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
};

async function registerController(req,res){

    const {username,email,password} = req.body;
    
    
    if(!username || !email || !password){
        return res.status(400).json({message:"Please provide all required fields"})
    }
    const existingUser = await userModel.findOne({$or:[{username},{email}]});
    if(existingUser){
        return res.status(400).json({message:"User with this username or email already exists"})
    }
    const hash = await bcrypt.hash(password,10);
    const user = await userModel.create({username,email,password:hash});
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"1d"});
    res.cookie("token", token, authCookieOptions);
    res.status(201).json({message:"User registered successfully",user:{
        id:user._id,
        username:user.username,
        email:user.email
    }});
}

async function loginController(req,res){
    const {email,password} = req.body;

    if(!email || !password){
        return res.status(400).json({message:"Please provide email and password"});
    }

    try{
        const user = await userModel.findOne({email});

        if(!user){
            return res.status(401).json({message:"Invalid email or password"});
        }

        const passwordMatches = await bcrypt.compare(password,user.password);

        if(!passwordMatches){
            return res.status(401).json({message:"Invalid email or password"});
        }

        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn:"1d"}
        );

        res.cookie("token", token, authCookieOptions);
        return res.status(201).json({message:"Login successful",user:{
            id:user._id,
            username:user.username,
            email:user.email
        },token});
    }catch(err){
        return res.status(500).json({message:"Login failed",error:err.message});
    }
}

async function logoutController(req, res) {
    try {
        const decodedToken = jwt.decode(req.token);

        await blacklistModel.create({
            token: req.token,
            expiresAt: new Date(decodedToken.exp * 1000)
        });

        res.clearCookie("token", authCookieOptions);
        return res.status(200).json({ message: "Logout successful" });
    } catch (err) {
        

        return res.status(500).json({ message: "Logout failed" });
    }
}

async function getMeController(req, res) {
    try {
        const user = await userModel
            .findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch user details" });
    }
}

module.exports = {registerController,loginController,logoutController,getMeController};