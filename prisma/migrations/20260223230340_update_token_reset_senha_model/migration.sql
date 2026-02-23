/*
  Warnings:

  - You are about to drop the column `valido` on the `tokenResetSenha` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tokenResetSenha" DROP COLUMN "valido",
ADD COLUMN     "usado" BOOLEAN NOT NULL DEFAULT false;
