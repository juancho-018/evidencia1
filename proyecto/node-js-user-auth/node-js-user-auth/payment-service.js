// payment-service.js
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export class PaymentService {
  /**
     * Crea una "Intención de Pago" en Stripe.
     * @param {number} amount
     * @param {string} currency
     * @returns {Promise<object>}
     */
  static async createPaymentIntent (amount, currency = 'usd') {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('La clave secreta de Stripe no está configurada.')
    }

    try {
      const amountInCents = Math.round(amount * 100)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        automatic_payment_methods: {
          enabled: true
        }
      })

      return {
        clientSecret: paymentIntent.client_secret
      }
    } catch (error) {
      console.error('Error al crear la intención de pago en Stripe:', error)
      throw new Error('No se pudo iniciar el proceso de pago.')
    }
  }
}
