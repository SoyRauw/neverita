import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de entorno (Tu fix que ya funcionó)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Lista de posibles nombres actuales (Google cambia esto a menudo)
const candidateModels = [
  "gemini-1.5-flash",       // La opción más rápida y nueva
  "gemini-1.5-pro",         // La opción más potente
  "gemini-1.0-pro",         // El reemplazo directo del antiguo gemini-pro
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest"
];

async function findWorkingModel() {
  console.log("🔍 Buscando un modelo compatible para tu API Key...\n");

  for (const modelName of candidateModels) {
    process.stdout.write(`Probando modelo: '${modelName}'... `);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      // Intentamos una generación mínima
      await model.generateContent("Test");
      
      console.log("✅ ¡FUNCIONA!");
      console.log(`\n🎉 ¡ENCONTRADO! Debes usar el nombre: "${modelName}"`);
      console.log("Copiaré este nombre en tu código automáticamente si tú quieres,");
      console.log("pero por ahora, ve a 'routes/ai_recipes.js' y cambia la línea del modelo a:");
      console.log(`const model = genAI.getGenerativeModel({ model: "${modelName}" });`);
      return; // Terminamos apenas encontremos uno
    } catch (error) {
      console.log("❌ Falló (404 Not Found o No soportado)");
    }
  }

  console.log("\n⚠️ Ninguno de los modelos estándar funcionó. Revisa tu facturación en Google Cloud o si la API está habilitada en tu región.");
}

findWorkingModel();