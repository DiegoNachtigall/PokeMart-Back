-- DropForeignKey
ALTER TABLE "carrinhos" DROP CONSTRAINT "carrinhos_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "carrinhos_produtos" DROP CONSTRAINT "carrinhos_produtos_carrinhoId_fkey";

-- DropForeignKey
ALTER TABLE "carrinhos_produtos" DROP CONSTRAINT "carrinhos_produtos_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "logs" DROP CONSTRAINT "logs_usuarioId_fkey";

-- AddForeignKey
ALTER TABLE "carrinhos" ADD CONSTRAINT "carrinhos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinhos_produtos" ADD CONSTRAINT "carrinhos_produtos_carrinhoId_fkey" FOREIGN KEY ("carrinhoId") REFERENCES "carrinhos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinhos_produtos" ADD CONSTRAINT "carrinhos_produtos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
