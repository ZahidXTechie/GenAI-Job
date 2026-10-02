const jwt = require("jsonwebtoken");
const blacklistModel = require("../models/blacklist.model");

async function authUser(req, res, next) {
	
	const token = req.cookies?.token 
	;

	if (!token) {
		return res.status(401).json({ message: "Authentication token is required" });
	}

	try {
		const isblacklistedToken = await blacklistModel.findOne({ token });
		if (isblacklistedToken) {
			return res.status(401).json({ message: "Token is Invalid" });
		}
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		req.token = token;
		next();
	} catch (err) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
}

module.exports = authUser;
