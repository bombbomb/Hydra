'use strict';

const express           = require('express');
const path              = require('path');
const bodyParser        = require('body-parser');
const cookieParser      = require('cookie-parser');
const pg                = require('pg');
const connectionString  = process.env.DATABASE_URL || 'postgres://localhost:5432/hydra_local';

const app = express();


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
    res.status(200).json({
        regions : [
            {
                name : "east-1",
                location: disneyLandLatLng,
                environments : [
                    {
                        revision: 1.0,
                        status : 'green',
                        instanceCount : 12,
                        trafficWeight: 0.3
                    },
                    {
                        revision: 1.1,
                        status : 'yellow',
                        instanceCount : 12,
                        trafficWeight: 0.7
                    }
                ]
            },
            {
                name : "west-1",
                location: disneyWorldLatLng,
                environments : [
                    {
                        revision: 1.0,
                        status : 'red',
                        instanceCount : 9,
                        trafficWeight: 0.5
                    }
                ]
            }
        ]
    })
});


// app.post('/infrastructure', (req, res) => {
//     const results = [];
//     const location = JSON.parse(req.body.location);
//     console.log(location);
//
//     pg.connect(connectionString, (err, client, done) => {
//         if(err)
//         {
//             done();
//             console.log(err);
//             return res.status(500).json({
//                 success : false,
//                 data: err
//             })
//         }
//
//         client.query('INSERT INTO infrastructure(region, location, status, instanceCount, trafficWeight) values($1, $2, ARRAY[$3, $4], $5, $6)',
//             [req.body.region, parseInt(location[0]), parseInt(location[1]), req.body.status, req.body.instanceCount, req.body.trafficWeight]);
//
//         const query = client.query('SELECT * FROM load ORDER BY id ASC');
//
//         query.on('row', (row) => {
//             results.push(row);
//         });
//
//         query.on('end', () => {
//             done();
//             return res.json(results);
//         })
//     })
// });

app.get('/load', (req, res) => {
    res.status(200).json({
        regions : [
            {
                name : "east-1",
                replicationLag : 0.7,
                environments : [
                    {
                        revision: 1.0,
                        errRate : 0.1
                    },
                    {
                        revision: 1.1,
                        errRate : 0.3
                    }
                ]
            },
            {
                name : "west-1",
                replicationLag : 0.7,
                environments : [
                    {
                        revision: 1.0,
                        errRate : 0.1
                    }
                ]
            }
        ]
    })
});

app.post('/load', (req, res) => {
    const results = [];

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

        client.query('INSERT INTO load(region, errRate, replicationLag) values($1, $2, $3)',
        [req.body.region, req.body.errRate, req.body.replicationLag]);

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

app.put('/load/:id', (req, res) => {
    const results = [];
    const id = req.params.id;

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

        client.query('UPDATE load SET region=($1), errRate=($2), replicationLag=($3)',
            [req.body.region, req.body.errRate, req.body.replicationLag]);

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

app.listen(9000);