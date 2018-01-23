const Index = require('../lib/index');
const worker = require('../lib/map');
const exec = require('child_process').exec;
const fs = require('fs');

const spawn = require('tape-spawn');
const csv = require('fast-csv');
const test = require('tape');
const path = require('path');
const pg = require('pg');

const database = 'pt_test';
const carmenIndex = '/tmp/test-ri.mbtiles';
const output = '/tmp/test-ri.err';
const config = path.resolve(__dirname, './fixtures/test-ri/carmen-config.json');


const pool = new pg.Pool({
    max: 10,
    user: 'postgres',
    database: database,
    idleTimeoutMillis: 30000
});

// step 1: pt2itp map
const index = new Index(pool);

test('Drop/init database', (t) => {
    index.init((err, res) => {
        t.ifError(err);
        t.end();
    });
});

// loads address and network data into postgres
test('load address and network files', (t) => {
    worker({
        'in-address': './test/fixtures/test-ri/address.geojson',
        'in-network': './test/fixtures/test-ri/network.geojson',
        output: '/tmp/itp.geojson',
        debug: true,
        db: database,
        tokens: 'en'
    }, (err, res) => {
        t.ifError(err);
        t.end();
    });
});

// make sure to delete /tmp/test-ri.* before running indexer
test('clean up any previous database files', (t) => {
    exec('rm -rf /tmp/test-ri.*', (err, stdout, stderr) => {
        t.ifError(err);
        if (fs.existsSync('/tmp/test-ri.mbtiles')) {
            t.equal(fs.existsSync('/tmp/test-ri.mbtiles'), false, 'cleans up test-ri.mbtiles');
        }
        t.end();
    });
});

// step 2: create index file for test mode
// cat <geojson> | carmen-index --config=${config} --index=${carmenIndex}
test('create index from geojson', (t) => {
    exec(`cat /tmp/itp.geojson | ${__dirname}/../node_modules/.bin/carmen-index --config=${config} --index=${carmenIndex}`, (err, stdout, stderr) => {
        t.ifError(err);
        t.equal(fs.existsSync('/tmp/test-ri.mbtiles'), true, 'creates test-ri.mbtiles');
        t.end();
    });
});

test('query from new index', (t) => {
    exec(`${__dirname}/../node_modules/.bin/carmen --query "5 Greenview Rd" ${carmenIndex} | grep "1.00 5 Greenview Rd" | tr -d '\n'`, (err, res) => {
        t.ifError(err);
        t.equal(res.split(',')[0], "- 1.00 5 Greenview Rd", 'Finds 5 Greenview Rd');
        t.end();
    });
});

// step 3: run test mode against the built index
test('Run test mode', (t) => {
    exec(`${__dirname}/../index.js test --config=${config} --index=${carmenIndex} --db=${database} -o ${output}`, (err, stdout, stderr) => {
        t.test('Return correct error messages in csv', (t) => {
            let csvErrs = [];
            let queryResults;

            csv.fromPath(output, {headers: true})
            .on('data', (data) => {
                csvErrs.push(data);
            })
            .on('end', () => {
                t.equal(csvErrs.length, 2);
                t.equal(csvErrs.filter(ele => ele.query === '5 greeeeeenview rd')[0].error, 'TEXT');
                t.equal(csvErrs.filter(ele => ele['addr text'] === 'greeeeeenview')[0].error, 'NAME MISMATCH (SOFT)');
                t.end();
            });
        });
    });
});

test('end connection', (t) => {
   pool.end();
   t.end();
});
