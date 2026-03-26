import { Request, Response } from "express";
import bcrypt from "bcrypt";
import * as UsuariosService from "../services/usuarios";

export async function listar(req: Request, res: Response) {
  try {
    const usuarios = await UsuariosService.listarUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar os usuários" });
  }
}

export async function buscarPorId(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const usuario = await UsuariosService.buscarUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar o usuário" });
  }
}

export async function criar(req: Request, res: Response) {
  const { nome, email, senha, imagem } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Informe nome, email e senha" });
  }

  const erros = UsuariosService.validaSenha(senha);
  if (erros.length > 0) {
    return res.status(400).json({ erro: erros });
  }

  try {
    await UsuariosService.criarUsuario(nome, email, senha, imagem);
    res.status(201).json({ mensagem: "Cadastro realizado com sucesso!" });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ erro: "Email já cadastrado" });
    }
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
}

export async function atualizar(req: any, res: Response) {
  const id = req.userId;
  const { nome, email, imagem } = req.body;

  try {
    await UsuariosService.atualizarUsuario(id, { nome, email, imagem });
    res.status(200).json({ mensagem: "Usuário atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar o usuário" });
  }
}

export async function deletar(req: any, res: Response) {
  const id = req.userId;

  try {
    await UsuariosService.deletarUsuario(id);
    res.status(200).json({ mensagem: "Usuário excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir o usuário" });
  }
}

export async function tornarAdmin(req: Request, res: Response) {
  const { userId } = req.body;

  try {
    await UsuariosService.tornarAdmin(userId);
    res.status(200).json({ mensagem: "Usuário atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar o usuário" });
  }
}

export async function desbloquear(req: Request, res: Response) {
  const { userId } = req.body;

  try {
    await UsuariosService.desbloquearUsuario(userId);
    res.status(200).json({ mensagem: "Usuário desbloqueado com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao desbloquear o usuário" });
  }
}

export async function mudarSenha(req: any, res: Response) {
  const id = req.userId;
  const { senhaAntiga, senhaNova } = req.body;

  if (!senhaAntiga || !senhaNova) {
    return res.status(400).json({ erro: "Informe a senha antiga e a nova senha" });
  }

  const erros = UsuariosService.validaSenha(senhaNova);
  if (erros.length > 0) {
    return res.status(400).json({ erro: erros });
  }

  // Busca o usuário completo para comparar a senha (incluindo hash)
  const { prisma } = await import("../lib/prisma");
  const usuario = await prisma.usuario.findUnique({ where: { id } });

  if (!usuario) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const senhaCorreta = bcrypt.compareSync(senhaAntiga, usuario.senha);
  if (!senhaCorreta) {
    return res.status(400).json({ erro: "Senha antiga inválida" });
  }

  try {
    await UsuariosService.mudarSenha(id, senhaNova);
    res.status(200).json({ mensagem: "Senha alterada com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao alterar a senha" });
  }
}