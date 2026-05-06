async function testSerpApi() {
    const apiKey = "d77fe5930c0099a615f90ee741fa0d65bcb4564506b8e4c83ea8333c84e57db4";

    const queries = ["Pasta con Pollo", "Pabellon Criollo", "Arepas venezolanas", "Sushi"];

    for (const q of queries) {
        const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(q + " receta")}&num=1&api_key=${apiKey}`;
        
        try {
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.images_results && data.images_results.length > 0) {
                console.log(`✅ "${q}" → ${data.images_results[0].original}`);
            } else if (data.error) {
                console.log(`❌ "${q}" → Error: ${data.error}`);
            } else {
                console.log(`❌ "${q}" → Sin resultados`);
            }
        } catch (err) {
            console.error(`❌ "${q}" → Error:`, err.message);
        }
    }
}

testSerpApi();
