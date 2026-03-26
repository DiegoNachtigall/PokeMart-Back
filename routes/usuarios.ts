import { Router } from "express";
import multer from "multer";
import { verificaToken, verificaAdmin } from "../middlewares/Auth";
import * as UsuariosController from "../controllers/usuarios";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get("/", verificaToken, verificaAdmin, UsuariosController.listar);
router.get("/:id", verificaToken, UsuariosController.buscarPorId);
router.post("/", upload.single("imagem"),UsuariosController.criar);
router.patch("/atualizar", verificaToken, upload.single("imagem"), UsuariosController.atualizar);
router.delete("/deletar", verificaToken, UsuariosController.deletar);
router.patch("/admin", verificaToken, verificaAdmin, UsuariosController.tornarAdmin);
router.patch("/desbloquear", verificaToken, verificaAdmin, UsuariosController.desbloquear);
router.patch("/mudarsenha", verificaToken, UsuariosController.mudarSenha);

export default router;