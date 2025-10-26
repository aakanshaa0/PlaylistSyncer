const { Router } = require("express");
const authRouter = Router();
const { userModel } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const z = require("zod");
const { JWT_SECRET } = require("../config");

authRouter.post("/signup", async function (req, res) {
    const requiredBody = z.object({
        email: z.string().min(3).max(100).email(),
        password: z.string().min(6).max(100),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100)
    });

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    if (!parsedDataWithSuccess.success) {
        return res.status(400).json({
            message: "Incorrect input format",
            error: parsedDataWithSuccess.error
        });
    }

    const { email, password, firstName, lastName } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await userModel.create({
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName
        });
    } 
    catch (e) {
        return res.status(400).json({
            message: "User already exists"
        });
    }

    res.json({
        message: "Signup successful"
    });
});

authRouter.post("/signin", async function (req, res) {
    const requiredBody = z.object({
        email: z.string().email(),
        password: z.string().min(6)
    });

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    if (!parsedDataWithSuccess.success) {
        return res.status(400).json({
            message: "Invalid input format",
            error: parsedDataWithSuccess.error
        });
    }

    const { email, password } = req.body;

    const user = await userModel.findOne({
        email: email
    });

    if (!user) {
        return res.status(403).json({
            message: "Incorrect credentials"
        });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
        const token = jwt.sign({
            id: user._id
        }, JWT_SECRET);
        
        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } 
    else {
        res.status(403).json({
            message: "Incorrect credentials"
        });
    }
});

module.exports = {
    authRouter: authRouter
};