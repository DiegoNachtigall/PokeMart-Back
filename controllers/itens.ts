import { Request, Response } from "express";
import * as ItensService from "../services/itens";

export async function listar(req: Request, res: Response) {
  try {
    const produtos = await ItensService.listarProdutos();
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar os produtos" });
  }
}

export async function buscarPorId(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const produto = await ItensService.buscarProdutoPorId(Number(id));

    if (!produto || produto.deleted) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    res.status(200).json(produto);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar o produto" });
  }
}

export async function criar(req: any, res: Response) {
  const { nome, descricao, preco, categorias, marcaId, estoque } = req.body;

  if (!nome || !descricao || !preco || !categorias || !marcaId || !estoque) {
    return res.status(400).json({ erro: "Informe todos os dados" });
  }

  try {
    const produto = await ItensService.criarProduto(
      {
        nome,
        descricao,
        preco: Number(preco),
        categorias,
        marcaId: Number(marcaId),
        estoque: Number(estoque),
      },
      req.file
    );
    res.status(201).json(produto);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar o produto" });
  }
}

export async function atualizar(req: Request, res: Response) {
  const { id } = req.params;
  const { nome, descricao, preco, categorias, marcaId, estoque } = req.body;

  try {
    const produto = await ItensService.atualizarProduto(
      Number(id),
      {
        ...(nome && { nome }),
        ...(descricao && { descricao }),
        ...(preco && { preco: Number(preco) }),
        ...(categorias && { categorias }),
        ...(marcaId && { marcaId: Number(marcaId) }),
        ...(estoque && { estoque: Number(estoque) }),
      },
      req.file
    );
    res.status(200).json(produto);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar o produto" });
  }
}

export async function atualizarFoto(req: Request, res: Response) {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ erro: "Informe a foto do produto" });
  }

  try {
    const produto = await ItensService.atualizarFoto(Number(id), req.file);
    res.status(200).json({ fotoPrincipal: produto.fotoPrincipal });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao fazer upload da foto" });
  }
}

export async function deletar(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await ItensService.deletarProduto(Number(id));
    res.status(200).json({ mensagem: "Produto deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao deletar o produto" });
  }
}

export async function adicionarEstoque(req: Request, res: Response) {
  const { id } = req.params;
  const { estoque } = req.body;

  if (!estoque || estoque <= 0) {
    return res.status(400).json({ erro: "Informe uma quantidade válida" });
  }

  try {
    const produto = await ItensService.adicionarEstoque(Number(id), Number(estoque));
    res.status(200).json(produto);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar o estoque" });
  }
}

export async function pesquisar(req: Request, res: Response) {
  const { termo } = req.params;

  try {
    const produtos = await ItensService.pesquisarProdutos(termo);
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao pesquisar os produtos" });
  }
}

export async function filtrarPorMarca(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const produtos = await ItensService.filtrarPorMarca(Number(id));
    res.status(200).json(produtos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao filtrar os produtos" });
  }
}