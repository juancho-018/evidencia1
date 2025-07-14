// ai-repository.js
import { AIService } from './ai-service.js'
import { ProductRepository } from './product-repository.js'
import { OrderRepository } from './order-repository.js'
import { SimilarityService } from './similarity-service.js'

export class AIRepository {
  static async getSmartAnswer (question, user, history = []) {
    const lowerCaseQuestion = question.toLowerCase()

    // ANÁLISIS DE INTENCIÓN (DEL MÁS ESPECÍFICO AL MÁS GENERAL)

    const trendKeywords = ['tendencia', 'marcas populares', 'categorías populares', 'qué se vende más']
    if (user && user.role === 'admin' && trendKeywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return AIRepository.handleTrendAnalysisQuestion(question, history)
    }

    const adminReportKeywords = ['reporte', 'resumen de ventas', 'ingresos', 'cómo vamos', 'analítica']
    if (user && user.role === 'admin' && adminReportKeywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return AIRepository.handleAdminReportQuestion(question, history)
    }

    const marketingKeywords = ['descripción', 'marketing', 'texto para', 'ayúdame a escribir', 'publicación']
    if (user && user.role === 'vendedor' && marketingKeywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return AIRepository.handleDescriptionOptimizerQuestion(question, history)
    }

    const pricingKeywords = ['precio', 'vender por', 'cuánto cuesta', 'valor de mercado', 'a qué precio']
    if (user && user.role === 'vendedor' && pricingKeywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return AIRepository.handlePriceAdvisorQuestion(question, history)
    }

    const sellerKeywords = ['mis ventas', 'mi rendimiento', 'cuánto vendí', 'mi producto más vendido']
    if (user && user.role === 'vendedor' && sellerKeywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return AIRepository.handleSellerPerformanceQuestion(question, user.id, history)
    }

    const similarityKeywords = ['parece a', 'similar a', 'alternativa a', 'dupe de', 'recuerda a']
    if (similarityKeywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return AIRepository.handleSimilarityQuestion(question, history)
    }

    const thematicKeywords = ['recomienda', 'regalo', 'perfecto para', 'ocasión', 'estilo', 'sugiereme', 'busco algo']
    if (thematicKeywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return AIRepository.handleThematicQuestion(question, history)
    }

    const businessDataKeywords = ['stock', 'disponible', 'inventario', 'popular', 'más vendido', 'top ventas', 'agotarse']
    if (businessDataKeywords.some(keyword => lowerCaseQuestion.includes(keyword))) {
      return AIRepository.handleBusinessDataQuestion(question, history)
    }

    if (user && (lowerCaseQuestion.includes('pedido') || lowerCaseQuestion.includes('orden') || lowerCaseQuestion.includes('compra'))) {
      return AIRepository.handleOrderQuestion(question, user.id, history)
    }

    if (lowerCaseQuestion.includes('política') || lowerCaseQuestion.includes('devolución') || lowerCaseQuestion.includes('vender')) {
      return AIRepository.handlePolicyQuestion(question, history)
    }

    return AIRepository.handleProductQuestion(question, history)
  }

  // --- MÉTODOS INTERNOS CORREGIDOS ---
  // Cada método ahora prepara un 'systemPrompt' y llama a 'AIService.generateAnswer'

