import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from "@prisma/client";

interface TokenI {
  userId: string
  userName: string
}

const prisma = new PrismaClient();

export async function verificaToken(req: Request | any, res: Response, next: NextFunction) {

  try {

    const token = req.cookies.accessToken
    
    if (!token) {
      return res.status(401).json({ error: "Token não informado" })
    }

    const decode = jwt.verify(token, process.env.JWT_ACCESS_KEY as string)
    
    const { userId, userName } = decode as TokenI

    req.userId = userId
    req.userName = userName
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    })

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    req.usuario = usuario;

next();

  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
}