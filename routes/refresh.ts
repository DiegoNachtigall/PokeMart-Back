import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const router = Router();

router.post("/", async (req, res) => {

  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(403).json({ erro: "Refresh token não informado" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY as string) as any;
    
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(403).json({ erro: "Refresh token inválido" });
    }

    // encontrar sessão com o usuarioid e refreshtoken
    const sessions = await prisma.sessao.findMany({
      where: {
        usuarioId: decoded.userId
      },
    });

    let sessaoValida = null;

    for (const session of sessions) {
      const match = await bcrypt.compare(refreshToken, session.refreshToken);
      if (match) {
        sessaoValida = session;
        break;
      }
    }

    if (!sessaoValida) {
      return res.status(403).json({ erro: "Refresh token inválido" });
    }

    if(sessaoValida.expiresAt < new Date()) {
      await prisma.sessao.delete({
        where: {
          id: sessaoValida.id
        }
      })

      return res.status(403).json({ erro: "Refresh token expirado" });
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        userName: user.nome,
      },
      process.env.JWT_ACCESS_KEY as string,
      { expiresIn: "1h" }
    );

    const newRefreshToken = jwt.sign(
      {
        userId: user.id,
        userName: user.nome,
      },
      process.env.JWT_REFRESH_KEY as string,
      { expiresIn: "30d" }
    );

    const hashRefreshToken = bcrypt.hashSync(newRefreshToken, 10);

    await prisma.$transaction([
      prisma.log.create({
        data: {
          descricao: `Refresh token atualizado com sucesso`,
          complemento: `Usuário: ${user.email}`,
          usuarioId: user.id,
        }
      }),
      prisma.sessao.update({
        where: {
          id: sessaoValida.id
        },
        data: {
          refreshToken: hashRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
      }),
    ]);

    res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60,
    })
    .cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    })
    .status(200).json({"message": "Refresh token atualizado com sucesso"});
  } catch (error) {
    res.status(400).json({ erro: "Refresh token inválido" });

    
  }
})

export default router;
