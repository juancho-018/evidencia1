import pool from './database.js'
import crypto from 'crypto'

export class CartRepository {
  static async findOrCreateCartByUserId (userId) {
    const [rows] = await pool.query('SELECT * FROM carritos WHERE user_id = ?', [userId])
    if (!rows[0]) {
      const id = crypto.randomUUID()
      await pool.query('INSERT INTO carritos (id, user_id) VALUES (?, ?)', [id, userId])
      return { id, user_id: userId }
    }
    return rows[0]
  }

  static async addItem (cartId, variationId, quantity) {
    const [existingItems] = await pool.query(
      'SELECT * FROM carrito_items WHERE carrito_id = ? AND variacion_id = ?',
      [cartId, variationId]
    )
    if (existingItems[0]) {
      const newQuantity = existingItems[0].quantity + quantity
      await this.updateItemQuantity(existingItems[0].id, newQuantity)
    } else {
      const id = crypto.randomUUID()
      await pool.query(
        'INSERT INTO carrito_items (id, carrito_id, variacion_id, quantity) VALUES (?, ?, ?, ?)',
        [id, cartId, variationId, quantity]
      )
    }
  }

  static async getCartContents (cartId) {
    const [items] = await pool.query(`
            SELECT 
                ci.id AS itemId,
                ci.quantity,
                pv.id AS variationId,
                pv.size_ml,
                pv.price,
                p.id AS productoId,
                p.name,
                p.brand,
                (SELECT imageUrl FROM producto_imagenes WHERE producto_id = p.id ORDER BY display_order ASC LIMIT 1) as mainImageUrl
            FROM carrito_items ci
            JOIN producto_variaciones pv ON ci.variacion_id = pv.id
            JOIN productos p ON pv.producto_id = p.id
            WHERE ci.carrito_id = ?
        `, [cartId])
    return items
  }

  static async updateItemQuantity (itemId, quantity) {
    if (quantity <= 0) {
      await this.removeItem(itemId)
    } else {
      await pool.query('UPDATE carrito_items SET quantity = ? WHERE id = ?', [quantity, itemId])
    }
  }

  static async removeItem (itemId) {
    await pool.query('DELETE FROM carrito_items WHERE id = ?', [itemId])
  }

  static async isItemOwner (itemId, userId) {
    const [rows] = await pool.query(`
            SELECT c.user_id FROM carrito_items ci
            JOIN carritos c ON ci.carrito_id = c.id
            WHERE ci.id = ?
        `, [itemId])
    return rows[0] && rows[0].user_id === userId
  }
}
