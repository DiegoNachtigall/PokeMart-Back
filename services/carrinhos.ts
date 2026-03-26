import { prisma } from "../lib/prisma";

export async function listarCarrinhos() {
  return prisma.carrinho.findMany({
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
}

export async function buscarCarrinho(usuarioId: string) {
  return prisma.carrinho.findFirst({
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
}

export async function adicionarProduto(
  usuarioId: string,
  produtoId: number,
  quantidade: number
) {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
  });

  if (!produto || produto.deleted) {
    throw { status: 404, mensagem: "Produto não encontrado" };
  }

  const carrinho = await prisma.carrinho.findFirst({
    where: { usuarioId },
    select: { id: true },
  });

  if (!carrinho) {
    throw { status: 404, mensagem: "Carrinho não encontrado" };
  }

  const carrinhoProduto = await prisma.carrinho_produto.findFirst({
    where: { carrinhoId: carrinho.id, produtoId },
    select: { id: true, quantidade: true },
  });

  const quantidadeNoCarrinho = carrinhoProduto?.quantidade ?? 0;
  if (produto.estoque < quantidadeNoCarrinho + quantidade) {
    throw {
      status: 400,
      mensagem: `Estoque insuficiente. Disponível: ${produto.estoque - quantidadeNoCarrinho}`,
    };
  }

  if (carrinhoProduto) {
    const [item] = await prisma.$transaction([
      prisma.carrinho_produto.update({
        where: { id: carrinhoProduto.id },
        data: { quantidade: { increment: quantidade } },
      }),
      prisma.carrinho.update({
        where: { id: carrinho.id },
        data: { total: { increment: Number(produto.preco) * quantidade } },
      }),
      prisma.produto.update({
        where: { id: produtoId },
        data: { estoque: { decrement: quantidade } },
      }),
    ]);
    return item;
  } else {
    const [item] = await prisma.$transaction([
      prisma.carrinho_produto.create({
        data: {
          carrinhoId: carrinho.id,
          produtoId,
          quantidade,
          preco: Number(produto.preco) * quantidade,
        },
      }),
      prisma.carrinho.update({
        where: { id: carrinho.id },
        data: { total: { increment: Number(produto.preco) * quantidade } },
      }),
      prisma.produto.update({
        where: { id: produtoId },
        data: { estoque: { decrement: quantidade } },
      }),
    ]);
    return item;
  }
}

export async function removerProduto(itemId: number) {
  const produtoCarrinho = await prisma.carrinho_produto.findUnique({
    where: { id: itemId },
  });

  if (!produtoCarrinho) {
    throw { status: 404, mensagem: "Item não encontrado no carrinho" };
  }

  const [item] = await prisma.$transaction([
    prisma.carrinho_produto.delete({ where: { id: itemId } }),
    prisma.carrinho.update({
      where: { id: produtoCarrinho.carrinhoId },
      data: { total: { decrement: Number(produtoCarrinho.preco) } },
    }),
    prisma.produto.update({
      where: { id: produtoCarrinho.produtoId },
      data: { estoque: { increment: produtoCarrinho.quantidade } },
    }),
  ]);

  return item;
}

export async function finalizarCompra(
  usuarioId: string,
  itensSelecionados: number[]
) {
  const carrinho = await prisma.carrinho.findFirst({
    where: { usuarioId },
    include: { produtos: true },
  });

  if (!carrinho) {
    throw { status: 404, mensagem: "Carrinho não encontrado" };
  }

  // Filtra apenas itens que pertencem ao carrinho do usuário (segurança)
  const itensDoCarrinho = carrinho.produtos.filter((p) =>
    itensSelecionados.includes(p.id)
  );

  if (itensDoCarrinho.length === 0) {
    throw { status: 400, mensagem: "Nenhum item válido selecionado" };
  }

  const totalPedido = itensDoCarrinho.reduce(
    (acc, item) => acc + Number(item.preco),
    0
  );

  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.create({
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

    return pedido;
  });
}