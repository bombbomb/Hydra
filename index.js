'use strict';

const express           = require('express');
const path              = require('path');
const bodyParser        = require('body-parser');
const cookieParser      = require('cookie-parser');
const pg                = require('pg');
const request           = require('request');

const DataTransformer   = require('./util/dataTransformer');
const dataTransformer   = new DataTransformer();

const app = express();

const http              = require('http').Server(app);
const io                = require('socket.io')(http);

const writeConfig = {
    user: process.env.USER || 'foo',
    password: process.env.SECRET || 'secret',
    database: process.env.DB_NAME || 'hydra_local',
    host: process.env.DB_WRITE_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 60000
};


const readConfig = {
    user: process.env.USER || 'foo',
    password: process.env.SECRET || 'secret',
    database: process.env.DB_NAME || 'hydra_local',
    host: process.env.DB_READ_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 60000
};


//this initializes a connection pool
//it will keep idle connections open for 60 seconds
//and set a limit of maximum 10 idle clients
const writePool = new pg.Pool(writeConfig);
const readPool = new pg.Pool(readConfig);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static('./build'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, './build', 'index.html'));
});

app.get('/health-check', function(req, res) {
    res.status(200).send('Hydra lives.')
});


app.get('/infrastructure', (req, res) => {
    const results = [];

    readPool.connect((err, client ,done) => {
        if(err)
        {
            done();
            console.log(err);
            return res.status(500).json({
                success : false,
                data: err
            })
        }

        const query = client.query('SELECT * FROM infrastructure ORDER BY id ASC;');

        query.on('row', (row) => {
            results.push(row);
        });

        query.on('end', () => {
            done();
            return res.status(200).json({
                success : true,
                data : dataTransformer.fromInfrastructure(results)
            });
        })
    })
});

app.get('/infrastructure/:id', (req, res) => {
    const results = [];

    readPool.connect((err, client ,done) => {
        if(err)
        {
            done();
            console.log(err);
            return res.status(500).json({
                success : false,
                data: err
            })
        }

        const query = client.query('SELECT * FROM infrastructure WHERE id=($1);', [req.params.id]);

        query.on('row', (row) => {
            results.push(row);
        });

        query.on('end', () => {
            done();
            return res.status(200).json({
                success : true,
                data : dataTransformer.fromInfrastructure(results)
            });
        })
    })
});

app.post('/infrastructure', (req, res) => {
    const results = [];
    const parsedLocation = JSON.parse(req.body.location);
    const location =
        {
            lat : parseFloat(parsedLocation[0]),
            long : parseFloat(parsedLocation[1])
        };

    writePool.connect((err, client, done) => {
        if(err)
        {
            done();
            console.log(err);
            return res.status(500).json({
                success : false,
                data: err
            })
        }

        client.query('INSERT INTO infrastructure(region, location, status, instanceCount, trafficWeight) values($1, $2, $3, $4, $5)',
            [req.body.region, location, req.body.status, req.body.instanceCount, req.body.trafficWeight]);

        const query = client.query('SELECT * FROM infrastructure ORDER BY id ASC');

        query.on('row', (row) => {
            results.push(row);
        });

        query.on('end', () => {
            done();
            return res.json(results);
        })
    })
});

app.put('/infrastructure/:id', (req, res) => {
    const results = [];
    const id = req.params.id;
    const parsedLocation = JSON.parse(req.body.location);
    const location =
        {
            lat : parseFloat(parsedLocation[0]),
            long : parseFloat(parsedLocation[1])
        };

    writePool.connect((err, client, done) => {
        if(err)
        {
            done();
            console.log(err);
            return res.status(500).json({
                success : false,
                data: err
            })
        }

        client.query('UPDATE infrastructure SET region=($1), location = ($2), status=($3), instanceCount=($4), trafficWeight=($5) WHERE id=($6)',
            [req.body.region, location, req.body.status, req.body.instanceCount, req.body.trafficWeight, id]);

        const query = client.query('SELECT * FROM infrastructure ORDER BY id ASC');

        query.on('row', (row) => {
            results.push(row);
        });

        query.on('end', () => {
            done();
            return res.json(results);
        })
    })
});

