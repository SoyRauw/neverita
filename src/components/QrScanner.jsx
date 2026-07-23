import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from '@phosphor-icons/react';

// Escáner de QR con la cámara (funciona en Android e iOS Safari). Al leer un código
// llama onResult(texto). El texto suele ser la URL de invitación con ?join=CÓDIGO.
const QrScanner = ({ onResult, onClose }) => {
    const scannerRef = useRef(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const scanner = new Html5Qrcode('nv-qr-reader', { verbose: false });
        scannerRef.current = scanner;
        let done = false;
        scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
                if (done) return;
                done = true;
                scanner.stop().then(() => scanner.clear()).catch(() => {});
                onResult(decodedText);
            },
            () => { /* errores por frame: ignorar */ }
        ).catch(() => setError('No se pudo abrir la cámara. Revisa los permisos del navegador.'));

        return () => {
            const s = scannerRef.current;
            if (s) { try { s.stop().then(() => s.clear()).catch(() => {}); } catch { /* ya detenido */ } }
        };
    }, []);

    return (
        <div className="modal-overlay" style={{ zIndex: 5000 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 18, width: 'min(360px, calc(100% - 32px))', textAlign: 'center', boxShadow: '0 30px 70px rgba(0,0,0,0.35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <strong style={{ color: '#2A2118', display: 'inline-flex', alignItems: 'center', gap: 7 }}><Camera size={20} weight="fill" color="#FF7F50" /> Escanear código QR</strong>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={22} color="#9b8d7c" /></button>
                </div>
                <div id="nv-qr-reader" style={{ width: '100%', borderRadius: 14, overflow: 'hidden' }} />
                {error
                    ? <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: 10, fontWeight: 600 }}>{error}</p>
                    : <p style={{ color: '#9b8d7c', fontSize: '0.82rem', marginTop: 10 }}>Apunta al QR de invitación de la familia.</p>}
            </div>
        </div>
    );
};

export default QrScanner;
