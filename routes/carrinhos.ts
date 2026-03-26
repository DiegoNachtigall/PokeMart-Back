import { Router } from "express";
import { verificaToken, verificaAdmin } from "../middlewares/Auth";
import * as CarrinhosController from "../controllers/carrinhos";

const router = Router();

router.get("/", verificaToken, verificaAdmin, CarrinhosController.listar);
router.get("/carrinho", verificaToken, CarrinhosController.buscarCarrinho);
router.post("/adicionar/:produtoId", verificaToken, CarrinhosController.adicionarProduto);
router.delete("/remover/:id", verificaToken, CarrinhosController.removerProduto);
router.post("/finalizar", verificaToken, CarrinhosController.finalizar);

export default router;