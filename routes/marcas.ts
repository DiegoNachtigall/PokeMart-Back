import { Router } from "express";
import multer from "multer";
import { verificaToken, verificaAdmin } from "../middlewares/Auth";
import * as MarcasController from "../controllers/marcas";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get("/", MarcasController.listarMarcas);
router.get("/:id", MarcasController.buscarMarcaPorId);
router.post("/", verificaToken, verificaAdmin, upload.single("imagem"), MarcasController.criarMarca);
router.put("/:id", verificaToken, verificaAdmin, upload.single("imagem"), MarcasController.atualizarMarca);
router.delete("/:id", verificaToken, verificaAdmin, MarcasController.deletarMarca);

export default router;