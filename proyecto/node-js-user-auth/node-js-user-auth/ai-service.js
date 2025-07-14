// ai-service.js
import fetch from 'node-fetch'

export class AIService {
  static API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

  /**
     * Envía un prompt y un historial de conversación a la API de Gemini.
     * @param {string} systemPrompt - La instrucción inicial que define el rol y el contexto de la IA.
     * @param {Array<object>} history - El historial de la conversación.
     * @param {string} newQuestion - La nueva pregunta del usuario.
     * @returns {Promise<string>} - La respuesta generada por la IA.
     */
  static async generateAnswer (systemPrompt, history, newQuestion) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('La clave de API de Gemini no está configurada en el archivo .env')
    }

    // Construimos el historial de contenidos para la API
    const contents = [
      ...history,
      {
        role: 'user',
        parts: [{ text: newQuestion }]
      }
    ]

    const payload = {
      contents,
      // Añadimos la instrucción del sistema para guiar a la IA en cada turno
      systemInstruction: {
        parts: {
          text: systemPrompt
        }
      },
      generationConfig: {
        // Configuraciones para la generación de la respuesta
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048
      }
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error desde la API de Gemini:', errorData)
        throw new Error(`Error de la API de IA: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        return 'Lo siento, no pude generar una respuesta en este momento. Por favor, intenta de nuevo.'
      }

      return text
    } catch (error) {
      console.error('Fallo al contactar la API de Gemini:', error)
      throw new Error('No se pudo obtener una respuesta del asistente de IA.')
    }
  }
}
