import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import multer from "multer";
import { put } from "@vercel/blob"
import { verificaToken, verificaAdmin } from "../middlewares/Auth";
import { prisma as basePrisma } from "../lib/prisma";

const upload = multer({ storage: multer.memoryStorage() });


const prisma = basePrisma.$extends({
  query: {
    produto: {
      async delete({ args, query }) {
        return basePrisma.produto.update({
          where: args.where,
          data: { deleted: true },
        });
      },
    },
  },
});

const router = Router();

// CRUD
// Read
router.get("/", async (req: any, res) => {

  try {
    const produtos = await prisma.produto.findMany({
      where: { deleted: false },
      orderBy: { id: "asc" },
      include: { marca: true }

    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar os produtos" });
  }

});

// Create
router.post("/", verificaToken, verificaAdmin, upload.single("image"), async (req: any, res) => {
  const { nome, descricao, preco, categorias, marcaId, estoque } = req.body;


  if (!nome || !descricao || !preco || !categorias || !marcaId || !estoque) {
    return res.status(400).json({ erro: "Informe todos os dados" });
  }

  try {
    let fotoPrincipal = "";

    if (req.file) {
      const uploaded = await put(
        `pokemart/produtos/${Date.now()}-${req.file.originalname}`,
        req.file.buffer,
        {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        }
      );
      fotoPrincipal = uploaded.url;
    }

    const produto = await prisma.produto.create({
      data: { nome, descricao, preco, categorias, fotoPrincipal, marcaId, estoque },
    });
    res.status(201).json(produto);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao criar o produto" });
  }
});

// Delete
router.delete("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const produtos = await prisma.produto.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao deletar o produto" });
  }
});

// Update
router.put("/:id", verificaToken, verificaAdmin, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, categorias, marcaId, estoque } = req.body;

  try {
    let fotoPrincipal = "";

    if (req.file) {
      const uploaded = await put(
        `pokemart/produtos/${Date.now()}-${req.file.originalname}`,
        req.file.buffer,
        {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        }
      );
      fotoPrincipal = uploaded.url;
    }
    const produtos = await prisma.produto.update({
      where: { id: Number(id) },
      data: { nome, descricao, preco, categorias, fotoPrincipal, marcaId, estoque },
    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao atualizar o produto" });
  }

});

// Adicionar ao estoque
router.put("/:id/adicionar", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params;
  const { estoque } = req.body;
  try {
    const produtos = await prisma.produto.update({
      where: { id: Number(id) },
      data: { estoque: { increment: estoque } },
    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao adicionar ao estoque" });
  }

});


// Pesquisa
router.get("/pesquisa/:termo", async (req: any, res) => {
  const { termo } = req.params

  // tenta converter o termo em um numero
  const termoNumero = Number(termo)

  // se não é numero, faz a pesquisa normal
  if (isNaN(termoNumero)) {
    try {
      const produtos = await prisma.produto.findMany({
        where: {
          deleted: false,
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { descricao: { contains: termo, mode: "insensitive" } }
          ]
        },
        orderBy: { id: "asc" }
      });
      res.status(200).json(produtos);
    } catch (error) {
      res.status(400).json(error);
    }
  } else {
    try {
      const produtos = await prisma.produto.findMany({
        where: { deleted: false, preco: { gte: termoNumero } },
        orderBy: { id: "asc" }
      });
      res.status(200).json(produtos);
    } catch (error) {
      res.status(400).json({ erro: "Erro ao buscar os produtos" });
    }
  }

});

// Busca por id
router.get("/:id", async (req: any, res) => {
  const { id } = req.params

  try {
    const produto = await prisma.produto.findUnique({
      where: { id: Number(id) },
      include: { marca: true }
    });

    if (!produto || produto.deleted) {
      return res.status(404).json({ erro: "Produto nao encontrado" });
    }

    res.status(200).json(produto);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar o produto" });
  }
});

// filtro por marca
router.get("/filtro/marca/:id", async (req: any, res) => {
  const { id } = req.params
  const marcaId = Number(id)

  try {

    const produtos = await prisma.produto.findMany({
      where: {
        deleted: false,
        ...(isNaN(marcaId) ? {} : { marcaId })
      },
      orderBy: { id: "asc" }
    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao filtrar os produtos" });
  }
});

export default router;
