// profile-repository.js
import pool from './database.js'

export class ProfileRepository {
  /**
     * Encuentra un perfil de usuario por el ID del usuario.
     * @param {string} userId - El ID del usuario.
     * @returns {Promise<object|undefined>} - El perfil del usuario o undefined si no existe.
     */
  static async findByUserId (userId) {
    const [rows] = await pool.query('SELECT * FROM perfiles WHERE user_id = ?', [userId])
    return rows[0]
  }

  /**
     * Crea o actualiza un perfil de usuario.
     * Utiliza la sintaxis ON DUPLICATE KEY UPDATE de MySQL para simplificar la lógica.
     * @param {string} userId - El ID del usuario.
     * @param {object} profileData - Los datos del perfil a guardar.
     * @returns {Promise<object>} - El perfil actualizado.
     */
  static async upsert (userId, profileData) {
    // Filtramos los campos para asegurarnos de que solo se incluyen los permitidos
    const allowedFields = ['nombre_completo', 'telefono', 'direccion', 'ciudad', 'pais', 'codigo_postal']
    const dataToInsert = { user_id: userId }
    const fieldsForUpdate = []

    allowedFields.forEach(field => {
      if (profileData[field] !== undefined) {
        dataToInsert[field] = profileData[field]
        fieldsForUpdate.push(`${field} = VALUES(${field})`)
      }
    })

    if (Object.keys(dataToInsert).length <= 1) {
      // No hay datos para actualizar más allá del user_id
      return this.findByUserId(userId)
    }

    const sql = `
            INSERT INTO perfiles SET ?
            ON DUPLICATE KEY UPDATE ${fieldsForUpdate.join(', ')}
        `

    await pool.query(sql, [dataToInsert])

    return this.findByUserId(userId)
  }
}
