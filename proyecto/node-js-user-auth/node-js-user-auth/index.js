import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'

// Repositorios
import { PaymentService } from './payment-service.js'
import { UserRepository } from './user-repository.js'
import { ProductRepository } from './product-repository.js'
import { CartRepository } from './cart-repository.js'
import { OrderRepository } from './order-repository.js'
import { CategoryRepository } from './category-repository.js'
import { ProfileRepository } from './profile-repository.js'
import { AIRepository } from './ai-repository.js'

// Validadores
import {
  validate,
  userRegistrationRules,
  loginRules,
  changePasswordRules,
  updateProfileRules,
  createProductRules,
  updateProductRules,
  cartItemRules,
  updateCartItemRules,
  categoryRules,
  updateShippingProfileRules
} from './middlewares/validators.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')))

const corsOptions = {
  origin: 'http://localhost:4200',
  credentials: true
}
app.use(cors(corsOptions))

// --- CONFIGURACIÓN Y MIDDLEWARES GLOBALES ---
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Configuración de Multer para la subida de archivos
const parseProductData = (req, res, next) => {
  try {
    if (req.body.notes) {
      req.body.notes = JSON.parse(req.body.notes)
    }
    if (req.body.variations) {
      req.body.variations = JSON.parse(req.body.variations)
    }
    next()
  } catch (e) {
    res.status(400).json({ error: 'Datos de variaciones o notas mal formados.' })
  }
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/products') // Asegúrate de que esta carpeta exista
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Por favor, inténtelo de nuevo en 15 minutos.' }
})

app.use((req, res, next) => {
  const token = req.cookies?.access_token

  if (!token) {
    return next() // Sin token, sigue como no autenticado
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.session = { user: decoded } // ✅ Guardamos el usuario verificado
  } catch (err) {
    console.error('Token inválido:', err.message)
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    req.session = {} // Limpia sesión
  }

  next()
})

function requireAuth (req, res, next) {
  if (!req.session.user) {
    return res.status(401).send({ error: 'No autenticado. Por favor, inicie sesión.' })
  }
  next()
}

// El middleware ahora acepta un string (un solo rol) o un array de strings (múltiples roles permitidos)
function requireRole (role) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).send({ error: 'No autenticado.' })
    }

    const hasPermission = Array.isArray(role)
      ? role.includes(req.session.user.role)
      : req.session.user.role === role

    if (!hasPermission) {
      return res.status(403).send({ error: 'Acceso denegado. Permisos insuficientes.' })
    }
    next()
  }
}

// --- RUTAS PÚBLICAS Y DE AUTENTICACIÓN ---
app.post('/login', authLimiter, loginRules(), validate, async (req, res) => {
  const { usernameOrEmail, password } = req.body
  const { user, accessToken, refreshToken } = await UserRepository.login({ usernameOrEmail, password })
  res
    .cookie('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 1000 * 60 * 15 })
    .cookie('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 1000 * 60 * 60 * 24 * 7 })
    .status(200).send({ user })
})

app.post('/register', authLimiter, userRegistrationRules(), validate, async (req, res) => {
  const { username, email, password } = req.body
  const id = await UserRepository.create({ username, email, password, role: 'user' })
  res.status(201).send({ id })
})
app.post('/logout', (req, res) => {
  res
    .clearCookie('access_token')
    .clearCookie('refresh_token')
    .status(200)
    .json({ message: 'Sesión cerrada correctamente' })
})

// --- RUTAS PRIVADAS DE LA API ---
const apiRouter = express.Router()

// --- MÓDULO DE USUARIOS Y PERFILES ---
const usersRouter = express.Router()
// ✅ Ruta para obtener el usuario autenticado
usersRouter.get('/me', requireAuth, async (req, res) => {
  const user = req.session?.user

  if (!user) {
    return res.status(401).json({ message: 'No autenticado' })
  }

  // Puedes devolver solo lo necesario si no quieres exponer todo
  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  })
})

