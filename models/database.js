const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/hydra_local';

const client = new pg.Client(connectionString);
client.connect();
const query = client.query(
    'CREATE TABLE IF NOT EXISTS ' +
    'infrastructure(id SERIAL PRIMARY KEY, region TEXT, location NUMERIC[], status TEXT, instanceCount INTEGER, trafficWeight NUMERIC);' +
    'CREATE TABLE IF NOT EXISTS ' +
    'load(id SERIAL PRIMARY KEY, region TEXT, errRate NUMERIC, replicationLag NUMERIC);'

);
query.on('end', () => { client.end(); });
