import { body, validationResult } from 'express-validator'
import { UserRepository } from '../user-repository.js'

// Reglas de validación para el registro de usuarios
export const userRegistrationRules = () => {
  return [
    body('username')
      .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres.')
      .trim().escape(),

    body('email')
      .isEmail().withMessage('Por favor, introduce un correo electrónico válido.')
      .normalizeEmail(),

    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.')
      .matches(/\d/).withMessage('La contraseña debe contener al menos un número.')
  ]
}

// Reglas de validación para el login
export const loginRules = () => {
  return [
    body('usernameOrEmail').notEmpty().withMessage('El nombre de usuario o email es requerido.').trim().escape(),
    body('password').notEmpty().withMessage('La contraseña es requerida.')
  ]
}

// Reglas de validación para el cambio de contraseña
export const changePasswordRules = () => {
  return [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida.'),
    body('newPassword')
      .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres.')
      .matches(/\d/).withMessage('La nueva contraseña debe contener al menos un número.')
  ]
}

// Reglas de validación para actualizar el perfil (username/email)
export const updateProfileRules = () => {
  return [
    body('username')
      .optional() // El campo es opcional
      .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres.')
      .trim().escape()
      .custom(async (value, { req }) => {
        // Verificamos si el nuevo username ya está en uso por OTRO usuario
        const existingUser = await UserRepository.findOneBy('username', value)
        if (existingUser && existingUser.id !== req.session.user.id) {
          throw new Error('Este nombre de usuario ya está en uso.')
        }
      }),

    body('email')
      .optional() // El campo es opcional
      .isEmail().withMessage('Por favor, introduce un correo electrónico válido.')
      .normalizeEmail()
      .custom(async (value, { req }) => {
        // Verificamos si el nuevo email ya está en uso por OTRO usuario
        const existingUser = await UserRepository.findOneBy('email', value)
        if (existingUser && existingUser.id !== req.session.user.id) {
          throw new Error('Este correo electrónico ya está en uso.')
        }
      })
  ]
}
// --- SECCIÓN ACTUALIZADA ---
export const createProductRules = () => {
  return [
    // Validaciones para el producto base
    body('name').notEmpty().withMessage('El nombre del perfume es requerido.'),
    body('brand').notEmpty().withMessage('La marca es requerida.'),
    body('categoryId').notEmpty().isInt({ gt: 0 }).withMessage('La categoría es requerida.'),
    body('inspiration').optional().isString(),
    body('notes.salida').optional().isString(),
    body('notes.corazon').optional().isString(),
    body('notes.fondo').optional().isString(),

    // Validaciones para las variaciones
    body('variations').isArray({ min: 1 }).withMessage('Se requiere al menos una variación de tamaño/precio.'),
    body('variations.*.size_ml').notEmpty().isInt({ gt: 0 }).withMessage('El tamaño de la variación es requerido.'),
    body('variations.*.price').notEmpty().isFloat({ gt: 0 }).withMessage('El precio de la variación es requerido.'),
    body('variations.*.stock').notEmpty().isInt({ min: 0 }).withMessage('El stock de la variación es requerido.')
  ]
}

export const updateProductRules = () => {
  return [
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío.').trim().escape(),
    body('brand').optional().notEmpty().withMessage('La marca no puede estar vacía.').trim().escape(),
    // CAMBIO: Se valida 'categoryId' como un número entero
    body('categoryId').optional().isInt({ gt: 0 }).withMessage('El ID de categoría debe ser un número válido.'),
    body('gender').optional().isIn(['Masculino', 'Femenino', 'Unisex']).withMessage("El género debe ser 'Masculino', 'Femenino' o 'Unisex'."),
    body('size_ml').optional().isInt({ gt: 0 }).withMessage('El tamaño en ml debe ser un número entero mayor que cero.'),
    body('notes').optional().trim().escape(),
    body('price').optional().isFloat({ gt: 0 }).withMessage('El precio debe ser un número mayor que cero.'),
    body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un número entero igual o mayor que cero.')
  ]
}

// Reglas de validación para añadir o actualizar un item del carrito
export const cartItemRules = () => {
  return [
    body('productId').notEmpty().withMessage('El ID del producto es requerido.').isUUID(4).withMessage('Debe ser un ID de producto válido.'),
    body('quantity').notEmpty().withMessage('La cantidad es requerida.').isInt({ gt: 0 }).withMessage('La cantidad debe ser un número entero mayor a 0.')
  ]
}
export const updateCartItemRules = () => {
  return [
    body('quantity').notEmpty().withMessage('La cantidad es requerida.').isInt({ min: 0 }).withMessage('La cantidad debe ser un número entero igual o mayor a 0.')
  ]
}

// Reglas de validación para crear/actualizar una categoría
export const categoryRules = () => {
  return [
    body('name').notEmpty().withMessage('El nombre de la categoría es requerido.').trim().escape(),
    body('description').optional().trim().escape()
  ]
}

export const updateShippingProfileRules = () => {
  return [
    body('nombre_completo').optional().isString().withMessage('El nombre debe ser texto.').trim().escape(),
    body('telefono').optional().isString().withMessage('El teléfono debe ser texto.').trim().escape(),
    body('direccion').optional().isString().withMessage('La dirección debe ser texto.').trim().escape(),
    body('ciudad').optional().isString().withMessage('La ciudad debe ser texto.').trim().escape(),
    body('pais').optional().isString().withMessage('El país debe ser texto.').trim().escape(),
    body('codigo_postal').optional().isPostalCode('any').withMessage('Debe ser un código postal válido.').trim().escape()
  ]
}

// Middleware que procesa los resultados de la validación
export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }

  const extractedErrors = []
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }))

  const err = new Error('Errores de validación.')
  err.status = 422 // Unprocessable Entity
  err.errors = extractedErrors

  return next(err)
}
