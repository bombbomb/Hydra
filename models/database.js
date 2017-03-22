const pg = require('pg');
const writeConfig = {
    user: process.env.USER || 'foo',
    password: process.env.SECRET || 'secret',
    database: process.env.DB_NAME || 'hydra_local',
    host: process.env.DB_WRITE_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 60000
};

const writePool = new pg.Pool(writeConfig);


writePool.connect((err, client ,done) => {
    const query = client.query(
        'CREATE TABLE IF NOT EXISTS ' +
        'infrastructure(id SERIAL PRIMARY KEY, region TEXT, location JSON, status TEXT, instanceCount INTEGER, trafficWeight NUMERIC);' +
        'CREATE TABLE IF NOT EXISTS ' +
        'load(id SERIAL PRIMARY KEY, region TEXT, errRate NUMERIC, replicationLag NUMERIC);'
    );
    query.on('end', () => {
        done();
        client.end();
    });
});

