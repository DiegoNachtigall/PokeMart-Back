export function verificaAdmin(req: any, res: any, next: any) {
  if (!req.usuario.admin) {
    return res.status(403).json({ erro: "Acesso restrito a admins" });
  }
  next();
}