import pool from './database.js'

export class CategoryRepository {
  /**
     * Crea una nueva categoría.
     * @param {object} data - Contiene name y description.
     * @returns {Promise<object>} - La categoría recién creada.
     */
  static async create ({ name, description }) {
    // Verificamos si la categoría ya existe para evitar duplicados por la restricción UNIQUE
    const [existing] = await pool.query('SELECT id FROM categorias WHERE name = ?', [name])
    if (existing.length > 0) {
      const err = new Error('Ya existe una categoría con ese nombre.')
      err.status = 409 // Conflict
      throw err
    }

    const [result] = await pool.query(
      'INSERT INTO categorias (name, description) VALUES (?, ?)',
      [name, description]
    )
    const id = result.insertId
    return { id, name, description }
  }

  /**
     * Obtiene todas las categorías de la base de datos.
     * @returns {Promise<Array<object>>}
     */
  static async getAll () {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY name ASC')
    return rows
  }

  /**
     * Encuentra una categoría por su ID.
     * @param {number} id - El ID de la categoría.
     * @returns {Promise<object|undefined>}
     */
  static async findById (id) {
    const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id])
    return rows[0]
  }

  /**
     * Actualiza una categoría existente.
     * @param {number} id - El ID de la categoría a actualizar.
     * @param {object} data - Contiene name y/o description.
     * @returns {Promise<object>} - La categoría actualizada.
     */
  static async update (id, { name, description }) {
    const fields = []
    const values = []

    if (name !== undefined) {
      fields.push('name = ?')
      values.push(name)
    }
    if (description !== undefined) {
      fields.push('description = ?')
      values.push(description)
    }

    if (fields.length === 0) {
      return this.findById(id) // No hay nada que actualizar
    }

    values.push(id) // para el WHERE

    await pool.query(`UPDATE categorias SET ${fields.join(', ')} WHERE id = ?`, values)
    return this.findById(id)
  }

  /**
     * Elimina una categoría.
     * @param {number} id - El ID de la categoría a eliminar.
     * @returns {Promise<boolean>} - true si se eliminó, false si no se encontró.
     */
  static async remove (id) {
    const [result] = await pool.query('DELETE FROM categorias WHERE id = ?', [id])
    return result.affectedRows > 0
  }
}
