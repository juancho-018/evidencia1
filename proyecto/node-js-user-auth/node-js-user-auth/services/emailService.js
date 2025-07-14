import nodemailer from 'nodemailer'

// Función para crear un transportador de correo reutilizable
async function createTransporter () {
  // Para desarrollo, usamos una cuenta de Ethereal
  // En producción, aquí configurarías tu servicio de email real (SendGrid, etc.)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
  return transporter
}

// Función para enviar el correo de reseteo de contraseña
export async function sendPasswordResetEmail (userEmail, resetToken) {
  const transporter = await createTransporter()

  // El link que el usuario recibirá. En producción debería apuntar a tu frontend.
  const resetUrl = `http://localhost:3000/reset-password-page/${resetToken}`

  const mailOptions = {
    from: '"Tu Aplicación" <noreply@tuapp.com>',
    to: userEmail, // En un caso real, aquí iría el email del usuario
    subject: 'Restablecimiento de contraseña',
    text: `Has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace o pégalo en tu navegador para completar el proceso: \n\n${resetUrl}\n\nSi no solicitaste esto, por favor ignora este correo.`,
    html: `<p>Has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace para completar el proceso:</p><a href="${resetUrl}">${resetUrl}</a><p>Si no solicitaste esto, por favor ignora este correo.</p>`
  }

  // Enviar el correo
  const info = await transporter.sendMail(mailOptions)

  console.log('Correo de reseteo enviado: %s', info.messageId)
  // URL de previsualización de Ethereal. ¡Muy útil para desarrollo!
  console.log('URL de previsualización: %s', nodemailer.getTestMessageUrl(info))
}
