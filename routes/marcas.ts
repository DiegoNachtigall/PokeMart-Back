// routes\marcas.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaAdmin } from "../middewares/verificaAdmin";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// Read
router.get("/", async (req: any, res) => {
    const marcas = await prisma.marca.findMany();
    res.status(200).json(marcas);
});

// Create
router.post("/", verificaToken, verificaAdmin, async (req: any, res) => {
    const { nome, foto } = req.body;

    if (!nome || !foto) {
        return res.status(400).json({ erro: "Informe todos os dados" });
    }

    try {
        const marca = await prisma.marca.create({
            data: { nome, foto },
        });
        res.status(201).json(marca);
    } catch (error) {
        res.status(400).json(error);
    }
});

// Delete
router.delete("/:id", verificaToken, verificaAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const marca = await prisma.marca.delete({
            where: { id: Number(id) },
        });
        res.status(200).json(marca);
    } catch (error) {
        res.status(400).json(error);
    }
});

// Update
router.put("/:id", verificaToken, verificaAdmin, async (req, res) => {
    const { id } = req.params;
    const { nome, foto } = req.body;

    if (!nome || !foto) {
        return res.status(400).json({ erro: "Informe todos os dados" });
    }

    try {
        const marca = await prisma.marca.update({
            where: { id: Number(id) },
            data: { nome, foto },
        });

        res.status(200).json(marca);
    } catch (error) {
        res.status(400).json(error);
    }
});

export default router;