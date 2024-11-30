/*
  Warnings:

  - You are about to drop the `Carrinhos_produtos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Carrinhos_produtos" DROP CONSTRAINT "Carrinhos_produtos_CarrinhoId_fkey";

-- DropForeignKey
ALTER TABLE "Carrinhos_produtos" DROP CONSTRAINT "Carrinhos_produtos_produtoId_fkey";

-- DropTable
DROP TABLE "Carrinhos_produtos";

-- CreateTable
CREATE TABLE "carrinhos_produtos" (
    "id" SERIAL NOT NULL,
    "carrinhoId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "carrinhos_produtos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "carrinhos_produtos" ADD CONSTRAINT "carrinhos_produtos_carrinhoId_fkey" FOREIGN KEY ("carrinhoId") REFERENCES "carrinhos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinhos_produtos" ADD CONSTRAINT "carrinhos_produtos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
