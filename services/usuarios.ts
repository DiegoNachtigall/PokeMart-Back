import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

export function validaSenha(senha: string): string[] {
  const erros: string[] = [];

  if (senha.length < 8)
    erros.push("Senha deve possuir, no mínimo, 8 caracteres");
  if (!/[a-z]/.test(senha))
    erros.push("Senha deve possuir letras minúsculas");
  if (!/[A-Z]/.test(senha))
    erros.push("Senha deve possuir letras maiúsculas");
  if (!/[0-9]/.test(senha))
    erros.push("Senha deve possuir números");
  if (!/[^a-zA-Z0-9]/.test(senha))
    erros.push("Senha deve possuir símbolos");

  return erros;
}

export async function listarUsuarios() {
  return prisma.usuario.findMany({
    where: { deleted: false },
    select: {
      id: true,
      nome: true,
      email: true,
      imagem: true,
      admin: true,
    },
  });
}

export async function buscarUsuarioPorId(id: string) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      imagem: true,
      admin: true,
    },
  });
}

export async function criarUsuario(
  nome: string,
  email: string,
  senha: string,
  imagem?: string
) {
  const emailNormalizado = email.toLowerCase().trim();
  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(senha, salt);

  // Cria o usuário e já cria o carrinho vinculado na mesma transação
  const [usuario] = await prisma.$transaction([
    prisma.usuario.create({
      data: { nome, email: emailNormalizado, senha: hash, imagem },
    }),
    prisma.carrinho.create({
      data: { usuario: { connect: { email: emailNormalizado } } },
    }),
  ]);

  return usuario;
}

export async function atualizarUsuario(
  id: string,
  dados: { nome?: string; email?: string; imagem?: string }
) {
  return prisma.usuario.update({
    where: { id },
    data: dados,
  });
}

export async function deletarUsuario(id: string) {
  return prisma.usuario.delete({ where: { id } });
}

export async function tornarAdmin(userId: string) {
  return prisma.usuario.update({
    where: { id: userId },
    data: { admin: true },
  });
}

export async function desbloquearUsuario(userId: string) {
  return prisma.usuario.update({
    where: { id: userId },
    data: { blocked: false, tentativasLogin: 0 },
  });
}

export async function mudarSenha(id: string, senhaNova: string) {
  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(senhaNova, salt);

  return prisma.usuario.update({
    where: { id },
    data: { senha: hash },
  });
}