usersRouter.put('/me/password', requireAuth, changePasswordRules(), validate, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.session.user.id
  await UserRepository.changePassword({ userId, currentPassword, newPassword })
  res.clearCookie('access_token').clearCookie('refresh_token').json({ message: 'Contraseña actualizada. Inicie sesión de nuevo.' })
})
usersRouter.put('/me', requireAuth, updateProfileRules(), validate, async (req, res) => {
  const { username, email } = req.body
  const userId = req.session.user.id
  await UserRepository.updateAccountDetails({ userId, username, email })
  res.clearCookie('access_token').clearCookie('refresh_token').json({ message: 'Perfil actualizado. Se requiere nuevo inicio de sesión.' })
})
usersRouter.get('/me/profile', requireAuth, async (req, res) => {
  const userId = req.session.user.id
  const profile = await ProfileRepository.findByUserId(userId)
  if (!profile) return res.status(200).json({})
  res.status(200).json(profile)
})
usersRouter.put('/me/profile', requireAuth, updateShippingProfileRules(), validate, async (req, res) => {
  const userId = req.session.user.id
  const profileData = req.body
  const updatedProfile = await ProfileRepository.upsert(userId, profileData)
  res.status(200).json(updatedProfile)
})
apiRouter.use('/users', usersRouter)

// --- MÓDULO DE PRODUCTOS ---
const productosRouter = express.Router()
productosRouter.get('/', async (req, res) => {
  const filters = req.query
  const productos = await ProductRepository.getAll(filters)
  res.status(200).json(productos)
})
productosRouter.post(
  '/',
  requireAuth,
  requireRole('vendedor'),
  upload.array('images', 4), // Primero, Multer procesa los archivos y el texto
  parseProductData, // Segundo, nuestro nuevo middleware parsea los strings a JSON
  createProductRules(), // Tercero, el validador ahora sí ve los arrays correctamente
  validate, // Cuarto, manejamos los errores de validación
  async (req, res, next) => { // Finalmente, la lógica de la ruta
    try {
      // Ya no necesitamos parsear aquí, los datos ya vienen listos
      const { name, brand, categoryId, gender, inspiration, notes, variations } = req.body
      console.log(req.files)
      if (!req.files || req.files.length === 0) {
        throw new Error('Se requiere al menos una imagen.')
      }

      const imagesData = req.files.map((file, index) => ({
        imageUrl: `/uploads/products/${file.filename}`,
        display_order: index
      }))

      const sellerId = req.session.user.id

      const nuevoProducto = await ProductRepository.create({
        productData: { name, brand, categoryId, gender, inspiration, notes },
        variationsData: variations,
        imagesData,
        sellerId
      })

      res.status(201).json(nuevoProducto)
    } catch (error) {
      next(error)
    }
  }
)
productosRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const producto = await ProductRepository.findById(id)
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' })
  res.status(200).json(producto)
})
productosRouter.put('/:id', requireAuth, requireRole('vendedor'), updateProductRules(), validate, async (req, res) => {
  const { id } = req.params
  const productData = req.body
  const productoExistente = await ProductRepository.findById(id)
  if (!productoExistente) return res.status(404).json({ error: 'Producto no encontrado.' })
  if (productoExistente.seller_id !== req.session.user.id) return res.status(403).json({ error: 'No tienes permiso para modificar este producto.' })
  const productoActualizado = await ProductRepository.update(id, productData)
  res.status(200).json(productoActualizado)
})
productosRouter.delete('/:id', requireAuth, requireRole('vendedor'), async (req, res) => {
  const { id } = req.params
  const productoExistente = await ProductRepository.findById(id)
  if (!productoExistente) return res.status(404).json({ error: 'Producto no encontrado.' })
  if (productoExistente.seller_id !== req.session.user.id) return res.status(403).json({ error: 'No tienes permiso para eliminar este producto.' })
  const fueEliminado = await ProductRepository.remove(id)
  if (!fueEliminado) return res.status(404).json({ error: 'Producto no encontrado para eliminar.' })
  res.status(204).send()
})
apiRouter.use('/productos', productosRouter)

