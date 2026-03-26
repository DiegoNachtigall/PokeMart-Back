import { prisma as basePrisma } from "../lib/prisma";
import { uploadImagem } from "../utils/uploadImagem";
import { Categoria } from "@prisma/client";

// Prisma Extension para soft delete de produtos
const prisma = basePrisma.$extends({
  query: {
    produto: {
      async delete({ args }) {
        return basePrisma.produto.update({
          where: args.where,
          data: { deleted: true },
        });
      },
    },
  },
});

export async function listarProdutos() {
  return prisma.produto.findMany({
    where: { deleted: false },
    orderBy: { id: "asc" },
    include: { marca: true },
  });
}

export async function buscarProdutoPorId(id: number) {
  return prisma.produto.findUnique({
    where: { id },
    include: { marca: true },
  });
}

export async function criarProduto(
  dados: {
    nome: string;
    descricao: string;
    preco: number;
    categorias: Categoria[];
    marcaId: number;
    estoque: number;
  },
  arquivo?: Express.Multer.File
) {
  let fotoPrincipal = "";

  if (arquivo) {
    fotoPrincipal = await uploadImagem({ pasta: "produtos", arquivo });
  }

  return prisma.produto.create({
    data: { ...dados, fotoPrincipal },
  });
}

export async function atualizarProduto(
  id: number,
  dados: {
    nome?: string;
    descricao?: string;
    preco?: number;
    categorias?: Categoria[];
    marcaId?: number;
    estoque?: number;
  },
  arquivo?: Express.Multer.File
) {
  let fotoPrincipal: string | undefined = undefined;

  if (arquivo) {
    fotoPrincipal = await uploadImagem({ pasta: "produtos", arquivo });
  }

  return prisma.produto.update({
    where: { id },
    data: {
      ...dados,
      ...(fotoPrincipal && { fotoPrincipal }),
    },
  });
}

export async function atualizarFoto(id: number, arquivo: Express.Multer.File) {
  const url = await uploadImagem({ pasta: "produtos", arquivo });

  return prisma.produto.update({
    where: { id },
    data: { fotoPrincipal: url },
  });
}

export async function deletarProduto(id: number) {
  return prisma.produto.delete({ where: { id } });
}

export async function adicionarEstoque(id: number, quantidade: number) {
  return prisma.produto.update({
    where: { id },
    data: { estoque: { increment: quantidade } },
  });
}

export async function pesquisarProdutos(termo: string) {
  const termoNumero = Number(termo);

  return prisma.produto.findMany({
    where: isNaN(termoNumero)
      ? {
          deleted: false,
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { descricao: { contains: termo, mode: "insensitive" } },
          ],
        }
      : {
          deleted: false,
          preco: { gte: termoNumero },
        },
    orderBy: { id: "asc" },
  });
}

export async function filtrarPorMarca(marcaId: number) {
  return prisma.produto.findMany({
    where: {
      deleted: false,
      ...(isNaN(marcaId) ? {} : { marcaId }),
    },
    orderBy: { id: "asc" },
  });
}