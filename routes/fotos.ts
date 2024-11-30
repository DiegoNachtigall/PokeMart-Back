
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const prisma = new PrismaClient();
const router = Router();

// Read
router.get("/", async (req: any, res) => {
    const foto = await prisma.foto.findMany();
    res.status(200).json(foto);
});

// Create
router.post("/", upload.single("codigo"), async (req: any, res) => {
    const { descricao, produtoId } = req.body;
    const codigo = req.file?.buffer.toString("base64");

    if (!codigo || !produtoId || !descricao) {
        res.status(400).json({ erro: "Informe todos os dados" });
        return;
    }

    try {
        const foto = await prisma.foto.create({
            data: { descricao, produtoId: Number(produtoId), codigo: codigo as string },
        });
        res.status(201).json(foto);
    } catch (error) {
        res.status(400).json(error);
    }
});

// Delete
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const foto = await prisma.foto.delete({
            where: { id: Number(id) },
        });
        res.status(200).json(foto);
    } catch (error) {
        res.status(400).json(error);
    }
});

// Update
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { descricao, produtoId } = req.body;

    try {
        const foto = await prisma.foto.update({
            where: { id: Number(id) },
            data: { descricao, produtoId: Number(produtoId) },
        });

        res.status(200).json(foto);
    } catch (error) {
        res.status(400).json(error);
    }
});

export default router;