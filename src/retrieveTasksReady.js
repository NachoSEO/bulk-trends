require('dotenv').config();
const axios = require('axios');

const auth = {
    username: process.env.DATAFORSEO_USERNAME,
    password: process.env.DATAFORSEO_PASSWORD
}

axios({
    method: 'get',
    url: 'https://api.dataforseo.com/v3/keywords_data/google_trends/explore/tasks_ready',
    auth,
    headers: {
        'content-type': 'application/json'
    }
}).then(function (response) {
    var result = response['data']['tasks'].map(task => task.result)
    
    console.log(result);
}).catch(function (error) {
    console.log(error);
});