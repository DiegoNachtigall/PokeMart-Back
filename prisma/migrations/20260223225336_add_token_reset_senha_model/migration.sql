/*
  Warnings:

  - You are about to drop the column `recuperacao` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `recuperacaoExp` on the `usuarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "recuperacao",
DROP COLUMN "recuperacaoExp",
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "senha" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "tokenResetSenha" (
    "id" VARCHAR(36) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiracao" TIMESTAMP(3) NOT NULL,
    "valido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokenResetSenha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tokenResetSenha_usuarioId_idx" ON "tokenResetSenha"("usuarioId");

-- AddForeignKey
ALTER TABLE "tokenResetSenha" ADD CONSTRAINT "tokenResetSenha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
