const mongoose = require('mongoose')
require('dotenv').config()
const db = process.env.MONGODB_URL

mongoose.connect(db)
.then(() => console.log('Connected to DB'))
.catch((e) => console.log('Error Catch', e));
