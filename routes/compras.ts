// routes\carrinhos.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const router = Router();

// Read
router.get("/", async (req: any, res) => {
  const carrinhos = await prisma.carrinho.findMany(
    {
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        usuarioId: true,
        produtos: {
          select: {
            produtoId: true,
            quantidade: true,
            preco: true
          }
        },
        total: true

      }
    }
  );
  res.status(200).json(carrinhos);
});

// Post esta sendo feito direto ao criar um usuario
// // Post
// router.post("/", async (req: any, res) => {
//   const { usuarioId } = req.body;

//   if (!usuarioId) {
//     res.status(400).json({ erro: "Informe todos os dados" });
//     return;
//   }

//   try {
//     const carrinhos = await prisma.carrinho.create({
//       data: { usuarioId: String(usuarioId) },
//     });
//     res.status(201).json(carrinhos);
//   } catch (error) {
//     res.status(400).json(error);
//   }
// });

// Create
router.post("/adicionar/:produtoId", async (req: any, res) => {
  const { usuarioId, quantidade } = req.body
  const { produtoId } = req.params

  if (!usuarioId || !produtoId || !quantidade) {
    res.status(400).json({ erro: "Informe todos os dados" });
    return;
  }

  try {

    const produtoAdd = await prisma.produto.findUnique({
      where: {
        id: Number(produtoId)
      }
    });

    const carrinhoId = await prisma.carrinho.findFirst({
      where: {
        usuarioId: usuarioId
      },
      select: {
        id: true
      }
    });
    // se o produto ja estiver no carrinho, atualiza a quantidade
    const carrinhoProduto = await prisma.carrinho_produto.findFirst({
      where: {
        carrinhoId: Number(carrinhoId?.id),
        produtoId: Number(produtoId)
      },
      select: {
        id: true
      }
    });

    if (carrinhoProduto) {
      const [carrinho_produto, carrinho, produto] = await prisma.$transaction([
        prisma.carrinho_produto.update({ where: { id: Number(carrinhoProduto?.id) }, data: { quantidade: { increment: Number(quantidade) } } }),
        prisma.carrinho.update({ where: { id: Number(carrinhoId?.id) }, data: { total: { increment: Number(produtoAdd?.preco) * Number(quantidade) } } }),
        prisma.produto.update({ where: { id: Number(produtoId) }, data: { estoque: { decrement: Number(quantidade) } } }),
      ]);
      res.status(201).json(carrinho_produto);
    } else {

      const [carrinho_produto, carrinho, produto] = await prisma.$transaction([
        prisma.carrinho_produto.create({ data: { carrinhoId: Number(carrinhoId?.id), produtoId: Number(produtoId), quantidade, preco: (Number(produtoAdd?.preco) * quantidade) } }),
        prisma.carrinho.update({ where: { id: Number(carrinhoId?.id) }, data: { total: { increment: Number(produtoAdd?.preco) * quantidade } } }),
        prisma.produto.update({ where: { id: Number(produtoId) }, data: { estoque: { decrement: quantidade } } }),
      ]);
      res.status(201).json(carrinho_produto);
    }
  } catch (error) {
    res.status(400).json({ erro: "Erro ao enviar os dados" });
  }
});

router.delete("/remover/:id", async (req: any, res) => {
  const { id } = req.params

  try {

    const produtoCarrinho = await prisma.carrinho_produto.findUnique({
      where: {
        id: Number(id)
      }
    });


    const produtoAdd = await prisma.produto.findUnique({
      where: {
        id: Number(produtoCarrinho?.produtoId)
      }
    });



    const [carrinho_produto, carrinho, produto] = await prisma.$transaction([
      prisma.carrinho_produto.delete({ where: { id: Number(id) } }),
      prisma.carrinho.update({ where: { id: Number(produtoCarrinho?.carrinhoId) }, data: { total: { decrement: Number(produtoCarrinho?.preco) } } }),
      prisma.produto.update({ where: { id: Number(produtoCarrinho?.produtoId) }, data: { estoque: { increment: Number(produtoCarrinho?.quantidade) } } }),
    ])
    res.status(201).json(carrinho_produto);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao enviar os dados" });
  }
})

// Busca por id
router.get("/:usuarioId", async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const carrinho = await prisma.carrinho.findFirst({
      where: { usuarioId: String(usuarioId) },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        usuarioId: true,
        produtos: {
          select: {
            id: true,
            carrinhoId: true,
            produtoId: true,
            quantidade: true,
            preco: true
          }
        },
        total: true

      }

    });
    res.status(200).json(carrinho);
  } catch (error) {
    res.status(400).json(error);
  }
})

// Delete
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const carrinho = await prisma.carrinho.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(carrinho);
  } catch (error) {
    res.status(400).json(error);
  }
});





export default router;