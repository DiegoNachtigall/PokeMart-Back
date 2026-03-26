import { Request, Response } from "express";
import * as MarcasService from "../services/marcas";

export async function listarMarcas(req: Request, res: Response) {
  try {
    const marcas = await MarcasService.listarMarcas();
    res.status(200).json(marcas);
  } catch (error: any) {
    res.status(error.status ?? 500).json({ erro: error.mensagem ?? "Erro interno do servidor" });
  }
}

export async function buscarMarcaPorId(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const marca = await MarcasService.buscarMarcaPorId(Number(id));
    res.status(200).json(marca);
  } catch (error: any) {
    res.status(error.status ?? 500).json({ erro: error.mensagem ?? "Erro interno do servidor" });
  }
}

export async function criarMarca(req: any, res: Response) {
  const { nome } = req.body;

  try {
    const marca = await MarcasService.criarMarca(nome, req.file);
    res.status(201).json(marca);
  } catch (error: any) {
    res.status(error.status ?? 500).json({ erro: error.mensagem ?? "Erro interno do servidor" });
  }
}

export async function atualizarMarca(req: any, res: Response) {
  const { id } = req.params;
  const { nome } = req.body;

  try {
    const marca = await MarcasService.atualizarMarca(Number(id), nome, req.file);
    res.status(200).json(marca);
  } catch (error: any) {
    res.status(error.status ?? 500).json({ erro: error.mensagem ?? "Erro interno do servidor" });
  }
}

export async function deletarMarca(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const marca = await MarcasService.deletarMarca(Number(id));
    res.status(200).json(marca);
  } catch (error: any) {
    res.status(error.status ?? 500).json({ erro: error.mensagem ?? "Erro interno do servidor" });
  }
}