import { Router } from "express";
import multer from "multer";
import { verificaToken, verificaAdmin } from "../middlewares/Auth";
import * as ItensController from "../controllers/itens";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get("/", ItensController.listar);
router.get("/pesquisa/:termo", ItensController.pesquisar);
router.get("/filtro/marca/:id", ItensController.filtrarPorMarca);
router.get("/:id", ItensController.buscarPorId);
router.post("/", verificaToken, verificaAdmin, upload.single("imagem"), ItensController.criar);
router.put("/:id", verificaToken, verificaAdmin, upload.single("imagem"), ItensController.atualizar);
router.patch("/:id/foto", verificaToken, verificaAdmin, upload.single("imagem"), ItensController.atualizarFoto);
router.put("/:id/adicionar", verificaToken, verificaAdmin, ItensController.adicionarEstoque);
router.delete("/:id", verificaToken, verificaAdmin, ItensController.deletar);

export default router;