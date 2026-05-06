import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configurado***' : '❌ NO CONFIGURADO');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

try {
    console.log('🔄 Verificando conexión con Gmail...');
    await transporter.verify();
    console.log('✅ Conexión exitosa! Enviando email de prueba...');
    
    const info = await transporter.sendMail({
        from: `"Neverita App" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // se lo envía a sí mismo
        subject: '🔑 Test de Neverita - Funciona!',
        html: '<h2>Si ves esto, el email funciona correctamente ✅</h2>',
    });
    
    console.log('✅ Email enviado! Message ID:', info.messageId);
} catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('Invalid login')) {
        console.log('\n💡 Solución: La App Password puede estar mal.');
        console.log('   1. Ve a https://myaccount.google.com/apppasswords');
        console.log('   2. Genera una nueva App Password');
        console.log('   3. Cópiala SIN espacios en EMAIL_PASS');
    }
}
