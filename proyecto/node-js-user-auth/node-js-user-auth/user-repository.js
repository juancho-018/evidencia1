// user-repository.js
import pool from './database.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { sendPasswordResetEmail } from './services/emailService.js'

export class UserRepository {
  // Método auxiliar para encontrar un usuario por cualquier campo
  static async findOneBy (field, value) {
    const [rows] = await pool.query(`SELECT * FROM users WHERE ${field} = ?`, [value])
    return rows[0]
  }

  // CREATE
  static async create ({ username, email, password, role = 'user' }) {
    if (await this.findOneBy('username', username)) {
      const err = new Error('El nombre de usuario ya existe.'); err.status = 409; throw err
    }
    if (await this.findOneBy('email', email)) {
      const err = new Error('El correo electrónico ya está en uso.'); err.status = 409; throw err
    }

    const salt = parseInt(process.env.SALT_ROUNDS)
    const hashedPassword = await bcrypt.hash(password, salt)
    const id = crypto.randomUUID()

    await pool.query(
      'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, username, email, hashedPassword, role]
    )

    return id
  }

  // CHANGE PASSWORD (while logged in)
  static async changePassword ({ userId, currentPassword, newPassword }) {
    const user = await this.findOneBy('id', userId)
    if (!user) {
      const err = new Error('Usuario no encontrado.'); err.status = 404; throw err
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      const err = new Error('La contraseña actual es incorrecta.'); err.status = 401; throw err
    }

    const salt = parseInt(process.env.SALT_ROUNDS)
    const hashedNewPassword = await bcrypt.hash(newPassword, salt)

    await pool.query(
      'UPDATE users SET password = ?, refreshToken = NULL WHERE id = ?',
      [hashedNewPassword, userId]
    )
  }

  // UPDATE ACCOUNT DETAILS (username, email)
  static async updateAccountDetails ({ userId, username, email }) {
    const updateFields = []
    const values = []

    if (username) {
      updateFields.push('username = ?')
      values.push(username)
    }
    if (email) {
      updateFields.push('email = ?')
      values.push(email)
    }

    if (updateFields.length === 0) {
      return // No fields to update
    }

    values.push(userId) // Add user id for the WHERE clause

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`

    await pool.query(sql, values)
  }

  // LOGIN
  static async login ({ usernameOrEmail, password }) {
    let user = await this.findOneBy('username', usernameOrEmail)
    if (!user) {
      user = await this.findOneBy('email', usernameOrEmail)
    }
    if (!user) {
      const err = new Error('Credenciales inválidas.'); err.status = 401; throw err
    }
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      const err = new Error('Credenciales inválidas.'); err.status = 401; throw err
    }

    const { password: _, ...publicUser } = user

    const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })

    await pool.query('UPDATE users SET refreshToken = ? WHERE id = ?', [refreshToken, user.id])

    return { user: publicUser, accessToken, refreshToken }
  }

  // LOGOUT
  static async invalidateRefreshToken (token) {
    await pool.query('UPDATE users SET refreshToken = NULL WHERE refreshToken = ?', [token])
  }

  // REFRESH ACCESS TOKEN
  static async refreshAccessToken (refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await this.findOneBy('id', decoded.id)

    if (!user || user.refreshToken !== refreshToken) {
      const err = new Error('Refresh token inválido o revocado.'); err.status = 403; throw err
    }

    return jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' })
  }

  // FORGOT PASSWORD
  static async generatePasswordReset (email) {
    const user = await this.findOneBy('email', email)
    if (!user) return

    const resetToken = crypto.randomBytes(32).toString('hex')
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000)

    await pool.query(
      'UPDATE users SET passwordResetToken = ?, passwordResetExpires = ? WHERE id = ?',
      [passwordResetToken, passwordResetExpires, user.id]
    )

    try {
      await sendPasswordResetEmail(user.email, resetToken)
    } catch (error) {
      console.error('Fallo al enviar email:', error)
    }
  }

  // RESET PASSWORD
  static async resetPassword (token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE passwordResetToken = ? AND passwordResetExpires > NOW()',
      [hashedToken]
    )
    const user = rows[0]

    if (!user) {
      const err = new Error('Token inválido o expirado.'); err.status = 400; throw err
    }

    const salt = parseInt(process.env.SALT_ROUNDS)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await pool.query(
      'UPDATE users SET password = ?, passwordResetToken = NULL, passwordResetExpires = NULL, refreshToken = NULL WHERE id = ?',
      [hashedPassword, user.id]
    )
  }

  // GET ALL
  static async getAll () {
    const [rows] = await pool.query('SELECT id, username, email, role FROM users')
    return rows
  }

  // UPDATE ROLE (for admin)
  static async updateRole (id, role) {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id])
  }
}
