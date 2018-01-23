const Cluster = require('./cluster');
const Cursor = require('pg-cursor');
const turf = require('@turf/turf');
const Units = require('./units');
const Post = require('./post');

/**
 * @class Orphan
 */
class Orphan {
    constructor(pool, opts, output) {
        this.pool = pool;
        this.opts = opts;
        this.output = output;
        this.post = new Post(opts);
    }

    /**
     * Cluster all orphan addresses not matched to a network_cluster,
     * output the resulting clusters to geojson.
     * @param {Function} cb Callback in (err, res)
     * @return {Function} cb
     */
    address(cb) {
        const self = this;

        const cluster = new Cluster({ pool: this.pool });

        cluster.orphan((err) => {

            this.pool.connect((err, client, done) => {
                if (err) return cb(err);

                const cursor = client.query(new Cursor(`
                    SELECT
                        name AS name,
                        ST_AsGeoJSON(geom)::JSON AS geom
                    FROM
                        address_orphan_cluster;
                `));

                return iterate();

                /**
                 * Iterate over unmatched address clusters using PG Cursor to avoid memory over utilization
                 */
                function iterate() {
                    cursor.read(1000, (err, rows) => {
                        if (err) return cb(err);

                        if (!rows.length) {
                            done();
                            return cb();
                        }

                        rows.forEach((row) => {
                            if (!row.name.some(name => { return name.display.trim().length })) return;

                            let feat = {
                                type: 'Feature',
                                properties: {
                                    'carmen:text': row.name,
                                    'carmen:addressnumber': []
                                },
                                geometry: {
                                    type: 'GeometryCollection',
                                    geometries: [{
                                        type: 'MultiPoint',
                                        coordinates: []
                                    }]
                                }
                            };

                            const units = new Units();

                            row.geom.coordinates.forEach((coord) => {
                                let num = units.decode(coord.pop());

                                if (!num || !num.output) return;

                                feat.properties['carmen:addressnumber'].push(num.num);
                                feat.geometry.geometries[0].coordinates.push(coord);
                            });

                            if (feat.geometry.geometries[0].coordinates.length) {
                                feat.properties['carmen:addressnumber'] = [ feat.properties['carmen:addressnumber'] ];

                                if (self.opts.country) feat.properties['carmen:geocoder_stack'] = self.opts.country;
                                feat = self.post.feat(feat);

                                if (feat) self.output.write(JSON.stringify(feat) + '\n');
                            }
                        });

                        return iterate();
                    });
                }
            });
        });

    }

    /**
     * Output all network_clusters not matched to an address_cluster
     * @param {Function} cb Callback in (err, res)
     * @return {Function} cb
     */
    network(cb) {
        const self = this;

        this.pool.connect((err, client, done) => {
            if (err) return cb(err);

            const cursor = client.query(new Cursor(`
                SELECT
                    name AS name,
                    ST_AsGeoJSON(geom)::JSON AS geom
                FROM network_cluster
                WHERE address IS NULL
            `));

            return iterate();

            /**
             * Iterate over unmatched networks using PG Cursor to avoid memory over utilization
             */
            function iterate() {
                cursor.read(1000, (err, rows) => {
                    if (err) return cb(err);

                    if (!rows.length) {
                        done();
                        return cb();
                    }

                    for (let row of rows) {
                        if (turf.lineDistance(row.geom) < 0.001) continue;
                        if (!row.name.some(name => { return name.display.trim().length })) continue;

                        let feat = {
                            type: 'Feature',
                            properties: {
                                'carmen:text': row.name,
                                'carmen:rangetype': 'tiger',
                                'carmen:parityl': [[]],
                                'carmen:parityr': [[]],
                                'carmen:lfromhn': [[]],
                                'carmen:rfromhn': [[]],
                                'carmen:ltohn': [[]],
                                'carmen:rtohn': [[]]
                            },
                            geometry: {
                                type: 'GeometryCollection',
                                geometries: [
                                    row.geom
                                ]
                            }
                        };

                        if (self.opts.country) feat.properties['carmen:geocoder_stack'] = self.opts.country;

                        feat = self.post.feat(feat);
                        if (feat) self.output.write(JSON.stringify(feat) + '\n');
                    }

                    return iterate();
                });
            }
        });
    }
}

module.exports = Orphan;
