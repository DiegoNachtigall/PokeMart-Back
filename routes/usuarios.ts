import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

const prisma = new PrismaClient()
const router = Router()

router.get("/", async (req, res) => {
  

  const usuarios = await prisma.usuario.findMany()
  res.status(200).json(usuarios)

})

function validaSenha(senha: string) {

  const mensa: string[] = []

  // .length: retorna o tamanho da string (da senha)
  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }

  // contadores
  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  // senha = "abc123"
  // letra = "a"

  // percorre as letras da variável senha
  for (const letra of senha) {
    // expressão regular
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0 || grandes == 0 || numeros == 0 || simbolos == 0) {
    mensa.push("Erro... senha deve possuir letras minúsculas, maiúsculas, números e símbolos")
  }

  if (mensa.length > 0) {
    return true
  }

  return false
}

router.post("/", async (req, res) => {
  const { nome, email, senha, imagem } = req.body

  if (!nome || !email || !senha) {
    res.status(400).json({ erro: "Informe nome, email e senha" })
    return
  }

  if (validaSenha(senha)) {
    res.status(400).json({ erro: "Erro... senha deve possuir letras minúsculas, maiúsculas, números e símbolos" })
    return
  }

  // verifica se o email já está cadastrado
  const usuarioCadastrado = await prisma.usuario.findFirst({
    where: { email }
  })

  if (usuarioCadastrado) {
    res.status(400).json({ erro: "E-mail já cadastrado" })
    return
  }


  // 12 é o número de voltas (repetições) que o algoritmo faz
  // para gerar o salt (sal/tempero)
  const salt = bcrypt.genSaltSync(12)
  // gera o hash da senha acrescida do salt
  const hash = bcrypt.hashSync(senha, salt)

  // para o campo senha, atribui o hash gerado
  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash, imagem }
    })
    const carrinho = await prisma.carrinho.create({
      data: { usuarioId: usuario.id }
    })
    res.status(201).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Efetua a exclusão de um Usuário
router.delete("/:id", async (req, res) => {
  const { id } = req.params

  const carrinho1 = await prisma.carrinho.findFirst({
    where: { usuarioId: id }
  })

  try {
    const [usuario, carrinho, produto_carrinho] = await prisma.$transaction([
      prisma.carrinho_produto.deleteMany({
        where: { carrinhoId: carrinho1?.id }
      }),
      prisma.carrinho.deleteMany({
        where: { usuarioId: id }
      }),
      prisma.log.deleteMany({
        where: { usuarioId: id }
      }),
      prisma.usuario.delete({
        where: { id: id }
      }),
    ])
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params
  const { nome, email, imagem, admin } = req.body
  try {
    const usuario = await prisma.usuario.update({
      where: { id: id },
      data: { nome, email, imagem, admin }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }

})

router.put("/admin/:id", async (req, res) => {
  const { id } = req.params
  try {
    const usuario = await prisma.usuario.update({
      where: { id: id },
      data: { admin: true }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }

})

// Efetua o Desbloqueio de um Usuário
router.put("/desbloquear/:id", async (req, res) => {
  const { id } = req.params

  try {
    const usuario = await prisma.usuario.update({
      where: { id: id },
      data: { blocked: false, tentativasLogin: 0 }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})


// Efetua a mudança de senha de um usuário
router.put("/mudarsenha/:id", async (req, res) => {
  const { id } = req.params
  const { senhaAntiga, senhaNova } = req.body

  if (!senhaAntiga || !senhaNova) {
    res.status(400).json({ erro: "Informe a senha antiga e a nova senha" })
    return
  }

  const usuario = await prisma.usuario.findFirst({
    where: { id: id }
  })

  if (!usuario) {
    res.status(400).json({ erro: "Usuário não encontrado" })
    return
  }

  if (!bcrypt.compareSync(senhaAntiga, usuario.senha)) {
    res.status(400).json({ erro: "Senha antiga inválida" })
    return
  }

  const erros = validaSenha(senhaNova)

  if (validaSenha(senhaNova)) {
    res.status(400).json({ erro: "Erro... senha deve possuir letras minúsculas, maiúsculas, números e símbolos" })
    return
  }

  const hash = bcrypt.hashSync(senhaNova, 12)

  try {
    const usuario = await prisma.usuario.update({
      where: { id: id },
      data: { senha: hash }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }

})

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
    });

    if (usuario == null) {
      res.status(400).json({ erro: "Não Cadastrado" });
      return;
    } else {
      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        imagem: usuario.imagem,
        admin: usuario.admin
      })
    }

    // Verifica se o usuario está bloqueado
    if (usuario.blocked == true) {
      res.status(400).json({ erro: "Usuário bloqueado, entre em contato com o setor responsavel para efetuar o desbloqueio da conta" });
      return;
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router