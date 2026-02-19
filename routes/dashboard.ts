import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";
import { verificaAdmin } from "../middewares/verificaAdmin";

const prisma = new PrismaClient();
const router = Router();

router.get("/compras", verificaToken, verificaAdmin, async (req: any, res) => {

    try {
        const compras = await prisma.carrinho.findMany({
            where: { pronto: true },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                usuarioId: true,
                usuario: {
                    select: {
                        nome: true,
                        email: true,
                        imagem: true
                    }
                    },
                produtos: {
                    select: {
                        id: true,
                        carrinhoId: true,
                        produtoId: true,
                        quantidade: true,
                        preco: true
                    }
                },
                total: true,
                pronto: true
            }
        });
        res.status(200).json(compras);
    } catch (error) {
        res.status(400).json({erro: "Erro ao enviar os dados"});
    }
});

router.get("/gerais", verificaToken, verificaAdmin, async (req: any, res) => {
    
    try {
    const totalProdutos = await prisma.produto.count();
    const totalUsuarios = await prisma.usuario.count();
    const totalCompras = await prisma.carrinho.count({ where: { pronto: true } });

    res.status(200).json({ totalProdutos, totalUsuarios, totalCompras });

    } catch (error) {
        res.status(400).json({erro: "Erro ao enviar os dados"});
    }
})

router.get("/produtosMarca", verificaToken, verificaAdmin, async (req: any, res) => {

    try {

        const produtos = await prisma.produto.groupBy({
            by: ["marcaId"],
            _count: {
                id: true
            }
        })

        const produtoMarca = await Promise.all(
            produtos.map(async (item) => {

                const marca = await prisma.marca.findUnique({
                    where: {
                        id: item.marcaId
                    }
                })

                return {
                    marca: marca?.nome,
                    quantidade: item._count.id
                }
            })
        )

        res.status(200).json(produtoMarca);

    } catch (error) {
        res.status(400).json({erro: "Erro ao enviar os dados"});
    }

})

export default router