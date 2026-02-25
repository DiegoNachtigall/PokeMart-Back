import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { verificaToken, verificaAdmin } from "../middewares/Auth";

const prisma = new PrismaClient()
const router = Router()

router.get("/", verificaToken, verificaAdmin, async (req, res) => {

  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        imagem: true,
        admin: true
      }
    })
    res.status(200).json(usuarios)

  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar os usuários" })
  }

})

function validaSenha(senha: string) {

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

router.post("/", async (req, res) => {
  const { nome, email, senha, imagem } = req.body

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Informe nome, email e senha" })
  }

  const erros = validaSenha(senha)

  if (erros.length > 0) {
    return res.status(400).json({ erro: erros })
  }

  const emailNormalizado = email.toLowerCase().trim()

  // 12 é o número de voltas (repetições) que o algoritmo faz
  // para gerar o salt (sal/tempero)
  const salt = await bcrypt.genSaltSync(12)
  // gera o hash da senha acrescida do salt
  const hash = await bcrypt.hashSync(senha, salt)

  // para o campo senha, atribui o hash gerado
  try {

    const [usuario] = await prisma.$transaction([

      prisma.usuario.create({
        data: { nome, email: emailNormalizado, senha: hash, imagem }
      }),

      prisma.carrinho.create({
        data: { usuario: { connect: { email: emailNormalizado } } }
      })

    ])

    return res.status(201).json({ message: "Cadastro realizado com sucesso!" })
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ erro: "Email ja cadastrado" })
    }

    return res.status(500).json({ erro: "erro interno do servidor" })
  }
})

// Efetua a exclusão de um Usuário
router.delete("/deletar", verificaToken, async (req: any, res) => {
  const id  = req.userId

  try {
    await prisma.usuario.delete({ where: { id: id } })

    return res.status(200).json({ message: "Usuário excluido com sucesso" })

  } catch (error) {
    return res.status(500).json({ erro: "Erro ao excluir o usuário" })
  }
})

router.patch("/atualizar", verificaToken, async (req: any, res) => {
  const id = req.userId
  const { nome, email, imagem } = req.body

  try {
    const usuario = await prisma.usuario.update({
      where: { id: id },
      data: { nome, email, imagem }
    })
    res.status(200).json({
      message: "Usuário atualizado com sucesso"
    })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar o usuário" })
  }

})

router.patch("/admin", verificaToken, verificaAdmin, async (req, res) => {
  const { userId } = req.body
  try {
    await prisma.usuario.update({
      where: { id: userId },
      data: { admin: true }
    })
    res.status(200).json({
      message: "Usuário atualizado com sucesso"
    })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar o usuário" })
  }

})

// Efetua o Desbloqueio de um Usuário
router.patch("/desbloquear", verificaToken, verificaAdmin, async (req, res) => {
  const { userId } = req.body

  try {
    await prisma.usuario.update({
      where: { id: userId },
      data: { blocked: false, tentativasLogin: 0 }
    })
    res.status(200).json({
      message: "Usuário desbloqueado com sucesso"
    })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao desbloquear o usuário" })
  }
})

// Efetua a mudança de senha de um usuário
router.patch("/mudarsenha", verificaToken, async (req: any, res) => {
  
  const { senhaAntiga, senhaNova } = req.body

  const id = req.userId
  
  if (!senhaAntiga || !senhaNova) {
    return res.status(400).json({ erro: "Informe a senha antiga e a nova senha" })
  }

  const usuario = req.usuario

  if (!usuario) {
    return res.status(400).json({ erro: "Usuário não encontrado" })
  }

  if (!bcrypt.compareSync(senhaAntiga, usuario.senha)) {
    return res.status(400).json({ erro: "Senha antiga inválida" })
  }

  const erros = validaSenha(senhaNova)

  if (erros.length > 0) {
    return res.status(400).json({ erro: erros })
  }

  const hash = await bcrypt.hashSync(senhaNova, 12)

  try {
    const usuario = await prisma.usuario.update({
      where: { id: id },
      data: { senha: hash }
    })
    res.status(200).json({
      message: "Senha alterada com sucesso",
      userId: id
    })
  } catch (error) {
    res.status(500).json({ erro: "Erro ao alterar a senha" })
  }

})

router.get("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
    });

    if (usuario == null) {
      return res.status(400).json({ erro: "Não Cadastrado" });
    } else {
      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        imagem: usuario.imagem,
        admin: usuario.admin
      })
    }
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar o usuário" })
  }
});

export default router