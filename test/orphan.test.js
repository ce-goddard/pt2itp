const Orphan = require('../lib/util/orphan');
const Post = require('../lib/util/post');
const Index = require('../lib/util/index');

const test = require('tape');
const fs = require('fs');
const path = require('path');
const pg = require('pg');
const Queue = require('d3-queue').queue;
const readline = require('readline');
const output = fs.createWriteStream(path.resolve(__dirname, '../test/fixtures/orphan-output.geojson'));

const pool = new pg.Pool({
    max: 10,
    user: 'postgres',
    database: 'pt_test',
    idleTimeoutMillis: 30000
});

const index = new Index(pool);

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err);
        t.end();
    });
});

test('orphan.address', (t) => {
    const post = new Post();
    const orphan = new Orphan(pool, {}, output);
    const popQ = new Queue(1);

    // populate address
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            INSERT INTO address (id, name, number, geom, netid) VALUES (1, '[{ "tokenized": "main st se", "tokenless": "main", "display": "Main Street SE" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-66.97265625,43.96119063892024, 11] }'), 4326), 1);
            INSERT INTO address (id, name, number, geom, netid) VALUES (2, '[{ "tokenized": "main st se", "tokenless": "main", "display": "Main Street SE" }]', 12, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-66.97265625,43.96119063892024, 12] }'), 4326), 1);
            INSERT INTO address (id, name, number, geom, netid) VALUES (6, '[{ "tokenized": "main st se", "tokenless": "main", "display": "Main Street SE" }]', 14, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-66.97265625,43.96119063892024, 16] }'), 4326), 1);
            INSERT INTO address (id, name, number, geom, netid) VALUES (3, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 13, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-105.46875,56.36525013685606, 13] }'), 4326), NULL);
            INSERT INTO address (id, name, number, geom, netid) VALUES (4, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 15, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-105.46875,56.36525013685606, 14] }'), 4326), NULL);
            INSERT INTO address (id, name, number, geom, netid) VALUES (5, '[{ "tokenized": "fake av", "tokenless": "fake", "display": "Fake Avenue" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-85.25390625,52.908902047770255, 15] }'), 4326), NULL);
            COMMIT;
        `, (err, res) => {
            t.error(err, 'ok - added addresses to table');
            return done();
        });
    });

    // call orphan.address
    popQ.defer((done) => {
        orphan.address((err) => {
            t.error(err);
            return done();
        });
    });

    // check address_orphan_cluster
    popQ.defer((done) => {
        pool.query(`
            SELECT name FROM address_orphan_cluster ORDER BY name;
        `, (err, res) => {
            t.error(err);

            t.equals(res.rows.length, 2, 'ok - correct number of orphans');
            t.deepEquals(res.rows[0], { name: [ { display: 'Fake Avenue', tokenized: 'fake av', tokenless: 'fake' } ] }, 'ok - Fake Ave orphaned');
            t.deepEquals(res.rows[1], { name: [ { display: 'Main Street', tokenized: 'main st', tokenless: 'main' } ] }, 'ok - Main St orphaned');
            return done();
        });
    });

    popQ.await((err) => {
        t.error(err);
        output.end();
        t.end();
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err);
        t.end();
    });
});

test('orphan output', (t) => {
    let counter = 0;
    const orphans = {
        'Main Street': [['3','4']],
        'Fake Avenue': [['5']]
    };

    const rl = readline.createInterface({
        input : fs.createReadStream(path.resolve(__dirname, '../test/fixtures/orphan-output.geojson')),
    })
    rl.on('line', (line) => {
        if (!line) return;
        counter++;
        let feat = JSON.parse(line);
        t.deepEquals(feat.properties["carmen:addressnumber"], orphans[feat.properties["carmen:text"]], 'ok - orphan has correct addresses');
    })

    rl.on('close', () => {
        t.equals(counter, 2, 'ok - output had correct number of orphan clusters');
        t.end();
    });
});

test('end connection', (t) => {
    pool.end();
    t.end();
});
