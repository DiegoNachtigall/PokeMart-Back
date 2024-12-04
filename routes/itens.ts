import { PrismaClient } from "@prisma/client";
import { Router } from "express";

import { verificaToken } from "../middewares/verificaToken";
import { error } from "console";

const prisma = new PrismaClient();

async function main() {
  /***********************************/
  /* SOFT DELETE MIDDLEWARE */
  /***********************************/
  prisma.$use(async (params, next) => {
    // Check incoming query type
    if (params.model == "produto") {
      if (params.action == "delete") {
        // Delete queries
        // Change action to an update
        params.action = "update";
        params.args["data"] = { deleted: true };
      }
    }
    return next(params);
  });
}
main();

const router = Router();

// CRUD
// Read
router.get("/", async (req: any, res) => {

  const produtos = await prisma.produto.findMany({
    where: { deleted: false },
    orderBy: { id: "asc" },
    include: { marca: true }

  });
  res.status(200).json(produtos);

});

// Create
router.post("/", async (req: any, res) => {
  const { nome, descricao, preco, categorias, fotoPrincipal, marcaId, estoque } = req.body;


  if (!nome || !descricao || !preco || !categorias || !fotoPrincipal || !marcaId || !estoque) {
    res.status(400).json({ erro: "Informe todos os dados" });
    return;
  }

  try {
    const produto = await prisma.produto.create({
      data: { nome, descricao, preco, categorias, fotoPrincipal, marcaId, estoque },
    });
    res.status(201).json(produto);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const produtos = await prisma.produto.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Update
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, categorias, fotoPrincipal, marcaId, estoque } = req.body;

  const produtos = await prisma.produto.update({
    where: { id: Number(id) },
    data: { nome, descricao, preco, categorias, fotoPrincipal, marcaId, estoque },
  });
  res.status(200).json(produtos);

});

// Adicionar ao estoque
router.put("/:id/adicionar", async (req, res) => {
  const { id } = req.params;
  const { estoque } = req.body;
  try {
    const produtos = await prisma.produto.update({
      where: { id: Number(id) },
      data: { estoque: { increment: estoque } },
    });
    res.status(200).json(produtos);
  } catch (error) {
    res.status(400).json(error);
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
            { nome: { contains: termo } },
            { descricao: { contains: termo } }
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
      res.status(400).json(error);
    }
  }

});

router.get("/:id", async (req: any, res) => {

  const { id } = req.params

  const produtos = await prisma.produto.findUnique({
    where: { id: Number(id) },
    include: { marca: true }
  });
  res.status(200).json(produtos);

});

router.get("/filtro/marca/:id", async (req: any, res) => {

  const { id } = req.params

  if (isNaN(id)) {
    const produtos = await prisma.produto.findMany({
      where: { deleted: false },
      orderBy: { id: "asc" }
    });
    res.status(200).json(produtos);
    } else {

  const produtos = await prisma.produto.findMany({
    where: { deleted: false, marcaId: Number(id) },
    orderBy: { id: "asc" }
  });
  res.status(200).json(produtos);

}
});

export default router;
