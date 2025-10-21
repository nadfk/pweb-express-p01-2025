import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";
import dotenv from "dotenv";
import { verifyToken, AuthRequest } from "../middlewares/authMiddleware";

dotenv.config();

const router = Router();
const SALT_ROUNDS = 10;

//USER REGIST
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    if(!username || !email || !password) {
        return res.status(400).json({message: "username, email, and password are required"});
    }

    try {
        const existingUser = await prisma.user.findFirst({
            where: {OR: [{ username }, { email }] },
        });
        if (existingUser) return res.status(409).json({message: "Username or email already exist"});

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: { username, email, password: hashedPassword},
            select: { id: true, username: true, email: true, created_at: true},
        });

        return res.status(201).json({message: "User registered successfully", data: user});
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "Internal server error"});
    }
});

//USER LOGIN
router.post("/login", async (req , res ) => {
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({message: "Username and password required"});

    try {
        const user = await prisma.user.findUnique({ where: {username}});
        if(!user) return res.status(401).json({message: "Invalid credentials"});

        const match = await bcrypt.compare(password, user.password);
        if(!match) return res.status(401).json({message: "Invalid credentials"});

        const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET!, {expiresIn: "8h"});

        return res.json({
            access_token: token,
            token_type: "Bearer",
            expires_in: 8 * 3600,
        });
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "Internal server error"});
    }
});

//GET ME

router.get("/me", verifyToken, async (req: AuthRequest, res)=> {
    try {
        const user = await prisma.user.findUnique({
            where: {id: req.user!.id},
            select: {id: true, username: true, email: true, created_at: true},
        });
        if(!user) return res.status(404).json({ message: "User not found"});

        return res.json({data: user });
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "Internal server error"});
    }
});

export default router;