// order-repository.js
import pool from './database.js'
import crypto from 'crypto'
import { CartRepository } from './cart-repository.js'

export class OrderRepository {
  /**
     * Crea un pedido a partir del carrito de un usuario.
     * Utiliza una transacción para garantizar la integridad de los datos.
     */
  static async createFromCart (userId, shippingAddress, paymentIntentId) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const cart = await CartRepository.findOrCreateCartByUserId(userId)
      const items = await CartRepository.getCartContents(cart.id)
      if (items.length === 0) throw new Error('El carrito está vacío.')

      let total = 0
      for (const item of items) {
        const [[variation]] = await connection.query('SELECT stock FROM producto_variaciones WHERE id = ? FOR UPDATE', [item.variationId])
        if (!variation || variation.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${item.name} (${item.size_ml}ml)`)
        }
        total += item.price * item.quantity
      }

      const orderId = crypto.randomUUID()
      await connection.query(
        'INSERT INTO pedidos (id, user_id, total, shipping_address, payment_intent_id) VALUES (?, ?, ?, ?, ?)',
        [orderId, userId, total, shippingAddress, paymentIntentId]
      )

      for (const item of items) {
        const orderItemId = crypto.randomUUID()
        await connection.query(
          'INSERT INTO pedido_items (id, pedido_id, variacion_id, quantity, price_at_purchase, product_name_at_purchase) VALUES (?, ?, ?, ?, ?, ?)',
          [orderItemId, orderId, item.variationId, item.quantity, item.price, `${item.name} (${item.size_ml}ml)`]
        )
        await connection.query(
          'UPDATE producto_variaciones SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.variationId]
        )
      }

      await connection.query('DELETE FROM carrito_items WHERE carrito_id = ?', [cart.id])
      await connection.commit()
      return { id: orderId, user_id: userId, total, status: 'Procesando' }
    } catch (error) {
      await connection.rollback()
      console.error('Error en la transacción de pedido:', error.message)
      throw new Error(`No se pudo procesar el pedido: ${error.message}`)
    } finally {
      connection.release()
    }
  }

  /**
     * Encuentra todos los pedidos de un usuario específico.
     */
  static async findOrdersByUserId (userId) {
    const [rows] = await pool.query('SELECT * FROM pedidos WHERE user_id = ? ORDER BY created_at DESC', [userId])
    return rows
  }

  /**
     * Encuentra todos los pedidos en el sistema (para el administrador).
     */
  static async findAllOrders () {
    const [rows] = await pool.query(`
            SELECT p.id, p.total, p.status, p.created_at, u.username AS customerName 
            FROM pedidos p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `)
    return rows
  }

  /**
     * Actualiza el estado de un pedido específico.
     */
  static async updateStatus (orderId, status) {
    await pool.query('UPDATE pedidos SET status = ? WHERE id = ?', [status, orderId])
    const [updatedOrder] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [orderId])
    return updatedOrder[0]
  }

  /**
     * Obtiene datos de ventas para determinar la popularidad de los productos.
     */
  static async getPopularityData () {
    const [rows] = await pool.query(`
            SELECT producto_id, SUM(quantity) as totalSold
            FROM pedido_items
            GROUP BY producto_id
            ORDER BY totalSold DESC
        `)
    return rows
  }

  /**
     * Obtiene datos de ventas para un vendedor específico.
     */
  static async getSalesDataBySeller (sellerId) {
    const [rows] = await pool.query(`
            SELECT oi.producto_id, p.name AS productName, SUM(oi.quantity) AS totalSold
            FROM pedido_items oi
            JOIN producto_variaciones pv ON oi.variacion_id = pv.id
            JOIN productos p ON pv.producto_id = p.id
            WHERE p.seller_id = ?
            GROUP BY oi.producto_id, p.name
            ORDER BY totalSold DESC
        `, [sellerId])
    return rows
  }

  /**
     * Obtiene un resumen de las ventas para un período de tiempo.
     */
  static async getSalesSummary (period) {
    let dateFilter = ''
    switch (period) {
      case 'week': dateFilter = 'AND o.created_at >= NOW() - INTERVAL 7 DAY'; break
      case 'month': dateFilter = 'AND o.created_at >= NOW() - INTERVAL 1 MONTH'; break
      case 'today': dateFilter = 'AND DATE(o.created_at) = CURDATE()'; break
    }
    const [summary] = await pool.query(`SELECT COUNT(id) as totalOrders, SUM(total) as totalRevenue FROM pedidos o WHERE 1=1 ${dateFilter.replace('o.', '')}`)
    const [categoryPerformance] = await pool.query(`
            SELECT c.name as categoryName, SUM(oi.quantity) as unitsSold, SUM(oi.price_at_purchase * oi.quantity) as categoryRevenue 
            FROM pedido_items oi
            JOIN pedidos o ON oi.pedido_id = o.id
            JOIN producto_variaciones pv ON oi.variacion_id = pv.id
            JOIN productos p ON pv.producto_id = p.id
            JOIN categorias c ON p.category_id = c.id
            WHERE 1=1 ${dateFilter}
            GROUP BY c.name
            ORDER BY categoryRevenue DESC
        `)
    return { summary: summary[0], categoryPerformance }
  }

  // --- INICIO DE LA CORRECCIÓN ---
  /**
     * Obtiene un resumen de datos para el dashboard de un vendedor específico.
     */
  static async getSellerSummary (sellerId) {
    const [revenue] = await pool.query(`
            SELECT SUM(oi.price_at_purchase * oi.quantity) as totalRevenue
            FROM pedido_items oi
            JOIN producto_variaciones pv ON oi.variacion_id = pv.id
            JOIN productos p ON pv.producto_id = p.id
            WHERE p.seller_id = ?
        `, [sellerId])

    const [products] = await pool.query(`
            SELECT status, COUNT(id) as count 
            FROM productos 
            WHERE seller_id = ? 
            GROUP BY status
        `, [sellerId])

    const summary = {
      revenue: revenue[0]?.totalRevenue || 0,
      activeProducts: products.find(p => p.status === 'activo')?.count || 0,
      pendingProducts: products.find(p => p.status === 'pendiente_aprobacion')?.count || 0,
      newOrders: 0 // Esta lógica requeriría más detalle, por ahora la dejamos en 0
    }
    return summary
  }
  // --- FIN DE LA CORRECCIÓN ---

  /**
     * Obtiene datos agregados para identificar tendencias de marcas y categorías.
     */
  static async getTrendData () {
    const [brandTrends] = await pool.query(`
            SELECT p.brand, SUM(oi.quantity) as totalUnitsSold
            FROM pedido_items oi
            JOIN producto_variaciones pv ON oi.variacion_id = pv.id
            JOIN productos p ON pv.producto_id = p.id
            GROUP BY p.brand
            ORDER BY totalUnitsSold DESC
            LIMIT 5; 
        `)
    const [categoryTrends] = await pool.query(`
            SELECT c.name as categoryName, SUM(oi.quantity) as totalUnitsSold
            FROM pedido_items oi
            JOIN producto_variaciones pv ON oi.variacion_id = pv.id
            JOIN productos p ON pv.producto_id = p.id
            JOIN categorias c ON p.category_id = c.id
            GROUP BY c.name
            ORDER BY totalUnitsSold DESC
            LIMIT 5;
        `)
    return { brandTrends, categoryTrends }
  }
}
