import { put } from "@vercel/blob";

interface UploadOptions {
  pasta: string; // ex: "produtos", "marcas", "usuarios"
  arquivo: Express.Multer.File;
}

export async function uploadImagem({ pasta, arquivo }: UploadOptions): Promise<string> {
  const uploaded = await put(
    `pokemart/${pasta}/${Date.now()}-${arquivo.originalname}`,
    arquivo.buffer,
    {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }
  );

  return uploaded.url;
}