  static async handleTrendAnalysisQuestion (question, history) {
    const trendData = await OrderRepository.getTrendData()
    const systemPrompt = `
            Actúa como un analista de inteligencia de negocio. Tu tarea es interpretar los datos de ventas que te proporciono para identificar tendencias de mercado.
            Contexto: ${JSON.stringify(trendData, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handleAdminReportQuestion (question, history) {
    let period = 'all'
    if (question.toLowerCase().includes('semana')) period = 'week'
    if (question.toLowerCase().includes('mes')) period = 'month'
    if (question.toLowerCase().includes('hoy')) period = 'today'
    const salesData = await OrderRepository.getSalesSummary(period)
    const systemPrompt = `
            Actúa como un analista jefe de negocios. Tu tarea es presentar un resumen ejecutivo claro basado en los siguientes datos de ventas para el período '${period}'.
            Contexto: ${JSON.stringify(salesData, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handleDescriptionOptimizerQuestion (question, history) {
    const allProducts = await ProductRepository.getAll({})
    let targetProduct = null
    for (const product of allProducts) {
      if (question.toLowerCase().includes(product.name.toLowerCase())) {
        targetProduct = product
        break
      }
    }
    if (!targetProduct) return 'Para ayudarte a escribir una descripción, necesito que me indiques el nombre de uno de tus perfumes.'
    const fullProductDetails = await ProductRepository.findById(targetProduct.id)
    const systemPrompt = `
            Actúa como un copywriter de marketing experto en perfumería. Tu tarea es generar una descripción de producto persuasiva basada en los siguientes datos.
            Contexto: ${JSON.stringify(fullProductDetails, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handlePriceAdvisorQuestion (question, history) {
    const allProducts = await ProductRepository.getAll({})
    let targetProduct = null
    for (const product of allProducts) {
      if (question.toLowerCase().includes(product.name.toLowerCase())) {
        targetProduct = product
        break
      }
    }
    if (!targetProduct) return 'Para darte un consejo sobre precios, necesito que me indiques el nombre de un perfume.'
    const fullTargetProduct = await ProductRepository.findById(targetProduct.id)
    if (!fullTargetProduct || !fullTargetProduct.category_id) return `El perfume '${targetProduct.name}' no tiene una categoría asignada, por lo que no puedo compararlo.`
    const marketData = await ProductRepository.getMarketPriceData(fullTargetProduct.category_id)
    if (marketData.competitorCount < 1) return `El perfume '${targetProduct.name}' pertenece a una categoría única. No tengo datos para comparar.`
    const systemPrompt = `
            Actúa como un estratega de precios. Tu tarea es dar una recomendación de precio basada en los siguientes datos de mercado.
            Contexto: ${JSON.stringify(marketData, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handleSellerPerformanceQuestion (question, sellerId, history) {
    const salesData = await OrderRepository.getSalesDataBySeller(sellerId)
    if (salesData.length === 0) return 'Aún no registramos ventas para tus productos, pero ¡sigue así!'
    const systemPrompt = `
            Actúa como un analista de negocios personal. Tu tarea es analizar el rendimiento de ventas de un vendedor basado en los siguientes datos.
            Contexto: ${JSON.stringify(salesData, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handleSimilarityQuestion (question, history) {
    const allProducts = await ProductRepository.getAll({})
    let targetProduct = null
    for (const product of allProducts) {
      if (question.toLowerCase().includes(product.name.toLowerCase())) {
        targetProduct = product
        break
      }
    }
    if (!targetProduct) return 'Para poder comparar, necesito que me digas un nombre de perfume de nuestro catálogo.'
    const similarProducts = SimilarityService.findSimilarProducts(targetProduct, allProducts)
    if (similarProducts.length === 0) return `No encuentro otros perfumes en nuestro catálogo con notas lo suficientemente similares a '${targetProduct.name}'.`
    const systemPrompt = `
            Actúa como un sommelier de perfumes. Tu tarea es encontrar alternativas a un perfume específico basado en los siguientes datos.
            Contexto: El cliente busca alternativas para '${targetProduct.name}'. Las opciones son: ${JSON.stringify(similarProducts, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handleThematicQuestion (question, history) {
    const allProducts = await ProductRepository.getAll({})
    const systemPrompt = `
            Actúa como un asesor de fragancias de lujo. Tu tarea es hacer una recomendación personalizada basada en nuestro catálogo.
            Contexto: Nuestro catálogo es el siguiente: ${JSON.stringify(allProducts, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handleBusinessDataQuestion (question, history) {
    const allProducts = await ProductRepository.getAll({})
    const popularityData = await OrderRepository.getPopularityData()
    const productsWithSales = allProducts.map(product => ({ ...product, totalSold: popularityData.find(p => p.producto_id === product.id)?.totalSold || 0 }))
    const systemPrompt = `
            Actúa como un analista de datos. Tu tarea es responder preguntas sobre inventario y popularidad usando los siguientes datos.
            Contexto: ${JSON.stringify(productsWithSales, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handleOrderQuestion (question, userId, history) {
    const orders = await OrderRepository.findOrdersByUserId(userId)
    if (orders.length === 0) return 'Veo que preguntas sobre pedidos, pero parece que aún no has realizado ninguna compra.'
    const systemPrompt = `
            Actúa como un asistente de soporte personal. Tu tarea es responder preguntas sobre el historial de pedidos de un cliente.
            Contexto: El historial de pedidos es: ${JSON.stringify(orders, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handlePolicyQuestion (question, history) {
    const sitePolicies = {
      devolucion: 'Nuestra política de devoluciones permite devolver cualquier producto sin abrir dentro de los 15 días posteriores a la entrega para obtener un reembolso completo.',
      vender: "Para ser vendedor, ve a tu perfil y selecciona la opción 'Solicitar rol de vendedor'."
    }
    const systemPrompt = `
            Actúa como un asistente de información. Tu tarea es responder preguntas sobre las políticas del sitio.
            Contexto: ${JSON.stringify(sitePolicies, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }

  static async handleProductQuestion (question, history) {
    const products = await ProductRepository.getAll({})
    const systemPrompt = `
            Actúa como un asistente experto en nuestro catálogo de perfumes. Tu conocimiento se limita a la información que te proporciono.
            Contexto: Nuestro catálogo es: ${JSON.stringify(products, null, 2)}
        `
    return AIService.generateAnswer(systemPrompt, history, question)
  }
}
