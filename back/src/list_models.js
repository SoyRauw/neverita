import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env correctamente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function checkModels() {
  console.log("📡 Conectando con Google para listar modelos disponibles...");
  console.log(`🔑 Usando Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'NO ENCONTRADA'}`);

  // Endpoint para listar modelos, no para generar
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        console.error("\n❌ ERROR DE ACCESO:");
        console.error(JSON.stringify(data, null, 2));
        console.log("\n⚠️ CONCLUSIÓN: Si ves un error de 'Not Found' o 'User location is not supported', es por tu ubicación.");
        return;
    }

    console.log("\n✅ CONEXIÓN EXITOSA. Google dice que tienes acceso a:");
    if (!data.models || data.models.length === 0) {
        console.log("EMPTY LIST (0 modelos). Tu cuenta no tiene permiso para usar Gemini.");
    } else {
        data.models.forEach(m => {
            // Filtramos solo los que sirven para generar contenido
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                console.log(` - ${m.name.replace('models/', '')}`);
            }
        });
    }

  } catch (error) {
    console.error("❌ Error de red:", error.message);
  }
}

checkModels();