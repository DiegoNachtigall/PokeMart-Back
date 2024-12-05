/*
  Warnings:

  - You are about to drop the `Compra` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CompraToproduto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Compra" DROP CONSTRAINT "Compra_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "_CompraToproduto" DROP CONSTRAINT "_CompraToproduto_A_fkey";

-- DropForeignKey
ALTER TABLE "_CompraToproduto" DROP CONSTRAINT "_CompraToproduto_B_fkey";

-- AlterTable
ALTER TABLE "carrinhos" ADD COLUMN     "pronto" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Compra";

-- DropTable
DROP TABLE "_CompraToproduto";
