import { Router } from "express";
import prisma from "../prisma/client";

const router = Router();

router.get("/", async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return res.json({status: "ok", database: "disconnected"});
    } catch(err) {
        return res.status(500).json({status: "error", database: "disconnected"});
    }
});

export default router;