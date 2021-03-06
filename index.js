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
    user: process.env.DB_USER || 'foo',
    password: process.env.DB_SECRET || 'secret',
    database: process.env.DB_NAME || 'hydra_local',
    host: process.env.DB_WRITE_HOST || 'localhost',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 60000
};


const readConfig = {
    user: process.env.DB_USER || 'foo',
    password: process.env.DB_SECRET || 'secret',
    database: process.env.DB_NAME || 'hydra_local',
    host: process.env.DB_READ_HOST || 'localhost',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 60000
};

const writePool = new pg.Pool(writeConfig);
const readPool = new pg.Pool(readConfig);

const appRegion = process.env.GAIA_REGION || 'local';
const appVersion = process.env.GAIA_VERSION || 'hot';

const infraLat = process.env.LAT || '50';
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
    res.status(200).send('Hydra lives.');
});

app.get('/which', function(req, res) {
    res.status(200).send({
        region: appRegion,
        version: appVersion,
        instance: instanceName
    });
});


function describeInfra(cb) {
    readPool.query("SELECT * FROM infrastructure WHERE status <> 'Black'", [], function (err, data) {

        const regions = {};
        data.rows.forEach(function (el, ind) {

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
        for (let i in regions) {
            let r = regions[i];

            let envs = r.environments;
            r.environments = [];
            for (let e in envs) {
                r.environments.push(envs[e]);
            }
            result.push(r);
        }

        cb(result);

    });
}
app.get('/infrastructure', (req, res) => {
    const results = [];
    describeInfra(function(infra) {

        return res.status(200).json(infra);
    });
});

app.post('/load', (req, res) => {
    const results = [];

    let user = req.body;

    user.region = appRegion;
    user.appVersion = appVersion;

    pingIris("Mob", user);

    let qry = 'INSERT INTO load (region, version, username, ping) values ($1, $2, $3, $4)';
    writePool.query(qry, [appRegion, appVersion, req.body.name, req.body.lastPing], function(err, data) {
        if (err)
            console.log("POST LOAD pg err", err);
    });

    return res.status(200).json(user);
});

app.post('/user', (req, res) => {

    let user = req.body;

    user.region = appRegion;
    user.appVersion = appVersion;

    pingIris("User", user);

    let qry = 'INSERT INTO bombuser (name, lat, long) ' +
        'VALUES ($1, $2, $3) ' +
        'ON CONFLICT (name) DO UPDATE ' +
        'SET lat = $2, long = $3, updated = NOW()';
    writePool.query(qry, [user.name, user.lat, user.long], function(err, data) {
        if (err)
            console.log("POST USER err", err);

        return res.status(200).json(user);
    });

});

app.get('/users', (req, res) => {

    let qry = "SELECT * FROM bombuser WHERE updated > (NOW() - INTERVAL '15 minutes')";
    readPool.query(qry, [], function(err, data) {
        if (err)
            console.log("POST USER err", err);

        return res.status(200).json(data.rows);
    });

});

const port = process.env.PORT || 9000;
let runTimers = function () {
// heartbeat instance health
    setInterval(function () {
        writePool.query(
            "UPDATE infrastructure SET last_heard_from = NOW(), status = 'Green' WHERE id = $1", [infraId], function (err, result) {
                if (err)
                    console.log("heartbeat infra", err, result);
            });

    }, 15 * 1000);


    // Turn instances red after they go silent
    setInterval(function () {
        writePool.query(
            "UPDATE infrastructure SET status = 'Red' WHERE last_heard_from BETWEEN (NOW() - INTERVAL '15 minutes') AND  (NOW() - INTERVAL '2 minutes')", [],
            function (err, result) {
                if (err)
                    console.log("Red old infra", err, result);

                if (result.rowCount)
                    infrastructureUpdate();
            });


    }, 30 * 1000);


    // Turn instances black after they go silent
    setInterval(function () {
        writePool.query(
            "UPDATE infrastructure SET status = 'Black' WHERE last_heard_from < NOW() - INTERVAL '15 minutes'", [], function (err, result) {
                if (err)
                    console.log("Black old infra", err, result);

                if (result.rowCount)
                    infrastructureUpdate();
            });

    }, 31 * 1000);
};
http.listen(port, function(){
    console.log('listening on *:' + port);

    //register instance into infrastructure
    writePool.query(
        'INSERT INTO infrastructure(id, region, status, latitude, longitude, version, instance_name) values($1, $2, $3, $4, $5, $6, $7) ',
        [infraId, appRegion, 'Green', infraLat, infraLong, appVersion, instanceName],
        function(err, result) {
            console.log("created infra", err, result);

        infrastructureUpdate();

    });
    runTimers();

});

function infrastructureUpdate()
{
    describeInfra(function(i) {
        pingIris("Infrastructure", i);
    });
}


function pingIris(type, body) {
    request(
        {
            url: 'http://iris.bbhydra.com/post',
            method: 'post',
            json: true,
            body: {
                'type': type,
                'data': body
            }
        }
        , function (error, response, body) {
            if (error) {
                console.log('iris error:', error);
            }
        }
    );
}