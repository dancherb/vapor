var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
require('dotenv').config();

var app = express();
var routes = require('./routes/index');
var cors = require('cors');

var port = process.env.PORT || 3000;

app.use(cors());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes); // use /routes/index for all routes

// show "page not found" for any routes not specified in routes index
app.get("*", (req, res) => {
  res.send("Page not found...");
})

// start server
app.listen(port, () => {
  console.log("server is running on", port);
})