// --- MÓDULO DE CARRITO DE COMPRAS ---
const carritoRouter = express.Router()
carritoRouter.use(requireAuth, requireRole('user'))
carritoRouter.get('/', async (req, res) => {
  const userId = req.session.user.id
  const cart = await CartRepository.findOrCreateCartByUserId(userId)
  const items = await CartRepository.getCartContents(cart.id)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  res.status(200).json({ cartId: cart.id, items, subtotal: parseFloat(subtotal.toFixed(2)), totalItems })
})
carritoRouter.post('/items', cartItemRules(), validate, async (req, res) => {
  const userId = req.session.user.id
  const { productId, quantity } = req.body
  const cart = await CartRepository.findOrCreateCartByUserId(userId)
  await CartRepository.addItem(cart.id, productId, quantity)
  res.status(201).json({ message: 'Producto añadido al carrito.' })
})
carritoRouter.put('/items/:itemId', updateCartItemRules(), validate, async (req, res) => {
  const { itemId } = req.params
  if (!await CartRepository.isItemOwner(itemId, req.session.user.id)) return res.status(403).json({ error: 'No tienes permiso para modificar este item.' })
  await CartRepository.updateItemQuantity(itemId, req.body.quantity)
  res.status(200).json({ message: 'Cantidad actualizada.' })
})
carritoRouter.delete('/items/:itemId', async (req, res) => {
  const { itemId } = req.params
  if (!await CartRepository.isItemOwner(itemId, req.session.user.id)) return res.status(403).json({ error: 'No tienes permiso para eliminar este item.' })
  await CartRepository.removeItem(itemId)
  res.status(204).send()
})
apiRouter.use('/carrito', carritoRouter)

// --- MÓDULO DE PEDIDOS ---
const pedidosRouter = express.Router()
pedidosRouter.use(requireAuth, requireRole('user'))
pedidosRouter.post('/', async (req, res) => {
  const { shippingAddress } = req.body
  if (!shippingAddress) return res.status(400).json({ error: 'La dirección de envío es requerida.' })
  try {
    const nuevoPedido = await OrderRepository.createFromCart(req.session.user.id, shippingAddress)
    res.status(201).json(nuevoPedido)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})
pedidosRouter.get('/', async (req, res) => {
  const userId = req.session.user.id
  const pedidos = await OrderRepository.findOrdersByUserId(userId)
  res.status(200).json(pedidos)
})
apiRouter.use('/pedidos', pedidosRouter)

// --- MÓDULO DE CATEGORÍAS ---
const categoriasRouter = express.Router()
categoriasRouter.get('/', async (req, res) => {
  const categorias = await CategoryRepository.getAll()
  res.status(200).json(categorias)
})
categoriasRouter.post('/', requireAuth, requireRole('admin'), categoryRules(), validate, async (req, res) => {
  const { name, description } = req.body
  const nuevaCategoria = await CategoryRepository.create({ name, description })
  res.status(201).json(nuevaCategoria)
})
categoriasRouter.put('/:id', requireAuth, requireRole('admin'), categoryRules(), validate, async (req, res) => {
  const { id } = req.params
  const categoriaActualizada = await CategoryRepository.update(id, req.body)
  if (!categoriaActualizada) return res.status(404).json({ error: 'Categoría no encontrada.' })
  res.status(200).json(categoriaActualizada)
})
categoriasRouter.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params
  const fueEliminada = await CategoryRepository.remove(id)
  if (!fueEliminada) return res.status(404).json({ error: 'Categoría no encontrada.' })
  res.status(204).send()
})
apiRouter.use('/categorias', categoriasRouter)

// --- INICIO DE LA NUEVA SECCIÓN: RUTAS DEL VENDEDOR ---
const sellerRouter = express.Router()
sellerRouter.use(requireAuth, requireRole('vendedor'))

