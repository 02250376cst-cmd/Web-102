const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');

// import routes
const variableRoutes = require('./routes/videos');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');

//initialize express app
const app = express();

//middlewares
app.use(morgan('dev')); //logging
app.use(cors()); //enable cors for all routes
app.use(bodyParser.json()); //parse json request bodies
app.use(bodyParser.urlencoded({ extended: true })); //parse url-encoded bodies

app.use ((req, res, next) => {
    //check if the client accepts JOSN
    if (!req.accepts('application/json')) {
        return res.status(406).json({
            error: 'Not Acceptable',
            message: 'This API only accept application/json'
        });
    }
    // setcontent-type header for responses
    res.setHeader('content-type', 'application/json');
    next();
});

//API Routes
app.use('/api/videos', variableRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

//Root route
app.get('/', (req, res ) => {
    res.json({ message: 'welcome to tiktok API'});
});

//404 handler
app.use((req,res, next) => {
    res.status(404).json({ error: 'Not Found'});
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
     }); 
    });

module.exports = app;
        