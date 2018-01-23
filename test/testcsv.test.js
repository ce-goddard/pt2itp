const csv = require('fast-csv');
const spawn = require('tape-spawn');
const test = require('tape');
const path = require('path');

const carmenIndex = path.resolve(__dirname, './fixtures/test-ri/index/us_ri-address-both-0d603c2a171017011038-0d603c2a39.mbtiles');
const input = path.resolve(__dirname, './fixtures/test-ri/address.csv');
const output = '/tmp/testcsv-ri.err';
const config = path.resolve(__dirname, './fixtures/test-ri/carmen-config2.json');

test('testcsv', (t) => {
    t.test('Return correct std.err message', (t) => {
        let st = spawn(t, `${__dirname}/../index.js testcsv --index ${carmenIndex} --input ${input} --output ${output} --config ${config}`);
        st.stderr.match(`
            ERROR TYPE                   COUNT
            -----------------------------------------------------------------------------------
            DIST                             6 ( 50.0% of errors | 18.2% of total addresses)
            NO RESULTS                       6 ( 50.0% of errors | 18.2% of total addresses)

            ok - 12/33 (36.4%) failed to geocode
            ok - 0/0 (NaN%) ITP results failed to geocode

            DIST statistical breakdown
            -----------------------------------------------------------------------------------
            DIST - mean: 7352.73 / median: 7352.73 / skew: 0.00 / standard dev: 6879.86
        `.replace(/^ +/mg, ''));
        st.end();
    });

    t.test('Return correct error messages in csv', (t) => {
        let csvErrs = [];

        csv.fromPath(output, {headers: true})
        .on('data', (data) => {
            csvErrs.push(data);
        })
        .on('end', () => {
            t.equal(csvErrs.length, 12);
            t.equal(csvErrs.filter(ele => ele.query === '26 Greenview Rd')[0].error, 'DIST');
            t.equal(csvErrs.filter(ele => ele.query === '31 Greenview Rd')[0].error, 'DIST');
            t.equal(csvErrs.filter(ele => ele.query === '34 grn vw rd')[0].error, 'NO RESULTS');
            t.equal(csvErrs.filter(ele => ele.query === '40 greeeeeenview rd')[0].error, 'NO RESULTS');
            t.end();
        });
    });
});
