import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const router = Router();

async function enviaEmail(nome: string, email: string, descricao: string, resposta: string) {

    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 587,
        secure: false, // true for port 465, false for other ports
        auth: {
            user: "b45e97ef93c232",
            pass: "c37530d33777ac",
        },
    });

        const info = await transporter.sendMail({
            from: 'teste@gmail.com', // sender address
            to: email, // list of receivers
            subject: "Codigo de alteração de senha", // Subject line
            text: resposta, // plain text body
            html: `<h2>Olá, ${nome}</h2>
            <h3>Seu codigo de Verificação é:</h3>
            <h1>${resposta}</h1>`, // html body
        });
}

router.post("/criaCodigo/:usuarioId", async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
        });

        if (!usuario) {
            res.status(404).json({ erro: "Usuário não encontrado" });
            return;
        }

        const recuperacao = Math.floor(100000 + Math.random() * 900000);

        await prisma.usuario.update({
            where: { id: usuarioId },
            data: { recuperacao: recuperacao.toString() },
        });

        await enviaEmail(usuario.nome, usuario.email, "Codigo de alteração de senha", recuperacao.toString());

        res.status(200).json({ mensagem: "Código enviado com sucesso" });
    } catch (error) {
        res.status(400).json(error);
    }
});

router.post("/:usuarioId", async (req, res) => {
    const { novaSenha, novaSenha2, codigo } = req.body;
    const { usuarioId } = req.params;

    if (!novaSenha || !novaSenha2) {
        res.status(400).json({ erro: "Informe nova senha" });
        return;
    }

    if (novaSenha !== novaSenha2) {
        res.status(400).json({ erro: "As senhas informadas devem ser iguais" });
        return;
    }

    if (!codigo) {
        res.status(400).json({ erro: "Insira o Código de Verificação" });
        return;
    }

    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
    });

    if (usuario?.recuperacao !== codigo) {
        res.status(400).json({ erro: "Código de Verificação inválido" });
        return;
    }

    try {

        const salt = bcrypt.genSaltSync(12);
        const hash = bcrypt.hashSync(novaSenha, salt);

        await prisma.usuario.update({
            where: { id: usuarioId },
            data: { senha: hash },
        });

        res.status(200).json({ mensagem: "Senha alterada com sucesso" });
    } catch (error) {
        res.status(400).json(error);
    }
});

export default router;