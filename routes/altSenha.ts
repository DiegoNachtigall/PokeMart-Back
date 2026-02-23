import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const router = Router();

router.post("/recuperar", async (req, res) => {
    const { email } = req.body;

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { email: email },
        });

        if (!usuario) {
            return res.status(200).json({ erro: `Codigo de verificação enviado para ${email}` });
        }

        const codigo = (Math.floor(100000 + Math.random() * 900000)).toString();
        const recuperacao = await bcrypt.hash(codigo, 10);

        await prisma.tokenResetSenha.create({
            data: {
                usuarioId: usuario.id,
                token: recuperacao,
                expiracao: new Date(Date.now() + 15 * 60 * 1000),
            },
        });

        res.status(200).json({ 
            mensagem: `Codigo de verificação enviado para ${email}`,
            codigo
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro interno do servidor" });
    }
});

router.post("/resetar", async (req, res) => {
    const { email, novaSenha, novaSenha2, codigo } = req.body;

    if (!novaSenha || !novaSenha2) {
        return res.status(400).json({ erro: "Informe nova senha" });
    }

    if (novaSenha !== novaSenha2) {
        return res.status(400).json({ erro: "As senhas informadas devem ser iguais" });
    }

    if (!codigo) {
        return res.status(400).json({ erro: "Insira o Código de Verificação" });
    }

    const usuario = await prisma.usuario.findUnique({
        where: { email: email },
    });

    if (!usuario) {
        res.status(400).json({ erro: "Código inválido" });
    }

    const tokens = await prisma.tokenResetSenha.findMany({
        where: {
            usuarioId: usuario?.id,
            usado: false,
            expiracao: { gt: new Date() },
        }
    });

    if (tokens.length === 0) {
        return res.status(400).json({ erro: "Código expirado" });
    }

    let tokenValido = null;

    for (const token of tokens) {
        const match = await bcrypt.compare(codigo, token.token);
        if (match) {
            tokenValido = token;
            break;
        }
    }

    if (!tokenValido) {
        return res.status(400).json({ erro: "Código inválido" });
    }

    try {

        const salt = bcrypt.genSaltSync(12);
        const hash = bcrypt.hashSync(novaSenha, salt);

        await prisma.$transaction([
            prisma.tokenResetSenha.update({
                where: { id: tokenValido.id },
                data: { usado: true },
            }),
            prisma.usuario.update({
                where: { email: email },
                data: { senha: hash },
            }),
        ]);

        res.status(200).json({ mensagem: "Senha alterada com sucesso" });
    } catch (error) {
        res.status(400).json({ erro: "Erro ao alterar a senha" });
    }
});

export default router;