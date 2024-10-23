require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, 'keywords.txt');

const auth = {
    username: process.env.DATAFORSEO_USERNAME,
    password: process.env.DATAFORSEO_PASSWORD
}
const location = 'United States';
const timeRange = 'past_5_years';
const type = 'web';
const categoryCode = '0';

const data = fs.readFileSync(filePath, 'utf8');

const keywordsList = data.split(/\r?\n/);


// Delay utility function to pause between batches
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Función para crear una tarea
async function sendTasks({ tasks, auth }) {
    // console.log(tasks)
    const response = await axios({
        method: 'post',
        url: 'https://api.dataforseo.com/v3/keywords_data/google_trends/explore/task_post',
        auth,
        data:  tasks.filter(task => task.keywords.length > 0) , // Enviar array de tareas
        timeout: 10000,
        headers: {
            'content-type': 'application/json'
        },
    });

    return response;
}

// Función para mostrar la barra de progreso en la consola
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

// Wrapper para enviar tareas en lotes y mostrar el progreso
async function sendTasksInBatches(keywordsList, location, timeRange, type, categoryCode, auth) {
    const maxTasksPerCall = 100;
    const maxKeywordsPerTask = 5;
    const maxCallsPerMinute = 2000;
    const delayBetweenBatches = 60000 / maxCallsPerMinute; // Delay para respetar el límite de tasa (milisegundos)

    let allResponses = [];
    let tasksCompleted = 0;

    // Agrupar las keywords en lotes de hasta 5 por tarea
    const tasks = [];
    for (let i = 0; i < keywordsList.length; i += maxKeywordsPerTask) {
        tasks.push({
            keywords: keywordsList.slice(i, i + maxKeywordsPerTask)
        });
    }

    const totalTasks = tasks.length; // Total de tareas

    // Procesar las tareas en lotes de hasta 100 por llamada
    for (let i = 0; i < tasks.length; i += maxTasksPerCall) {
        const batch = tasks.slice(i, i + maxTasksPerCall);

        // Agrupar las tareas bajo la clave `tasks` y añadir los parámetros estáticos
        const groupedTasks = batch.map(task => ({
            keywords: task.keywords,
            location_name: location,
            time_range: timeRange,
            type,
            category_code:categoryCode,
            tag: 'ips'
        }));

        // Enviar el lote de tareas
        try {
            const responses = await sendTasks({ tasks: groupedTasks, auth });
            allResponses = allResponses.concat(responses);
            tasksCompleted += groupedTasks.length;

            // Mostrar progreso en la consola
            displayProgress(tasksCompleted, totalTasks);
        } catch (error) {
            console.error('Error al enviar el lote', error);
        }

        // Esperar antes de enviar el siguiente lote
        await delay(delayBetweenBatches);
    }

    // Completar al 100% la barra de progreso
    displayProgress(totalTasks, totalTasks);
    console.log('\nTareas completadas.');

    return allResponses;
}

// Enviar las tareas
sendTasksInBatches(keywordsList, location, timeRange, type, categoryCode, auth)
    .then(responses => {
        console.log('Paths de las tareas:', responses);
    })
    .catch(error => {
        console.error('Error al enviar las tareas:', error);
    });
