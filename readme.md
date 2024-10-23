# Bulk Trends
Version: Spaguetti western

## First steps
1. $ Git clone
2. $ npm install
3. Have an account on DataForSEO
4. Create .env file with DATAFORSEO_PASSWORD & DATAFORSEO_USERNAME

## How it works
1. Put a list of keywords in `src/keyword.txt` from which to extract the trends in bulk
2. Execute in your terminal `node src/sendTasks.js` to create task that will be put on the dataforseo queue to get trends info
3. Wait. (With 11k keywords they needed 45 min to complete the full list of tasks so take that as reference)
4. Get the list of IDs to get the trends data. Do it manually. Go to [your dataforseo dashboard](https://app.dataforseo.com/api-detail/keywords) and click on export to copy paste all the IDs (just the IDs) into `src/pendingTasks.txt`
5. Execute `node src/getTrendsInfo.js` to get all the trends in `src/trends.csv`

## API documentation
* POST tasks: https://docs.dataforseo.com/v3/keywords_data/google_trends/explore/task_post/?bash
* Ready tasks: https://docs.dataforseo.com/v3/keywords_data/google_trends/explore/tasks_ready/?bash
* Get tasks: https://docs.dataforseo.com/v3/keywords_data/google_trends/explore/task_get/?bash