// similarity-service.js

export class SimilarityService {
  /**
     * Parsea un string de notas separadas por comas en un array de notas individuales.
     * @param {string} notesString - Ejemplo: "Bergamota, pimienta, ambroxan"
     * @returns {Set<string>} - Un Set con las notas: {"bergamota", "pimienta", "ambroxan"}
     */
  static #parseNotes (notesString) {
    if (!notesString || typeof notesString !== 'string') {
      return new Set()
    }
    return new Set(notesString.toLowerCase().split(',').map(note => note.trim()))
  }

  /**
     * Calcula un puntaje de similitud entre dos sets de notas (Algoritmo de Jaccard).
     * @param {Set<string>} set1 - Notas del primer perfume.
     * @param {Set<string>} set2 - Notas del segundo perfume.
     * @returns {number} - Un puntaje de 0 a 1 (1 significa identidad total).
     */
  static #calculateSimilarity (set1, set2) {
    const intersection = new Set([...set1].filter(note => set2.has(note)))
    const union = new Set([...set1, ...set2])

    if (union.size === 0) {
      return 0
    }

    return intersection.size / union.size
  }

  /**
     * Encuentra y ordena los productos más similares a un producto objetivo.
     * @param {object} targetProduct - El perfume que el usuario quiere comparar.
     * @param {Array<object>} allProducts - La lista de todos los productos del catálogo.
     * @returns {Array<object>} - Una lista de productos similares, ordenados por puntaje de similitud.
     */
  static findSimilarProducts (targetProduct, allProducts) {
    const targetNotes = this.#parseNotes(targetProduct.notes)
    if (targetNotes.size === 0) {
      return [] // No podemos comparar si el perfume objetivo no tiene notas definidas
    }

    const similarProducts = []

    allProducts.forEach(product => {
      // Nos aseguramos de no comparar un producto consigo mismo
      if (product.id === targetProduct.id) {
        return
      }

      const productNotes = this.#parseNotes(product.notes)
      const similarityScore = this.#calculateSimilarity(targetNotes, productNotes)

      // Consideramos "similar" si el puntaje es mayor a un umbral (ej. 20%)
      if (similarityScore > 0.20) {
        similarProducts.push({
          ...product,
          similarity: parseFloat(similarityScore.toFixed(2)) // Añadimos el puntaje al objeto
        })
      }
    })

    // Ordenamos los resultados del más al menos similar
    return similarProducts.sort((a, b) => b.similarity - a.similarity)
  }
}
