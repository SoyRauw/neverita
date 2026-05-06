import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
    try {
        const ingredients = ["arroz"];
        const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCd8SV8xa46WFL0ViBXHm5e1ec60m09MkA";

        const systemPrompt = `
            Eres un Chef experto en "Cocina de Aprovechamiento".
            Tienes EXCLUSIVAMENTE estos ingredientes en la nevera: ${ingredients.join(', ')}.
            (Asume que también tienes básicos: sal, aceite, agua, pimienta).

            TU MISIÓN:
            Sugiere 3 nombres de recetas que se puedan cocinar PRINCIPALMENTE con esos ingredientes.
            NO sugieras platos que requieran ingredientes principales que no están en la lista.
            
            Responde SOLO JSON:
            { "suggestions": [{ "title": "Nombre del Plato", "description": "Descripción corta de 10 palabras" }, ...] }
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(systemPrompt);
        console.log(result.response.text());

    } catch (error) {
        console.error("❌ Error en suggest:", error);
    }
}
test();