// GET /api/seller/summary - Obtener el resumen para el dashboard
sellerRouter.get('/summary', async (req, res) => {
  const summary = await OrderRepository.getSellerSummary(req.session.user.id)
  res.status(200).json(summary)
})

// GET /api/seller/products - Obtener los productos del vendedor logueado
sellerRouter.get('/products', async (req, res) => {
  const products = await ProductRepository.findBySellerId(req.session.user.id)
  res.status(200).json(products)
})

apiRouter.use('/seller', sellerRouter)

// --- MÓDULO DE ADMINISTRACIÓN ---
const adminRouter = express.Router()
adminRouter.use(requireAuth, requireRole(['admin', 'soporte']))
adminRouter.get('/pedidos', async (req, res) => {
  const todosLosPedidos = await OrderRepository.findAllOrders()
  res.status(200).json(todosLosPedidos)
})
adminRouter.put('/pedidos/:id/status', requireRole('admin'), async (req, res) => {
  const { status } = req.body
  if (!status) return res.status(400).json({ error: 'El nuevo estado es requerido.' })
  const pedidoActualizado = await OrderRepository.updateStatus(req.params.id, status)
  if (!pedidoActualizado) return res.status(404).json({ error: 'Pedido no encontrado.' })
  res.status(200).json(pedidoActualizado)
})
adminRouter.get('/productos/pendientes', requireRole('admin'), async (req, res) => {
  const pendingProducts = await ProductRepository.findAllPending()
  res.status(200).json(pendingProducts)
})
adminRouter.put('/productos/:id/status', requireRole('admin'), async (req, res) => {
  const { status } = req.body
  if (!['activo', 'rechazado', 'pausado'].includes(status)) return res.status(400).json({ error: 'Estado no válido.' })
  const success = await ProductRepository.updateStatus(req.params.id, status)
  if (!success) return res.status(404).json({ error: 'Producto no encontrado.' })
  res.status(200).json({ message: `Producto actualizado al estado: ${status}` })
})
apiRouter.use('/admin', adminRouter)

// --- MÓDULO DE IA ---
const aiRouter = express.Router()
aiRouter.post('/ask', async (req, res) => {
  // Extraemos la nueva pregunta y el historial (que puede ser un array vacío)
  const { question, history = [] } = req.body
  const user = req.session.user || null

  if (!question) {
    return res.status(400).json({ error: 'La pregunta es requerida.' })
  }

  // Validación simple del historial
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: 'El historial debe ser un array.' })
  }

  try {
    // La lógica principal sigue en el AIRepository, pero ahora le pasamos el historial.
    const answer = await AIRepository.getSmartAnswer(question, user, history)

    res.status(200).json({ answer })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
apiRouter.use('/ai', aiRouter)

// --- INICIO DE LA NUEVA SECCIÓN: RUTAS DE PAGOS ---
const paymentsRouter = express.Router()
paymentsRouter.use(requireAuth, requireRole('user'))

// POST /api/payments/create-intent - Crear una intención de pago
paymentsRouter.post('/create-intent', async (req, res) => {
  try {
    // 1. Calcular el total del carrito del usuario
    const userId = req.session.user.id
    const cart = await CartRepository.findOrCreateCartByUserId(userId)
    const items = await CartRepository.getCartContents(cart.id)
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    if (total <= 0) {
      return res.status(400).json({ error: 'No se puede crear una intención de pago para un carrito vacío.' })
    }

    // 2. Crear la intención de pago en Stripe
    const paymentIntent = await PaymentService.createPaymentIntent(total, 'usd') // Puedes cambiar 'usd' a tu moneda

    // 3. Devolver el client_secret al frontend
    res.status(200).json(paymentIntent)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

apiRouter.use('/payments', paymentsRouter)

app.use('/api', apiRouter)

app.use((err, req, res, next) => {
  console.error(err)
  if (err.errors) {
    return res.status(422).json({ errors: err.errors })
  }
  res.status(err.status || 500).send({ error: err.message || 'Ocurrió un error inesperado.' })
})

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`)
})
