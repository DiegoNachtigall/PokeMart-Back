// routes/compras.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verificaToken, verificaAdmin } from "../middlewares/Auth";

const router = Router();

// Listar todos os carrinhos (admin)
router.get("/", verificaToken, verificaAdmin, async (req, res) => {
  try {
    const carrinhos = await prisma.carrinho.findMany({
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        usuarioId: true,
        produtos: {
          select: {
            produtoId: true,
            quantidade: true,
            preco: true,
          },
        },
        total: true,
      },
    });
    res.status(200).json(carrinhos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar os carrinhos" });
  }
});

// Busca carrinho ativo do usuário logado
router.get("/carrinho", verificaToken, async (req: any, res) => {
  const usuarioId = req.userId;

  try {
    const carrinho = await prisma.carrinho.findFirst({
      where: { usuarioId },
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
            preco: true,
          },
        },
        total: true,
      },
    });
    res.status(200).json(carrinho);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar o carrinho" });
  }
});

// Adicionar produto ao carrinho
router.post("/adicionar/:produtoId", verificaToken, async (req: any, res) => {
  const { quantidade } = req.body;
  const { produtoId } = req.params;
  const usuarioId = req.userId;

  if (!produtoId || !quantidade) {
    return res.status(400).json({ erro: "Informe todos os dados" });
  }

  if (quantidade <= 0) {
    return res.status(400).json({ erro: "Quantidade deve ser maior que zero" });
  }

  try {
    const produto = await prisma.produto.findUnique({
      where: { id: Number(produtoId) },
    });

    if (!produto || produto.deleted) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    const carrinho = await prisma.carrinho.findFirst({
      where: { usuarioId },
      select: { id: true },
    });

    if (!carrinho) {
      return res.status(404).json({ erro: "Carrinho não encontrado" });
    }

    const carrinhoProduto = await prisma.carrinho_produto.findFirst({
      where: { carrinhoId: carrinho.id, produtoId: Number(produtoId) },
      select: { id: true, quantidade: true },
    });

    // Valida estoque considerando o que já está no carrinho
    const quantidadeNoCarrinho = carrinhoProduto?.quantidade ?? 0;
    if (produto.estoque < quantidadeNoCarrinho + quantidade) {
      return res.status(400).json({
        erro: `Estoque insuficiente. Disponível: ${produto.estoque - quantidadeNoCarrinho}`,
      });
    }

    if (carrinhoProduto) {
      const [carrinho_produto] = await prisma.$transaction([
        prisma.carrinho_produto.update({
          where: { id: carrinhoProduto.id },
          data: { quantidade: { increment: quantidade } },
        }),
        prisma.carrinho.update({
          where: { id: carrinho.id },
          data: { total: { increment: Number(produto.preco) * quantidade } },
        }),
        prisma.produto.update({
          where: { id: Number(produtoId) },
          data: { estoque: { decrement: quantidade } },
        }),
      ]);
      res.status(201).json(carrinho_produto);
    } else {
      const [carrinho_produto] = await prisma.$transaction([
        prisma.carrinho_produto.create({
          data: {
            carrinhoId: carrinho.id,
            produtoId: Number(produtoId),
            quantidade,
            preco: Number(produto.preco) * quantidade,
          },
        }),
        prisma.carrinho.update({
          where: { id: carrinho.id },
          data: { total: { increment: Number(produto.preco) * quantidade } },
        }),
        prisma.produto.update({
          where: { id: Number(produtoId) },
          data: { estoque: { decrement: quantidade } },
        }),
      ]);
      res.status(201).json(carrinho_produto);
    }
  } catch (error) {
    res.status(500).json({ erro: "Erro ao adicionar produto ao carrinho" });
  }
});

// Remover produto do carrinho (devolve ao estoque)
router.delete("/remover/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params;

  try {
    const produtoCarrinho = await prisma.carrinho_produto.findUnique({
      where: { id: Number(id) },
    });

    if (!produtoCarrinho) {
      return res.status(404).json({ erro: "Item não encontrado no carrinho" });
    }

    const [carrinho_produto] = await prisma.$transaction([
      prisma.carrinho_produto.delete({ where: { id: Number(id) } }),
      prisma.carrinho.update({
        where: { id: produtoCarrinho.carrinhoId },
        data: { total: { decrement: Number(produtoCarrinho.preco) } },
      }),
      prisma.produto.update({
        where: { id: produtoCarrinho.produtoId },
        data: { estoque: { increment: produtoCarrinho.quantidade } },
      }),
    ]);

    res.status(200).json(carrinho_produto);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao remover produto do carrinho" });
  }
});

// Finalizar compra, cria um pedido com os itens selecionados e os remove do carrinho
router.post("/finalizar", verificaToken, async (req: any, res) => {
  const usuarioId = req.userId;
  const { itensSelecionados }: { itensSelecionados: number[] } = req.body;

  if (!itensSelecionados || itensSelecionados.length === 0) {
    return res.status(400).json({ erro: "Selecione ao menos um item para finalizar a compra" });
  }

  try {
    const carrinho = await prisma.carrinho.findFirst({
      where: { usuarioId },
      include: { produtos: true },
    });

    if (!carrinho) {
      return res.status(404).json({ erro: "Carrinho não encontrado" });
    }

    // Filtra apenas itens que pertencem ao carrinho do usuário (segurança)
    const itensDoCarrinho = carrinho.produtos.filter((p) =>
      itensSelecionados.includes(p.id)
    );

    if (itensDoCarrinho.length === 0) {
      return res.status(400).json({ erro: "Nenhum item válido selecionado" });
    }

    const totalPedido = itensDoCarrinho.reduce(
      (acc, item) => acc + Number(item.preco),
      0
    );

    // Tudo em uma transação:
    // 1. Cria o pedido
    // 2. Cria os pedido_produto
    // 3. Remove os itens do carrinho
    // 4. Atualiza o total do carrinho
    const pedido = await prisma.$transaction(async (tx) => {
      const novoPedido = await tx.pedido.create({
        data: {
          usuarioId,
          total: totalPedido,
          produtos: {
            create: itensDoCarrinho.map((item) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              preco: item.preco,
            })),
          },
        },
        include: { produtos: true },
      });

      await tx.carrinho_produto.deleteMany({
        where: { id: { in: itensDoCarrinho.map((i) => i.id) } },
      });

      await tx.carrinho.update({
        where: { id: carrinho.id },
        data: { total: { decrement: totalPedido } },
      });

      return novoPedido;
    });

    res.status(201).json({
      mensagem: "Pedido realizado com sucesso!",
      pedido,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao finalizar a compra" });
  }
});

export default router;