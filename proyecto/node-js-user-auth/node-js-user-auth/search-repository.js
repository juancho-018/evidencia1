// search-repository.js
import pool from './database.js'

export class SearchRepository {
  /**
     * Construye y ejecuta una consulta SQL dinámica para buscar y filtrar productos.
     * @param {object} filters - Un objeto con los filtros a aplicar.
     * @returns {Promise<Array<object>>} - Una lista de productos que coinciden con los filtros.
     */
  static async findProducts (filters = {}) {
    let sql = `
            SELECT 
                p.id, p.name, p.brand,
                (SELECT MIN(price) FROM producto_variaciones WHERE producto_id = p.id) as starting_price,
                (SELECT imageUrl FROM producto_imagenes WHERE producto_id = p.id ORDER BY display_order ASC LIMIT 1) as mainImageUrl
            FROM productos p
            JOIN users u ON p.seller_id = u.id
            WHERE u.isActive = TRUE AND p.status = 'activo' 
        `
    const values = []
    const whereClauses = []

    if (filters.search) {
      whereClauses.push('(p.name LIKE ? OR p.brand LIKE ?)')
      values.push(`%${filters.search}%`, `%${filters.search}%`)
    }

    if (filters.categoryId) {
      whereClauses.push('p.category_id = ?')
      values.push(filters.categoryId)
    }
    if (filters.minPrice) {
      whereClauses.push('p.price >= ?')
      values.push(filters.minPrice)
    }
    if (filters.maxPrice) {
      whereClauses.push('p.price <= ?')
      values.push(filters.maxPrice)
    }

    if (whereClauses.length > 0) {
      sql += ` AND ${whereClauses.join(' AND ')}`
    }

    // --- Construcción dinámica de la cláusula ORDER BY ---
    const allowedSortBy = ['price', 'name', 'created_at'] // Campos permitidos para ordenar
    const sortBy = allowedSortBy.includes(filters.sortBy) ? `p.${filters.sortBy}` : 'p.created_at'
    const order = filters.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    sql += ` ORDER BY ${sortBy} ${order}`

    // --- Ejecución de la consulta ---
    const [rows] = await pool.query(sql, values)
    return rows
  }
}
