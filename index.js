require('dotenv').config();
const express = require('express');
const cors = require('cors')

const notionRouter = require('./routes/notionapi')

const port = process.env.PORT ? process.env.PORT : 4000;
const backApp = express();

backApp.use(cors())
backApp.use(express.json())

backApp.use('/api/notion', notionRouter)

backApp.get('/', (req, res) => {
    res.send('Notion API V1 by @crihstianmol')
})

backApp.listen(port, () => {
    console.log(`Running in port ${port}`)
})