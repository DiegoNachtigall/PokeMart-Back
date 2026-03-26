import { Request, Response } from "express";
import * as CarrinhosService from "../services/carrinhos";

export async function listar(req: Request, res: Response) {
  try {
    const carrinhos = await CarrinhosService.listarCarrinhos();
    res.status(200).json(carrinhos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar os carrinhos" });
  }
}

export async function buscarCarrinho(req: any, res: Response) {
  try {
    const carrinho = await CarrinhosService.buscarCarrinho(req.userId);
    res.status(200).json(carrinho);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar o carrinho" });
  }
}

export async function adicionarProduto(req: any, res: Response) {
  const { produtoId } = req.params;
  const { quantidade } = req.body;

  if (!produtoId || !quantidade) {
    return res.status(400).json({ erro: "Informe todos os dados" });
  }

  if (quantidade <= 0) {
    return res.status(400).json({ erro: "Quantidade deve ser maior que zero" });
  }

  try {
    const item = await CarrinhosService.adicionarProduto(
      req.userId,
      Number(produtoId),
      Number(quantidade)
    );
    res.status(201).json(item);
  } catch (error: any) {
    const status = error.status ?? 500;
    const mensagem = error.mensagem ?? "Erro ao adicionar produto ao carrinho";
    res.status(status).json({ erro: mensagem });
  }
}

export async function removerProduto(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const item = await CarrinhosService.removerProduto(Number(id));
    res.status(200).json(item);
  } catch (error: any) {
    const status = error.status ?? 500;
    const mensagem = error.mensagem ?? "Erro ao remover produto do carrinho";
    res.status(status).json({ erro: mensagem });
  }
}

export async function finalizar(req: any, res: Response) {
  const { itensSelecionados } = req.body;

  if (!itensSelecionados || itensSelecionados.length === 0) {
    return res.status(400).json({ erro: "Selecione ao menos um item para finalizar a compra" });
  }

  try {
    const pedido = await CarrinhosService.finalizarCompra(req.userId, itensSelecionados);
    res.status(201).json({ mensagem: "Pedido realizado com sucesso!", pedido });
  } catch (error: any) {
    const status = error.status ?? 500;
    const mensagem = error.mensagem ?? "Erro ao finalizar a compra";
    res.status(status).json({ erro: mensagem });
  }
}