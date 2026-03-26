import { Router } from "express";
import { verificaToken, verificaAdmin } from "../middlewares/Auth";
import * as MarcasController from "../controllers/marcas";

const router = Router();

router.get("/", MarcasController.listarMarcas);
router.get("/:id", MarcasController.buscarMarcaPorId);
router.post("/", verificaToken, verificaAdmin, MarcasController.criarMarca);
router.put("/:id", verificaToken, verificaAdmin, MarcasController.atualizarMarca);
router.delete("/:id", verificaToken, verificaAdmin, MarcasController.deletarMarca);

export default router;