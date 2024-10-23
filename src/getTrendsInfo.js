require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, 'pendingTasks.txt');
const data = fs.readFileSync(filePath, 'utf8');
const tasksIds = data.split(/\r?\n/).filter(taskId => Boolean(taskId));

const auth = {
    username: process.env.DATAFORSEO_USERNAME,
    password: process.env.DATAFORSEO_PASSWORD
};

// Variables para la barra de progreso
let completedTasks = 0;
const totalTasks = tasksIds.length;
const batchSize = 100;  // Tamaño de los lotes, ajusta según el límite de concurrencia que quieras
const maxRetries = 3;   // Número máximo de intentos por cada tarea fallida

// Función para realizar una solicitud de tarea individual
async function fetchTask(taskId, retries = 0) {
    try {
        const response = await axios({
            method: 'get',
            url: 'https://api.dataforseo.com/v3/keywords_data/google_trends/explore/task_get/' + taskId,
            auth,
            headers: {
                'content-type': 'application/json'
            }
        });

        // Actualiza el progreso cuando se complete la tarea
        completedTasks += 1;
        displayProgress(completedTasks, totalTasks);

        return response.data.tasks;
    } catch (error) {
        if (retries < maxRetries) {
            console.log(`Retrying task ${taskId}, attempt ${retries + 1}`);
            return await fetchTask(taskId, retries + 1);
        } else {
            console.error(`Failed to fetch task ${taskId} after ${maxRetries} attempts`);
            return null; // Devuelve null si falla después de varios intentos
        }
    }
}

// Función para procesar las tareas en lotes
async function sendTasksInBatches(tasks, batchSize) {
    const results = [];
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);

        // Ejecuta las tareas del lote en paralelo, pero en lotes pequeños
        const batchResults = await Promise.all(batch.map(taskId => fetchTask(taskId)));

        // Filtrar las tareas fallidas (null) y agregar los resultados exitosos
        results.push(...batchResults.filter(Boolean));
    }
    return results;
}

function generateCSV(nestedData) {
    let csvContent = '';

    // Loop through the outer array
    nestedData.forEach(group => {
        group
            .filter(task => task?.result?.[0]?.keywords && task?.result?.[0]?.items?.[0]?.data ? true : false)
            .forEach(task => {
                const keywords = task.result[0].keywords;
                const items = task.result[0].items[0].data;

                // Extract values for each keyword over time
                const values = items.map(item => item.values);

                // Create rows for each keyword and append to CSV content
                keywords.forEach((keyword, index) => {
                    const row = [keyword, ...values.map(val => val[index])].join(',');
                    csvContent += row + '\n';
                });
            });
    });

    return csvContent;
}

function displayProgress(current, total) {
    const barLength = 40; // Tamaño de la barra de progreso en la consola
    const progress = (current / total);
    const filledBarLength = Math.round(barLength * progress);
    const emptyBarLength = barLength - filledBarLength;

    const progressBar = `[${'='.repeat(filledBarLength)}${' '.repeat(emptyBarLength)}]`;
    const percentage = (progress * 100).toFixed(2);
    
    // Borrar la línea anterior y escribir la nueva barra de progreso
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Progress: ${progressBar} ${percentage}%`);
}

// Procesa las tareas en lotes y guarda el resultado en un archivo CSV
sendTasksInBatches(tasksIds, batchSize)
    .then(trend => {
        const csv = generateCSV(trend);
        const filePath = path.join(__dirname, 'trends.csv');

        fs.writeFile(filePath, csv, (err) => {
            if (err) {
                console.error('Error:', err);
            } else {
                console.log('File saved');
            }
        });
    });
