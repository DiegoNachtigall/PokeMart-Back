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
    res.status(401).json({ erro: mensaPadrao });
    return;
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuario == null) {
      res.status(401).json({ erro: mensaPadrao });
      return;
    }
    // Verifica se o usuario está bloqueado
    if (usuario.blocked == true) {
      res.status(403).json({ erro: "Usuário bloqueado, entre em contato com o setor responsavel para efetuar o desbloqueio da conta" });
      return;
    }
    // se o e-mail existe, faz-se a comparação dos hashs
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha)
    if (senhaCorreta) {

      const acessToken = jwt.sign(
        {
          userId: usuario.id,
          userName: usuario.nome,
          admin: usuario.admin
        },
        
        process.env.JWT_ACCESS_KEY as string,
        { expiresIn: "1h" }
      );

      const refreshToken = jwt.sign(
        {
          userId: usuario.id,
          userName: usuario.nome,
        },
        process.env.JWT_REFRESH_KEY as string,
        { expiresIn: "30d" }
      );

      const hashRefreshToken = await bcrypt.hashSync(refreshToken, 10);

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
          data: { tentativasLogin: { set: 0 } }
        }),
        prisma.sessao.create({
          data: {
            refreshToken: hashRefreshToken,
            usuarioId: usuario.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
          }
        })
      ]);
      
      res
        .cookie("accessToken", acessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 1000 * 60 * 60,
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 1000 * 60 * 60 * 24 * 30,
        })
        .status(200).json({
          id: usuario.id,
          nome: usuario.nome,
          imagem: usuario.imagem,
          admin: usuario.admin,
          email: usuario.email
        });

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
          data: { tentativasLogin: { increment: 1 } }
        }),

      ]);

      if ((usuario.tentativasLogin + 1) >= 3) {
        mensaPadrao = "Usuário bloqueado, entre em contato com o setor responsavel para efetuar o desbloqueio da conta";
        await prisma.usuario.update({
          where: { id: usuario.id, tentativasLogin: { gte: 3 } },
          data: { blocked: true }
        })
      }


      res.status(401).json({ erro: mensaPadrao });
    }
  } catch (error) {
    res.status(500).json({ erro: "erro interno do servidor" });
  }
});


export default router;
