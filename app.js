var express = require('express');

var app = express();
app.use(express.compress());
app.use('/static', express.static(__dirname + '/static'));
app.use('/games', express.static(__dirname + '/games'));

app.get('/', function(req, res) {
    res.sendfile('views/index.html');
});

app.get('/gamelog', function(req, res) {
    res.sendfile('views/gamelog.html');
});

app.listen(process.env.PORT || 3000);
console.log('Server started at port 3000');
