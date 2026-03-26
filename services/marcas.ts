import { prisma } from "../lib/prisma";
import { uploadImagem } from "../utils/uploadImagem";

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

export async function criarMarca(
  nome: string,
  arquivo?: Express.Multer.File
) {
  if (!nome || !arquivo) {
    throw { status: 400, mensagem: "Informe todos os dados" };
  }

  let foto = "";

  if (arquivo) {
    foto = await uploadImagem({ pasta: "marcas", arquivo });
  }

  return prisma.marca.create({ data: { nome, foto } });
}

export async function atualizarMarca(id: number, dados: { nome: string, imagem?: string }, arquivo?: Express.Multer.File) {

  const { nome } = dados;

  await buscarMarcaPorId(id); // garante que existe antes de atualizar

  let foto = "";

  if (arquivo) {
    dados.imagem = await uploadImagem({ pasta: "marcas", arquivo });
  }

  return prisma.marca.update({
    where: { id },
    data: dados,
  });
}

export async function deletarMarca(id: number) {
  await buscarMarcaPorId(id); // garante que existe antes de deletar

  return prisma.marca.delete({ where: { id } });
}