'use strict';

const express           = require('express');
const path              = require('path');
const bodyParser        = require('body-parser');
const cookieParser      = require('cookie-parser');
const pg                = require('pg');

const DataTransformer   = require('./util/dataTransformer');
const dataTransformer   = new DataTransformer();

const app = express();

const writeConfig = {
    user: process.env.USER || 'foo',
    password: process.env.SECRET || 'secret',
    database: process.env.WRITE_DATABASE || 'hydra_local',
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 60000
};


const readConfig = {
    user: process.env.USER || 'foo',
    password: process.env.SECRET || 'secret',
    database: process.env.READ_DATABASE || 'hydra_local',
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
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
    console.log('WE got a request!!');

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

app.listen(9000);



