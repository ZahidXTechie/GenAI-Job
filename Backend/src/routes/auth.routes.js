
const {registerController,loginController,logoutController,getMeController} = require("../controllers/auth.controller");
const authUser = require("../middlewares/auth.middleware");
const {Router} = require("express");
const authRouter = Router();

authRouter.post("/register",registerController);

authRouter.post("/login",loginController);

authRouter.get("/logout",authUser,logoutController);

authRouter.get("/get-me",authUser,getMeController);

module.exports = authRouter;
