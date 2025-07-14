// product-repository.js
import pool from './database.js'
import crypto from 'crypto'
import { SearchRepository } from './search-repository.js'

export class ProductRepository {
  static async create ({ productData, variationsData, imagesData, sellerId }) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const productId = crypto.randomUUID()
      const notesJson = JSON.stringify(productData.notes)

      await connection.query(
        'INSERT INTO productos (id, name, brand, category_id, gender, inspiration, notes, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [productId, productData.name, productData.brand, productData.categoryId, productData.gender, productData.inspiration, notesJson, sellerId]
      )

      for (const variation of variationsData) {
        const variationId = crypto.randomUUID()
        await connection.query(
          'INSERT INTO producto_variaciones (id, producto_id, size_ml, price, stock) VALUES (?, ?, ?, ?, ?)',
          [variationId, productId, variation.size_ml, variation.price, variation.stock]
        )
      }

      for (const image of imagesData) {
        const imageId = crypto.randomUUID()
        await connection.query(
          'INSERT INTO producto_imagenes (id, producto_id, imageUrl, display_order) VALUES (?, ?, ?, ?)',
          [imageId, productId, image.imageUrl, image.display_order || 0]
        )
      }

      await connection.commit()
      return this.findById(productId, true)
    } catch (error) {
      await connection.rollback()
      console.error('Error al crear el producto:', error)
      throw new Error('No se pudo crear el producto.')
    } finally {
      connection.release()
    }
  }

  /**     * Busca un producto por su ID.
     *
     * @param {string} id
     * @param {boolean} includeInactive
     */
  static async findById (id, includeInactive = false) {
    const statusFilter = includeInactive ? '' : 'AND p.status = \'activo\''

    const [productRows] = await pool.query(`
            SELECT 
                p.id, p.name, p.brand, p.gender, p.inspiration, p.notes, p.status, p.seller_id,
                p.category_id, c.name AS categoryName, u.username AS sellerName 
            FROM productos p
            LEFT JOIN categorias c ON p.category_id = c.id
            JOIN users u ON p.seller_id = u.id
            WHERE p.id = ? AND u.isActive = TRUE ${statusFilter}
        `, [id])

    const product = productRows[0]
    if (!product) return undefined

    const [variations] = await pool.query('SELECT id, size_ml, price, stock FROM producto_variaciones WHERE producto_id = ?', [id])
    const [images] = await pool.query('SELECT id, imageUrl, display_order FROM producto_imagenes WHERE producto_id = ? ORDER BY display_order ASC', [id])

    return { ...product, variations, images }
  }

  static async getAll (filters) {
    return SearchRepository.findProducts(filters)
  }

  static async findBySellerId (sellerId) {
    const [rows] = await pool.query(`
            SELECT 
                p.id, p.name, p.status,
                (SELECT MIN(price) FROM producto_variaciones WHERE producto_id = p.id) as starting_price,
                (SELECT SUM(stock) FROM producto_variaciones WHERE producto_id = p.id) as totalStock,
                (SELECT imageUrl FROM producto_imagenes WHERE producto_id = p.id ORDER BY display_order ASC LIMIT 1) as mainImageUrl
            FROM productos p
            WHERE p.seller_id = ?
            ORDER BY p.created_at DESC
        `, [sellerId])
    return rows
  }

  static async findAllPending () {
    const [rows] = await pool.query(`
            SELECT p.id, p.name, p.brand, u.username as sellerName, p.created_at 
            FROM productos p
            JOIN users u ON p.seller_id = u.id
            WHERE p.status = 'pendiente_aprobacion'
            ORDER BY p.created_at ASC
        `)
    return rows
  }

  static async updateStatus (id, status) {
    const [result] = await pool.query('UPDATE productos SET status = ? WHERE id = ?', [status, id])
    return result.affectedRows > 0
  }

  static async update (id, data) {
    const fields = Object.keys(data)
    if (fields.length === 0) {
      return this.findById(id, true)
    }
    if (data.notes) {
      data.notes = JSON.stringify(data.notes)
    }
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = [...Object.values(data), id]
    await pool.query(`UPDATE productos SET ${setClause} WHERE id = ?`, values)
    return this.findById(id, true)
  }

  static async remove (id) {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id])
    return result.affectedRows > 0
  }

  static async getMarketPriceData (categoryId) {
    if (!categoryId) {
      return { minPrice: 0, maxPrice: 0, avgPrice: 0, competitorCount: 0 }
    }
    const [rows] = await pool.query(`
            SELECT MIN(price) as minPrice, MAX(price) as maxPrice, AVG(price) as avgPrice, COUNT(id) as competitorCount
            FROM producto_variaciones pv
            JOIN productos p ON pv.producto_id = p.id
            WHERE p.category_id = ?
        `, [categoryId])
    const data = rows[0]
    return {
      minPrice: parseFloat(data.minPrice || 0),
      maxPrice: parseFloat(data.maxPrice || 0),
      avgPrice: parseFloat(data.avgPrice || 0),
      competitorCount: data.competitorCount || 0
    }
  }
}
