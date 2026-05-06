import express from 'express';
import { db } from '../db.js';
import nodemailer from 'nodemailer';

export const router = express.Router();

// Configurar transporte de email (Gmail con App Password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Generar código de 6 dígitos
function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /password-reset/request — Enviar código al email
router.post('/request', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email requerido.' });

        // Buscar usuario por email
        const [users] = await db.query('SELECT user_id, name, email FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (!users.length) {
            // Por seguridad, no revelamos si el email existe o no
            return res.json({ success: true, message: 'Si el email existe, recibirás un código.' });
        }

        const user = users[0];
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '); // UTC

        // Invalidar códigos anteriores
        await db.query('UPDATE password_resets SET used = TRUE WHERE user_id = ? AND used = FALSE', [user.user_id]);

        // Guardar nuevo código
        await db.query(
            'INSERT INTO password_resets (user_id, code, expires_at) VALUES (?, ?, ?)',
            [user.user_id, code, expiresAt]
        );

        // Enviar email
        await transporter.sendMail({
            from: `"Neverita App" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '🔑 Código de recuperación - Neverita',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #FF9F43, #F97316); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 1.8rem;">🍽️ Neve<span style="font-weight: 300;">rita</span></h1>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <p style="color: #555; font-size: 1rem; margin-bottom: 8px;">Hola <strong>${user.name}</strong>,</p>
                        <p style="color: #777; font-size: 0.95rem;">Tu código de recuperación es:</p>
                        <div style="background: #FFF7ED; border: 2px dashed #FFD9A0; border-radius: 14px; padding: 20px; margin: 20px 0;">
                            <span style="font-size: 2.5rem; font-weight: 800; letter-spacing: 10px; color: #F97316;">${code}</span>
                        </div>
                        <p style="color: #999; font-size: 0.85rem;">Este código expira en <strong>15 minutos</strong>.</p>
                        <p style="color: #bbb; font-size: 0.8rem; margin-top: 20px;">Si no solicitaste este cambio, ignora este correo.</p>
                    </div>
                </div>
            `,
        });

        console.log(`📧 Código enviado a ${user.email}`);
        res.json({ success: true, message: 'Código enviado a tu correo.' });
    } catch (err) {
        console.error('❌ Error enviando email:', err);
        next(err);
    }
});

// POST /password-reset/verify — Verificar código y cambiar contraseña
router.post('/verify', async (req, res, next) => {
    try {
        const { email, code, new_password } = req.body;
        if (!email || !code || !new_password) {
            return res.status(400).json({ error: 'Email, código y nueva contraseña requeridos.' });
        }

        // Buscar usuario
        const [users] = await db.query('SELECT user_id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (!users.length) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const userId = users[0].user_id;

        // Buscar código válido
        const [resets] = await db.query(
            'SELECT * FROM password_resets WHERE user_id = ? AND code = ? AND used = FALSE AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC LIMIT 1',
            [userId, code]
        );

        if (!resets.length) {
            return res.status(400).json({ error: 'Código inválido o expirado.' });
        }

        // Marcar código como usado
        await db.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [resets[0].id]);

        // Actualizar contraseña
        await db.query('UPDATE users SET password = ? WHERE user_id = ?', [new_password, userId]);

        console.log(`✅ Contraseña cambiada para user_id=${userId}`);
        res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
    } catch (err) {
        next(err);
    }
});
