import express from 'express'
const app = express()
const port = 3001
// const port = process.env.PORT ?? 3001

import UsuariosRoutes from './routes/usuarios'
import LoginRoutes from './routes/login'
import RefreshRoutes from './routes/refresh'
import produtoRoutes from './routes/itens'
import MarcasRoutes from './routes/marcas'
import ComprasRoutes from './routes/compras'
import FotosRoutes from './routes/fotos'
import AltSenha from './routes/altSenha'
import DashboardRoutes from './routes/dashboard'
import cors from 'cors'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.use("/usuarios", UsuariosRoutes)
app.use("/login", LoginRoutes)
app.use("/produtos", produtoRoutes)
app.use("/marcas", MarcasRoutes)
app.use("/compras", ComprasRoutes)
app.use("/fotos", FotosRoutes)
app.use("/altSenha", AltSenha)
app.use("/dashboard", DashboardRoutes)
app.use("/refresh", RefreshRoutes)

app.get('/', (req, res) => {
  res.send('API pokemart')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: http://localhost:${port}`)
})