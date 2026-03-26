// routes/pedidos.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verificaToken, verificaAdmin } from "../middlewares/Auth";

const router = Router();

// Listar todos os pedidos (admin)
router.get("/", verificaToken, verificaAdmin, async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, imagem: true },
        },
        produtos: {
          include: {
            produto: {
              select: { id: true, nome: true, fotoPrincipal: true },
            },
          },
        },
      },
    });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar os pedidos" });
  }
});

// Listar pedidos do usuário logado
router.get("/usuario", verificaToken, async (req: any, res) => {
  const usuarioId = req.userId;

  try {
    const pedidos = await prisma.pedido.findMany({
      where: { usuarioId },
      orderBy: { createdAt: "desc" },
      include: {
        produtos: {
          include: {
            produto: {
              select: { id: true, nome: true, fotoPrincipal: true },
            },
          },
        },
      },
    });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar os pedidos" });
  }
});

// Buscar pedido por id
// Usuário só pode ver o próprio pedido; admin vê qualquer um
router.get("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params;
  const usuarioId = req.userId;
  const isAdmin = req.admin;

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, imagem: true },
        },
        produtos: {
          include: {
            produto: {
              select: { id: true, nome: true, fotoPrincipal: true },
            },
          },
        },
      },
    });

    if (!pedido) {
      return res.status(404).json({ erro: "Pedido não encontrado" });
    }

    // Usuário comum só pode ver o próprio pedido
    if (!isAdmin && pedido.usuarioId !== usuarioId) {
      return res.status(403).json({ erro: "Acesso negado" });
    }

    res.status(200).json(pedido);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar o pedido" });
  }
});

// Atualizar status do pedido (admin)
router.patch("/:id/status", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ erro: "Informe o status" });
  }

  const statusValidos = ["Pendente", "Entregue"];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({
      erro: `Status inválido. Use: ${statusValidos.join(", ")}`,
    });
  }

  try {
    const pedido = await prisma.pedido.update({
      where: { id: Number(id) },
      data: { status },
    });
    res.status(200).json(pedido);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar o status do pedido" });
  }
});

export default router;