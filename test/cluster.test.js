const Cluster = require('../lib/cluster');
const Index = require('../lib/index');

const test = require('tape');
const fs = require('fs');
const pg = require('pg');
const Queue = require('d3-queue').queue;

const pool = new pg.Pool({
    max: 10,
    user: 'postgres',
    database: 'pt_test',
    idleTimeoutMillis: 30000
});

const cluster = new Cluster({ pool: pool });
const index = new Index(pool);

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err);
        t.end();
    });
});

test('cluster.name', (t) => {
    const popQ = new Queue(1);

    //POPULATE NETWORK
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            INSERT INTO network (name, id, geom) VALUES ('{}', 1, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "LineString", "coordinates": [ [ -66.05180561542511, 45.26869136632906, 1 ], [ -66.05007290840149, 45.268982070325656, 1 ] ] }'), 4326));
            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    //POPULATE NEARBY ADDRESSES
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            INSERT INTO address (id, name, number, geom) VALUES (1, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05154812335967, 45.26861208316249, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (2, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05125308036804, 45.26868759094269, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (3, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05092048645020, 45.26872912017898, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (4, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05050742626190, 45.26880462780347, 10 ] }'), 4326));
            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    //CALL cluster.name on id 1
    popQ.defer((done) => {
        cluster.name(1, (err) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    popQ.defer((done) => {
        pool.query(`
            SELECT id, name, named FROM network;
        `, (err, res) => {
            t.error(err, 'no errors');

            t.deepEquals(res.rows[0], {
                id: '1',
                name: {
                    display: 'Main Street',
                    tokenless: 'main',
                    tokenized: 'main st'
                },
                named: true
            }, 'test fields matched to nearby addresses');
            return done();
        });
    });

    //RE-POPULATE NETWORK
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            DELETE FROM network;
            INSERT INTO network (name, id, geom) VALUES ('{}', 1, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "LineString", "coordinates": [ [ -66.05180561542511, 45.26869136632906, 1 ], [ -66.05007290840149, 45.268982070325656, 1 ] ] }'), 4326));
            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });


    //POPULATE ADDRESSES THAT ARE NOT NEARBY
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            DELETE FROM address WHERE true;
            INSERT INTO address (id, name, number, geom) VALUES (1, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ 0, 0, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (2, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ 0, 0, 10 ]  }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (3, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ 0, 0, 10 ]  }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (4, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ 0, 0, 10 ]  }'), 4326));
            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    //CALL cluster.name ON id 1
    popQ.defer((done) => {
        cluster.name(1, (err) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    //NETWORK TEXT FIELDS SHOULD NOT HAVE BEEN UPDATED
    popQ.defer((done) => {
        pool.query(`
            SELECT id, name, named FROM network;
        `, (err, res) => {
            t.error(err, 'no errors');

            t.deepEquals(res.rows[0], {
                id: '1',
                name: { },
                named: false
            });
            return done();
        });
    });

    popQ.await((err) => {
        t.error(err, 'no errors');
        t.end();
    });
});


test('cluster.name (titlecase upper)', (t) => {
    const popQ = new Queue(1);

    //POPULATE NETWORK
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            INSERT INTO network (name, id, geom) VALUES ('{}', 1, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "LineString", "coordinates": [ [ -66.05180561542511, 45.26869136632906, 1 ], [ -66.05007290840149, 45.268982070325656, 1 ] ] }'), 4326));
            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    //POPULATE NEARBY ADDRESSES
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            INSERT INTO address (id, name, number, geom) VALUES (1, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05154812335967, 45.26861208316249, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (2, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05125308036804, 45.26868759094269, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (3, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05092048645020, 45.26872912017898, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (4, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05050742626190, 45.26880462780347, 10 ] }'), 4326));
            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    //CALL cluster.name on id 1
    popQ.defer((done) => {
        cluster.name(1, (err) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    popQ.defer((done) => {
        pool.query(`
            SELECT id, name, named FROM network;
        `, (err, res) => {
            t.error(err, 'no errors');

            t.deepEquals(res.rows[0], {
                id: '1',
                name: {
                    display: 'Main Street',
                    tokenless: 'main',
                    tokenized: 'main st',
                },
                named: true
            }, 'test fields matched to nearby addresses');
            return done();
        });
    });

    popQ.await((err) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('cluster.name (titlecase lower)', (t) => {
    const popQ = new Queue(1);

    //POPULATE NETWORK
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            INSERT INTO network (name, id, geom) VALUES ('{}', 1, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "LineString", "coordinates": [ [ -66.05180561542511, 45.26869136632906, 1 ], [ -66.05007290840149, 45.268982070325656, 1 ] ] }'), 4326));
            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    //POPULATE NEARBY ADDRESSES
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            INSERT INTO address (id, name, number, geom) VALUES (1, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05154812335967, 45.26861208316249, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (2, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05125308036804, 45.26868759094269, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (3, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05092048645020, 45.26872912017898, 10 ] }'), 4326));
            INSERT INTO address (id, name, number, geom) VALUES (4, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -66.05050742626190, 45.26880462780347, 10 ] }'), 4326));
            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    //CALL cluster.name on id 1
    popQ.defer((done) => {
        cluster.name(1, (err) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    popQ.defer((done) => {
        pool.query(`
            SELECT id, name, named FROM network;
        `, (err, res) => {
            t.error(err, 'no errors');

            t.deepEquals(res.rows[0], {
                id: '1',
                name: {
                    display: 'Main Street',
                    tokenless: 'main',
                    tokenized: 'main st'
                },
                named: true
            }, 'test fields matched to nearby addresses');
            return done();
        });
    });

    popQ.await((err) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('cluster.address', (t) => {
    const popQ = new Queue(1);

    //POPULATE ADDRESS
    popQ.defer((done) => {
        pool.query(`
            BEGIN;

            INSERT INTO address (id, name, number, geom, netid) VALUES (1, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-66.97265625,43.96119063892024, 1] }'), 4326), 1);
            INSERT INTO address (id, name, number, geom, netid) VALUES (2, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-66.97265625,43.96119063892024, 2] }'), 4326), 1);
            INSERT INTO address (id, name, number, geom, netid) VALUES (6, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-66.97265625,43.96119063892024, 6] }'), 4326), 1);

            INSERT INTO address (id, name, number, geom, netid) VALUES (3, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 13, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-105.46875,56.36525013685606, 3] }'), 4326), 3);
            INSERT INTO address (id, name, number, geom, netid) VALUES (4, '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]', 13, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-105.46875,56.36525013685606, 4] }'), 4326), 3);

            INSERT INTO address (id, name, number, geom, netid) VALUES (5, '[{ "tokenized": "fake av", "tokenless": "fake", "display": "Fake Avenue" }]', 10, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [-85.25390625,52.908902047770255, 5] }'), 4326), 2);

            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    popQ.defer((done) => {
        cluster.address((err) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    popQ.defer((done) => {
        pool.query(`
            SELECT name, ST_AsGeoJSON(geom)::JSON AS geom FROM address_cluster ORDER BY ST_NumGeometries(geom);
        `, (err, res) => {
            t.error(err, 'no errors');

            t.equals(res.rows.length, 3);
            t.deepEquals(res.rows[0], { geom: { type: "MultiPoint","coordinates":[[-85.25390625,52.9089020477703,5]]}, name: [{ freq: 1, tokenized: 'fake av', tokenless: 'fake', display: 'Fake Avenue' }] });
            t.deepEquals(res.rows[1], { geom: {"type":"MultiPoint","coordinates":[[-105.46875,56.3652501368561,3],[-105.46875,56.3652501368561,4]]}, name: [{ freq: 2, tokenized: 'main st', tokenless: 'main', display: 'Main Street' }] });
            t.deepEquals(res.rows[2], { geom: { coordinates: [ [ -66.97265625, 43.9611906389202, 1 ], [ -66.97265625, 43.9611906389202, 2 ], [ -66.97265625, 43.9611906389202, 6 ] ], type: 'MultiPoint' }, name: [{ freq: 3, tokenized: 'main st', tokenless: 'main', display: 'Main Street' }] });

            return done();
        });
    });

    popQ.await((err) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('cluster.address - order synonyms by address count', (t) => {
    const popQ = new Queue(1);

    popQ.defer((done) => {
        pool.query(`
            BEGIN;

            INSERT INTO address (id, name, number, netid, geom) VALUES (21, '[{ "tokenized": "mill st nw", "tokenless": "mill", "display": "Mill Street NW" }]', 12, 20, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -85.41056871414183, 41.8005111239637, 5 ] }'), 4326));
            INSERT INTO address (id, name, number, netid, geom) VALUES (22, '[{ "tokenized": "mill st nw", "tokenless": "mill", "display": "Mill Street NW" }]', 13, 20, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -85.41054725646971, 41.801102975153974, 6 ] }'), 4326));

            INSERT INTO address (id, name, number, netid, geom) VALUES (23, '[{ "tokenized": "r st nw", "tokenless": "r", "display": "R Street NW" }]', 10, 20, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -85.41816473007202, 41.80102299558284, 7 ] }'), 4326));
            INSERT INTO address (id, name, number, netid, geom) VALUES (24, '[{ "tokenized": "r st nw", "tokenless": "r", "display": "R Street NW" }]', 11, 20, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -85.4172420501709, 41.80103899150505, 8 ] }'), 4326));
            INSERT INTO address (id, name, number, netid, geom) VALUES (25, '[{ "tokenized": "r st nw", "tokenless": "r", "display": "R Street NW" }]', 12, 20, ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "Point", "coordinates": [ -85.41599750518799, 41.801166958738996, 9 ] }'), 4326));


            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    popQ.defer((done) => {
        cluster.address((err) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    popQ.defer((done) => {
        // check that text has r st, then mill st
        pool.query(`
            SELECT id, name FROM address_cluster ORDER BY id;
        `, (err, res) => {
            t.error(err, 'no errors');

            t.equals(res.rows.length, 1, 'one address cluster');

            t.deepEquals(res.rows[0].name, [{
                display: 'R Street NW',
                tokenized: 'r st nw',
                tokenless: 'r',
                freq: 3
            },{
                display: 'Mill Street NW',
                tokenized: 'mill st nw',
                tokenless: 'mill',
                freq: 2
            }], 'address cluster text ordered by number of addresses');

            return done();
        });
    });

    popQ.await((err) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('cluster.network', (t) => {
    const popQ = new Queue(1);

    //POPULATE NETWORK
    popQ.defer((done) => {
        pool.query(`
            BEGIN;
            INSERT INTO network (id, name, geom) VALUES (1, '{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }', ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "LineString", "coordinates": [ [ -66.05390310287476, 45.26961632842303, 1 ], [ -66.05441808700562, 45.271035832768376, 1 ] ]}'), 4326));
            INSERT INTO network (id, name, geom) VALUES (2, '{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }', ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "LineString", "coordinates": [ [ -66.05435371398926, 45.27100563091792, 2 ], [ -66.05493307113646, 45.27245530161207, 2 ] ]}'), 4326));
            INSERT INTO network (id, name, geom) VALUES (3, '{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }', ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "LineString", "coordinates": [ [ -113.50117206573485, 53.55137413785917, 3 ], [ -113.50112915039062, 53.54836549323335, 3 ] ]}'), 4326));
            INSERT INTO network (id, name, geom) VALUES (4, '{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }', ST_SetSRID(ST_GeomFromGeoJSON('{ "type": "LineString", "coordinates": [ [ -113.50100040435791, 53.54836549323335, 4 ], [ -113.50104331970215, 53.54614711825744, 4 ] ]}'), 4326));
            COMMIT;
        `, (err, res) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    popQ.defer((done) => {
        cluster.network((err) => {
            t.error(err, 'no errors');
            return done();
        });
    });

    popQ.defer((done) => {
        pool.query(`
            SELECT id, name, ST_AsGeoJSON(geom)::JSON AS geom, source_ids FROM network_cluster;
        `, (err, res) => {
            t.error(err, 'no errors');

            t.equals(res.rows.length, 2);
            t.deepEquals(res.rows[0], {
                geom: {
                    type: "MultiLineString",
                    coordinates: [[[-66.0539031028748,45.269616328423],[-66.0544180870056,45.2710358327684]],[[-66.0543537139893,45.2710056309179],[-66.0549330711365,45.2724553016121]]]
                },
                id: 1,
                name: {
                    freq: 1,
                    tokenized: 'main st',
                    tokenless: 'main',
                    display: 'Main Street'
                },
                source_ids: [ '1', '2' ]
            });

            t.deepEquals(res.rows[1], {
                id: 2,
                geom: {
                    type: "MultiLineString",
                    coordinates: [[[-113.501172065735,53.5513741378592],[-113.501129150391,53.5483654932333]],[[-113.501000404358,53.5483654932333],[-113.501043319702,53.5461471182574]]]
                },
                name: {
                    freq: 1,
                    display: 'Main Street',
                    tokenized: 'main st',
                    tokenless: 'main'
                },
                source_ids: [ '3', '4' ]
            });
            return done();
        });
    });

    popQ.await((err) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('cluster.collapse - identical segments', (t) => {
    pool.query(`
        INSERT INTO address_cluster (id, name, geom) VALUES (
            1,
            '[{ "tokenized": "main st", "tokenless": "main", "display": "Main Street" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[1,2,1],[2,3,2],[3,4,3]]}'), 4326)
        );

        INSERT INTO address_cluster (id, name, geom) VALUES (
            2,
            '[{ "tokenized": "independence ave", "tokenless": "independence", "display": "Independence Avenue" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[5,6,1],[6,7,2]]}'), 4326)
        );

        INSERT INTO network (id, geom, network_length) VALUES (
            5,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,1,5],[1,2,5]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, geom, network_length) VALUES (
            6,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,2,6],[2,2,6]]}'), 4326),
            1.0
        );

        INSERT INTO network_cluster (id, address, name, source_ids) VALUES (
            3,
            1,
            '{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }',
            '{5,6}'
        );
        INSERT INTO network_cluster (id, address, name, source_ids) VALUES (
            4,
            2,
            '{ "display": "Independence Avenue", "tokenized": "independence ave", "tokenless": "independence" }',
            '{5,6}'
        );
    `, (err, res) => {
        t.error(err, 'created & populated tables without error');
        cluster.collapse((err) => {
            t.error(err, 'cluster.collapse returned without error');
            pool.query(`
                SELECT id, address, name FROM network_cluster;
            `, (err, res) => {
                t.equals(res.rows.length, 1, 'only one row remains');
                t.equals(parseInt(res.rows[0].id), 3, 'main st feature still exists');

                t.deepEquals(res.rows[0].name, [
                    { display: 'Main Street', tokenized: 'main st', tokenless: 'main' },
                    { display: 'Independence Avenue', tokenized: 'independence ave', tokenless: 'independence' }
                ]);
                t.equals(parseInt(res.rows[0].address), 1, 'address cluster id is 1');
                pool.query(`
                    SELECT id, ST_Dump(geom) FROM address_cluster ORDER BY id ASC;
                `, (err, res) => {
                    t.equals(res.rows.filter((row) => { return parseInt(row.id) === 1; }).length, 5, '5 address points in cluster ID 1');
                    t.equals(res.rows.filter((row) => { return parseInt(row.id) === 2; }).length, 0, 'cluster ID 2 no longer exists');

                    t.end();
                });
            });
        });
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('cluster.collapse - identical segments (biggest address count takes priority)', (t) => {
    pool.query(`
        INSERT INTO address_cluster (id, name, geom) VALUES (
            1,
            '[{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[1,2,1],[2,3,2],[3,4,3]]}'), 4326)
        );
        INSERT INTO address_cluster (id, name, geom) VALUES (
            2,
            '[{ "display": "Independence Avenue", "tokenized": "independence ave", "tokenless": "independence" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[5,6,1],[6,7,2]]}'), 4326)
        );

        INSERT INTO network (id, geom, network_length) VALUES (
            5,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,1,5],[1,2,5]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, geom, network_length) VALUES (
            6,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,2,6],[2,2,6]]}'), 4326),
            1.0
        );

        INSERT INTO network_cluster (id, address, name, source_ids) VALUES (
            3,
            2,
            '{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }',
            '{5,6}'
        );
        INSERT INTO network_cluster (id, address, name, source_ids) VALUES (
            4,
            1,
            '{ "display": "Independence Avenue", "tokenized": "independence ave", "tokenless": "independence" }',
            '{5,6}'
        );
    `, (err, res) => {
        t.error(err, 'created & populated tables without error');
        cluster.collapse((err) => {
            t.error(err, 'cluster.collapse returned without error');
            pool.query(`
                SELECT id, address, name FROM network_cluster;
            `, (err, res) => {
                t.error(err, 'no errors');
                t.equals(res.rows.length, 1, 'only one row remains');
                t.equals(parseInt(res.rows[0].id), 4, 'main st feature still exists');

                t.deepEquals(res.rows[0].name, [
                    { display: 'Independence Avenue', tokenized: 'independence ave', tokenless: 'independence' },
                    { display: 'Main Street', tokenized: 'main st', tokenless: 'main' }
                ], 'name');

                t.equals(parseInt(res.rows[0].address), 1, 'address cluster id is 1');
                pool.query(`
                    SELECT id, ST_Dump(geom) FROM address_cluster ORDER BY id ASC;
                `, (err, res) => {
                    t.equals(res.rows.filter((row) => { return parseInt(row.id) === 1; }).length, 5, '5 address points in cluster ID 1');
                    t.equals(res.rows.filter((row) => { return parseInt(row.id) === 2; }).length, 0, 'cluster ID 2 no longer exists');
                    t.end();
                });
            });
        });
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('cluster.collapse - substantial overlap (fail on length)', (t) => {
    pool.query(`
        INSERT INTO address_cluster (id, name, geom) VALUES (
            1,
            '[{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[1,2,1],[2,3,2],[3,4,3]]}'), 4326)
        );
        INSERT INTO address_cluster (id, name, geom) VALUES (
            2,
            '[{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[5,6,1],[6,7,2]]}'), 4326)
        );

        INSERT INTO network (id, geom, network_length) VALUES (
            5,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,1,5],[1,2,5]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, geom, network_length) VALUES (
            6,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,2,6],[2,2,6]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, geom, network_length) VALUES (
            7,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[2,2,7],[4,2,7]]}'), 4326),
            2.0
        );

        INSERT INTO network_cluster (id, address, name, source_ids) VALUES (
            3,
            1,
            '{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }',
            '{5,6}'
        );
        INSERT INTO network_cluster (id, address, name, source_ids) VALUES (
            4,
            2,
            '{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }',
            '{5,6,7}'
        );
    `, (err, res) => {
        t.error(err, 'created & populated tables without error');
        cluster.collapse((err) => {
            t.error(err, 'cluster.collapse returned without error');
            pool.query(`
                SELECT id, address, name, source_ids FROM network_cluster ORDER BY id ASC;
            `, (err, res) => {
                t.equals(res.rows.length, 2, 'two rows remain (did not collapse)');
                t.equals(parseInt(res.rows[0].id), 3, 'main st feature #1 still exists');

                t.deepEquals(res.rows[0].name, [ { display: 'Main Street', tokenized: 'main st', tokenless: 'main' } ], 'name');

                t.deepEquals(res.rows[0].source_ids, ['5', '6'], 'source_ids');
                t.equals(parseInt(res.rows[0].address), 1, 'address cluster id');

                t.equals(parseInt(res.rows[1].id), 4, 'main st feature #2 still exists');
                t.deepEquals(res.rows[1].name, [ { display: 'Main Street', tokenized: 'main st', tokenless: 'main' } ], 'name');
                t.deepEquals(res.rows[1].source_ids, ['5', '6', '7'], 'source_ids');
                t.deepEquals(parseInt(res.rows[1].address), 2, 'address cluster id');

                pool.query(`
                    SELECT id, ST_Dump(geom) FROM address_cluster ORDER BY id ASC;
                `, (err, res) => {
                    t.equals(res.rows.filter((row) => { return parseInt(row.id) === 1; }).length, 3, '3 address points in cluster ID 1');
                    t.equals(res.rows.filter((row) => { return parseInt(row.id) === 2; }).length, 2, '2 address points in cluster ID 2');
                    t.end();
                });
            });
        });
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('cluster.collapse - substantial overlap (fail on text)', (t) => {
    pool.query(`
        INSERT INTO address_cluster (id, name, geom) VALUES (
            1,
            '[{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[1,2,1],[2,3,2],[3,4,3]]}'), 4326)
        );
        INSERT INTO address_cluster (id, name, geom) VALUES (
            2,
            '[{ "display": "Independence Avenue", "tokenized": "independence ave", "tokenless": "independence" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[5,6,1],[6,7,2]]}'), 4326)
        );

        INSERT INTO network (id, geom, network_length) VALUES (
            5,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,1,5],[1,2,5]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, geom, network_length) VALUES (
            6,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,2,6],[2,2,6]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, geom, network_length) VALUES (
            7,
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[2,2,7],[2.01,2,7]]}'), 4326),
            0.01
        );

        INSERT INTO network_cluster (id, address, name, source_ids) VALUES (
            3,
            1,
            '{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }',
            '{5,6}'
        );
        INSERT INTO network_cluster (id, address, name, source_ids) VALUES (
            4,
            2,
            '{ "display": "Independence Avenue", "tokenized": "independence ave", "tokenless": "independence" }',
            '{5,6,7}'
        );
    `, (err, res) => {
        t.error(err, 'created & populated tables without error');
        cluster.collapse((err) => {
            t.error(err, 'cluster.collapse returned without error');
            pool.query(`
                SELECT id, address, name, source_ids FROM network_cluster ORDER BY id ASC;
            `, (err, res) => {
                t.equals(res.rows.length, 2, 'two rows remain (did not collapse)');
                t.equals(parseInt(res.rows[0].id), 3, 'main st feature still exists');

                t.deepEquals(res.rows[0].name, [ { display: 'Main Street', tokenized: 'main st', tokenless: 'main' } ], 'name');

                t.deepEquals(res.rows[0].source_ids, ['5', '6'], 'source_ids');
                t.equals(parseInt(res.rows[0].address), 1, 'address cluster id');
                t.equals(parseInt(res.rows[1].id), 4, 'independence ave feature still exists');

                t.deepEquals(res.rows[1].name, [ { display: 'Independence Avenue', tokenized: 'independence ave', tokenless: 'independence' } ], 'name');

                t.deepEquals(res.rows[1].source_ids, ['5', '6', '7'], 'source_ids');
                t.deepEquals(parseInt(res.rows[1].address), 2, 'address cluster id');

                pool.query(`
                    SELECT id, ST_Dump(geom) FROM address_cluster ORDER BY id ASC;
                `, (err, res) => {
                    t.equals(res.rows.filter((row) => { return parseInt(row.id) === 1; }).length, 3, '3 address points in cluster ID 1');
                    t.equals(res.rows.filter((row) => { return parseInt(row.id) === 2; }).length, 2, '2 address points in cluster ID 2');
                    t.end();
                });
            });
        });
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err, 'no errors');
        t.end();
    });
});


test('cluster.collapse - substantial overlap (successful merge)', (t) => {
    pool.query(`
        INSERT INTO address_cluster (id, name, geom) VALUES (
            1,
            '[{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[1,2,1],[2,3,2],[3,4,3]]}'), 4326)
        );
        INSERT INTO address_cluster (id, name, geom) VALUES (
            2,
            '[{ "display": "Main Avenue", "tokenized": "main ave", "tokenless": "main" }]',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"MultiPoint","coordinates":[[5,6,1],[6,7,2]]}'), 4326)
        );

        INSERT INTO network (id, name, geom, network_length) VALUES (
            5,
            '{ "display": "Main Avenue", "tokenized": "main ave", "tokenless": "main" }',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,1,5],[1,2,5]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, name, geom, network_length) VALUES (
            6,
            '{ "display": "Main Avenue", "tokenized": "main ave", "tokenless": "main" }',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,2,6],[2,2,6]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, name, geom, network_length) VALUES (
            8,
            '{ "display": "Main Avenue", "tokenized": "main ave", "tokenless": "main" }',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[0.999,1,8],[1,1,8]]}'), 4326),
            0.001
        );
        INSERT INTO network (id, name, geom, network_length) VALUES (
            5,
            '{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,1,5],[1,2,5]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, name, geom, network_length) VALUES (
            6,
            '{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[1,2,6],[2,2,6]]}'), 4326),
            1.0
        );
        INSERT INTO network (id, name, geom, network_length) VALUES (
            7,
            '{ "display": "Main Street", "tokenized": "main st", "tokenless": "main" }',
            ST_SetSRID(ST_GeomFromGeoJSON('{"type":"LineString","coordinates":[[2,2,7],[2.001,2,7]]}'), 4326),
            0.002
        );
    `, (err, res) => {
        t.error(err, 'created & populated tables without error');

        cluster.network((err) => {
            t.error(err);

            pool.query(`
                UPDATE network_cluster SET address = 1 WHERE name ->> 'tokenized' = 'main st';
                UPDATE network_cluster SET address = 2 WHERE name ->> 'tokenized' = 'main ave';
            `, (err, res) => {
                t.error(err);

                cluster.collapse((err) => {
                    t.error(err, 'cluster.collapse returned without error');
                    pool.query(`
                        SELECT id, address, name, source_ids, st_length(geom) AS lngth FROM network_cluster ORDER BY id ASC;
                    `, (err, res) => {
                        t.equals(res.rows.length, 1, 'one row remains');
                        t.equals(parseInt(res.rows[0].id), 2, 'main st feature still exists');

                        t.deepEquals(res.rows[0].name, [
                            { freq: 1, display: 'Main Street', tokenized: 'main st', tokenless: 'main' },
                            { freq: 1, display: 'Main Avenue', tokenized: 'main ave', tokenless: 'main' }
                        ], 'name');

                        t.deepEquals(res.rows[0].source_ids, ['5', '6', '7', '8'], 'source_ids');
                        t.equals(res.rows[0].lngth, 2.002, 'length is expected');
                        t.equals(parseInt(res.rows[0].address), 1, 'address cluster id is 1');

                        pool.query(`
                            SELECT id, ST_Dump(geom) FROM address_cluster ORDER BY id ASC;
                        `, (err, res) => {
                            t.equals(res.rows.filter((row) => { return parseInt(row.id) === 1; }).length, 5, '5 address points in cluster ID 1');
                            t.equals(res.rows.filter((row) => { return parseInt(row.id) === 2; }).length, 0, '0 address points in cluster ID 2');
                            t.end();
                        });
                    });
                });
            });
        });
    });
});

test('Drop/Init Database', (t) => {
    index.init((err, res) => {
        t.error(err, 'no errors');
        t.end();
    });
});

test('end connection', (t) => {
    pool.end();
    t.end();
});
