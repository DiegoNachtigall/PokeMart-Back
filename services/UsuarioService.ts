import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { AppError } from "../utils/errors";

const prisma = new PrismaClient();

interface CriarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  imagem?: string | null;
}


class UsuarioService {

  private validaSenha(senha: string) {

    const erros: string[] = []

    if (senha.length < 8) {
      erros.push("Senha deve possuir, no mínimo, 8 caracteres")
    }

    if (!/[a-z]/.test(senha)) {
      erros.push("Senha deve possuir letras minúsculas")
    }
    if (!/[A-Z]/.test(senha)) {
      erros.push("Senha deve possuir letras maiúsculas")
    }
    if (!/[0-9]/.test(senha)) {
      erros.push("Senha deve possuir números")
    }
    if (!/[^a-zA-Z0-9]/.test(senha)) {
      erros.push("Senha deve possuir símbolos")
    }

    return erros
  }

  async listarTodos() {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        imagem: true,
        admin: true
      }
    });
    return usuarios;
  }

  async criar(data: CriarUsuarioDTO): Promise<{ id: string, email: string }> {
    const { nome, email, senha, imagem } = data

    const erros = this.validaSenha(senha)

    if (erros.length > 0) {
      throw new AppError('Senha inválida', 400, erros)
    }

    const emailNormalizado = email.toLowerCase().trim()
    const salt = await bcrypt.genSaltSync(12)
    const hash = await bcrypt.hashSync(senha, salt)

    try {

      const [usuario] = await prisma.$transaction([
        prisma.usuario.create({
          data: { 
            nome,
            email: emailNormalizado, 
            senha: hash,
            imagem: imagem ?? undefined
          }
        }),
        prisma.carrinho.create({
          data: { usuario: { connect: { email: emailNormalizado }} }
        })
      ])

      return { id: usuario.id, email: usuario.email }
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AppError('Email ja cadastrado', 400)
      }
      throw new AppError('Erro interno do servidor', 500)
    }
  }

}

export default new UsuarioService();