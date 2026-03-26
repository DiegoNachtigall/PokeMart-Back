/*
  Warnings:

  - You are about to drop the column `pronto` on the `carrinhos` table. All the data in the column will be lost.
  - You are about to alter the column `total` on the `carrinhos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `preco` on the `carrinhos_produtos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `preco` on the `produtos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the `fotos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tokenResetSenha` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('Pendente', 'Entregue');

-- DropForeignKey
ALTER TABLE "fotos" DROP CONSTRAINT "fotos_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "tokenResetSenha" DROP CONSTRAINT "tokenResetSenha_usuarioId_fkey";

-- AlterTable
ALTER TABLE "carrinhos" DROP COLUMN "pronto",
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "carrinhos_produtos" ALTER COLUMN "preco" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "logs" ALTER COLUMN "complemento" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "produtos" ALTER COLUMN "preco" SET DATA TYPE DECIMAL(10,2);

-- DropTable
DROP TABLE "fotos";

-- DropTable
DROP TABLE "tokenResetSenha";

-- CreateTable
CREATE TABLE "tokens_reset_senha" (
    "id" VARCHAR(36) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiracao" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_reset_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'Pendente',

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_produtos" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "pedidos_produtos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tokens_reset_senha_usuarioId_idx" ON "tokens_reset_senha"("usuarioId");

-- AddForeignKey
ALTER TABLE "tokens_reset_senha" ADD CONSTRAINT "tokens_reset_senha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_produtos" ADD CONSTRAINT "pedidos_produtos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_produtos" ADD CONSTRAINT "pedidos_produtos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
