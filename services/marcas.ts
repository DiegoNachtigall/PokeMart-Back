import { prisma } from "../lib/prisma";

export async function listarMarcas() {
  return prisma.marca.findMany();
}

export async function buscarMarcaPorId(id: number) {
  const marca = await prisma.marca.findUnique({ where: { id } });

  if (!marca) {
    throw { status: 404, mensagem: "Marca não encontrada" };
  }

  return marca;
}

export async function criarMarca(nome: string, foto: string) {
  if (!nome || !foto) {
    throw { status: 400, mensagem: "Informe todos os dados" };
  }

  return prisma.marca.create({ data: { nome, foto } });
}

export async function atualizarMarca(id: number, nome: string, foto: string) {
  if (!nome || !foto) {
    throw { status: 400, mensagem: "Informe todos os dados" };
  }

  await buscarMarcaPorId(id); // garante que existe antes de atualizar

  return prisma.marca.update({
    where: { id },
    data: { nome, foto },
  });
}

export async function deletarMarca(id: number) {
  await buscarMarcaPorId(id); // garante que existe antes de deletar

  return prisma.marca.delete({ where: { id } });
}