app.get('/load', (req, res) => {
    const results = [];

    readPool.connect((err, client ,done) => {
        if(err)
        {
            done();
            console.log(err);
            return res.status(500).json({
                success : false,
                data: err
            })
        }

        const query = client.query('SELECT * FROM load ORDER BY id ASC;');

        query.on('row', (row) => {
            results.push(row);
        });

        query.on('end', () => {
            done();
            return res.status(200).json({
                success : true,
                data : dataTransformer.fromLoad(results)
            });
        })
    })
});

app.get('/load/:id', (req, res) => {
    const results = [];

    readPool.connect((err, client ,done) => {
        if(err)
        {
            done();
            console.log(err);
            return res.status(500).json({
                success : false,
                data: err
            })
        }

        const query = client.query('SELECT * FROM load WHERE id=($1);', [req.params.id]);

        query.on('row', (row) => {
            results.push(row);
        });

        query.on('end', () => {
            done();
            return res.status(200).json({
                success : true,
                data : dataTransformer.fromLoad(results)
            });
        })
    })
});

app.post('/load', (req, res) => {
    const results = [];

    let user = req.body;

    user.region = process.env.GAIA_REGION || 'unknown';
    user.appVersion = process.env.GAIA_VERSION || 'unknown';

    request(
        {
            url: 'http://iris.bbhydra.com/post',
            method: 'post',
            json: true,
            body: {
                type: "Mob",
                data: user
            }
        }
        , function (error, response, body) {
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);
            console.log('body:', body);
        }
    );

    writePool.connect((err, client, done) => {
        if(err)
        {
            done();
            console.log(err);
            return res.status(500).json({
                success : false,
                data: err
            })
        }

        client.query('INSERT INTO load(region, errRate, replicationLag) values($1, $2, $3);',
        [req.body.region, req.body.errRate, req.body.replicationLag]);

        return res.status(200).json({
            success : true,
            data : user
        });
    })
});

app.put('/load/:id', (req, res) => {
    const results = [];
    const id = req.params.id;

    writePool.connect((err, client, done) => {
        if(err)
        {
            done();
            console.log(err);
            return res.status(500).json({
                success : false,
                data: err
            })
        }

        client.query('UPDATE load SET region=($1), errRate=($2), replicationLag=($3) WHERE id=($4);',
            [req.body.region, req.body.errRate, req.body.replicationLag, id]);

        const query = client.query('SELECT * FROM load ORDER BY id ASC;');

        query.on('row', (row) => {
            results.push(row);
        });

        query.on('end', () => {
            done();
            return res.status(200).json({
                success : true,
                data : results
            });
        })
    })
});

app.get('/testio', (req, res) => {
    console.log('req', req.query);
    io.emit('person added', req.query);

    return res.status(200).json({
        success : true,
        data : null
    });
});


const port = process.env.PORT || 9000;
http.listen(port, function(){
    console.log('listening on *:' + port);
});


/*
 app.post('/infrastructure', (req, res) => {
     const results = [];
     const location = JSON.parse(req.body.location);
     console.log(location);

     pg.connect(connectionString, (err, client, done) => {
         if(err)
         {
             done();
             console.log(err);
             return res.status(500).json({
                 success : false,
                 data: err
             })
         }

         client.query('INSERT INTO infrastructure(region, location, status, instanceCount, trafficWeight) values($1, $2, ARRAY[$3, $4], $5, $6)',
             [req.body.region, parseInt(location[0]), parseInt(location[1]), req.body.status, req.body.instanceCount, req.body.trafficWeight]);

         const query = client.query('SELECT * FROM load ORDER BY id ASC');

         query.on('row', (row) => {
             results.push(row);
         });
*/