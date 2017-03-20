const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('./build'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, './build', 'index.html'));
});

app.get('/infrastucture', function(req, res)  {
    res.send(200, {
        regions : [
            {   name : "east-1",
                environments : [
                    {
                        status : 'green',
                        instanceCount : 12,
                        trafficWeight: 0.3
                    }
                ]
            }
        ]
    })
});

app.get('/load', function(req, res)  {
    res.send(200, {
        regions : [
            {   name : "east-1",
                environments : [
                    {
                        errRate : 0.1,
                        replicationLag : 0.7
                    }
                ]
            }
        ]
    })
});

app.listen(9000);