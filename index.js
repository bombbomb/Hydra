'use strict';

const express           = require('express');
const path              = require('path');
const bodyParser        = require('body-parser');
const cookieParser      = require('cookie-parser');
const pg                = require('pg');
const request           = require('request');
const Moniker = require('moniker');

const DataTransformer   = require('./util/dataTransformer');
const dataTransformer   = new DataTransformer();

const app = express();

const http              = require('http').Server(app);

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

const writePool = new pg.Pool(writeConfig);
const readPool = new pg.Pool(readConfig);

const appRegion = process.env.GAIA_REGION || 'local';
const appVersion = process.env.GAIA_VERSION || 'hot';

const infraLat = process.env.LAT || '38.8';
const infraLong = process.env.LONG || '-104.7';

const instanceName = Moniker.choose();
const infraId = appRegion + '.' + appVersion + '.' + instanceName;

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

    readPool.connect((err, client, done) => {
        if(err)
        {
            done();
            console.log(err);
            return res.status(500).json({
                success : false,
                data: err
            })
        }

        client.query("SELECT * FROM infrastructure WHERE status <> 'Black'", [], function(err, data) {
            done();
            console.log(data);

            const regions = {};
            data.rows.forEach(function(el, ind) {

                if (!regions[el.region]) {
                    regions[el.region] = {
                        name: el.region,
                        lat: el.latitude,
                        long: el.longitude,
                        environments: {}
                    };
                }

                if (!regions[el.region].environments[el.version]) {
                    regions[el.region].environments[el.version] = {
                        name: el.version,
                        instances: []
                    };
                }

                regions[el.region].environments[el.version].instances.push({
                    name: el.instance_name,
                    status: el.status,
                    created: el.created
                });
            });

            let result = [];
            for(let i in regions) {
                let r = regions[i];

                let envs = r.environments;

                r.environments = [];

                for (let e in envs) {
                    r.environments.push(envs[e]);
                }


                result.push(r);
            }



            return res.status(200).json(result);

        });
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

app.post('/load', (req, res) => {
    const results = [];

    let user = req.body;

    user.region = appRegion;
    user.appVersion = appVersion;

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

const port = process.env.PORT || 9000;
http.listen(port, function(){
    console.log('listening on *:' + port);

    //register instance into infrastructure
    writePool.connect((err, client, done) => {
        if(err) {
            done();
            console.log(err);
        }
        client.query(
            'INSERT INTO infrastructure(id, region, status, latitude, longitude, version, instance_name) values($1, $2, $3, $4, $5, $6, $7) ',
            [infraId, appRegion, 'Green', infraLat, infraLong, appVersion, instanceName],
            function(err, result) {
                console.log("created infra", err, result);
                done()
            });

    });

    // heartbeat instance health
    setInterval(function(){
        writePool.connect((err, client, done) => {
            if(err) {
                done();
                console.log(err);
            }
            client.query(
                "UPDATE infrastructure SET last_heard_from = NOW(), status = 'Green' WHERE id = $1", [infraId],
                function(err, result) {
                    console.log("heartbeat infra", err, result);
                    done()
                });
        });
    }, 15 * 1000);


    // Turn instances red after they go silent
    setInterval(function(){
        writePool.connect((err, client, done) => {
            if(err) {
                done();
                console.log(err);
            }
            client.query(
                "UPDATE infrastructure SET status = 'Red' WHERE last_heard_from < NOW() - INTERVAL '2 minutes'", [],
                function(err, result) {
                    console.log("Red old infra", err, result);
                    done()
                });
        });
    }, 30 * 1000);


    // Turn instances red after they go silent
    setInterval(function(){
        writePool.connect((err, client, done) => {
            if(err) {
                done();
                console.log(err);
            }
            client.query(
                "UPDATE infrastructure SET status = 'Black' WHERE last_heard_from < NOW() - INTERVAL '15 minutes'", [],
                function(err, result) {
                    console.log("Red old infra", err, result);
                    done()
                });
        });
    }, 31 * 1000);

});