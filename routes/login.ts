import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const router = Router();

router.post("/", async (req, res) => {
  const { email, senha } = req.body;

  // em termos de segurança, o recomendado é exibir uma mensagem padrão
  // a fim de evitar de dar "dicas" sobre o processo de login para hackers
  var mensaPadrao = "Login ou senha incorretos";

  if (!email || !senha) {
    // res.status(400).json({ erro: "Informe e-mail e senha do usuário" })
    res.status(400).json({ erro: mensaPadrao });
    return;
  }

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { email },
    });

    if (usuario == null) {
      // res.status(400).json({ erro: "E-mail inválido" })
      res.status(400).json({ erro: mensaPadrao });
      return;
    }
    // Verifica se o usuario está bloqueado
    if (usuario.blocked == true) {
      res.status(400).json({ erro: "Usuário bloqueado, entre em contato com o setor responsavel para efetuar o desbloqueio da conta" });
      return;
    }
    // se o e-mail existe, faz-se a comparação dos hashs
    if (bcrypt.compareSync(senha, usuario.senha)) {
      // se confere, gera e retorna o token
      const token = jwt.sign(
        {
          userLogadoId: usuario.id,
          userLogadoNome: usuario.nome,
        },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        token
      });

      await prisma.$transaction([
        prisma.log.create({
          data: {
            descricao: `Acesso efetuado com sucesso`,
            complemento: `Usuário: ${usuario.email}`,
            usuarioId: usuario.id,
          }
        }),
        prisma.usuario.update({
          where: { id: usuario.id },
          data: { tentativasLogin: {set: 0}}
        }),
      ]);
    } else {
      // res.status(400).json({ erro: "Senha incorreta" })

      await prisma.$transaction([

      prisma.log.create({
        data: {
          descricao: `Tentativa de acesso invalidada`,
          complemento: `Usuário: ${usuario.email}`,
          usuarioId: usuario.id,
        }
      }),
      prisma.usuario.update({
        where: { id: usuario.id },
        data: { tentativasLogin: {increment: 1}}
      }),
      
    ]);
      
        if (usuario.tentativasLogin >= 3) {
          mensaPadrao = "Usuário bloqueado, entre em contato com o setor responsavel para efetuar o desbloqueio da conta";
          await prisma.usuario.update({
          where: { id: usuario.id , tentativasLogin: {gte: 3}},
          data: { blocked: true }
        })
        }


      res.status(400).json({ erro: mensaPadrao });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
