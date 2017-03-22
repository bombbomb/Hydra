'use strict';

const express           = require('express');
const path              = require('path');
const bodyParser        = require('body-parser');
const cookieParser      = require('cookie-parser');
const pg                = require('pg');

const DataTransformer   = require('./util/dataTransformer');
const dataTransformer   = new DataTransformer();

const app = express();

const http              = require('http').Server(app);
const io                = require('socket.io')(http);

const writeConfig = {
    database: process.env.WRITE_DATABASE || 'hydra_local',
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 60000
};
const readConfig = {
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

let disneyLandLatLng = [33.811, -117.919];
let disneyWorldLatLng = [28.370896, -81.543354];
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

        client.query('UPDATE load SET region=($1), errRate=($2), replicationLag=($3);',
            [req.body.region, req.body.errRate, req.body.replicationLag]);

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

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
    });
});

http.listen(9000, function(){
    console.log('listening on *:9000');
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

         query.on('end', () => {
             done();
             return res.json(results);
         })
     })
 });


 */