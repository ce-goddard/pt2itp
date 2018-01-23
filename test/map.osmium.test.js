const map = require('../lib/map/osmium').map;
const test = require('tape');

test('Osmium', (t) => {
    t.equals(map({
        type: 'Feature',
        geometry: {
            type: 'Polygon'
        }
    },{}), false, 'Feat must be a (Multi)LineString geom');

    t.equals(map({
        type: 'Feature',
        geometry: {
            type: 'LineString'
        }
    },{}), false, 'Feat must have Properties');

    t.equals(map({
        type: 'Feature',
        properties: { },
        geometry: {
            type: 'LineString'
        }
    },{}), false, 'Feat must have Highway');

    t.equals(map({
        type: 'Feature',
        properties: {
            name: 'Test',
            highway: 'fake'
        },
        geometry: {
            type: 'LineString'
        }
    },{}), false, 'Feat must be valid Highway');

    t.equals(map({
        type: 'Feature',
        properties: {
            name: 'Test',
            highway: 'primary'
        },
        geometry: {
            type: 'LineString',
            coordinates: [[0,0], [0,0]]
        }
    },{}), false, 'Feat must have length');

    //Streets allowed to be missing names
    for (let type of ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'unclassified', 'living_street', 'pedestrian', 'road']) {
        t.deepEquals(map({
            type: 'Feature',
            properties: {
                "@id": 1,
                highway: type
            },
            geometry: {
                type: 'LineString',
                coordinates: [[0,0],[1,1]]
            }
        },{}), [{ geometry: { type: 'LineString', coordinates: [[0,0], [1,1]] }, properties: { id: 1, street: { display: '', priority: 0 } }, type: 'Feature' }], `${type} is accepted`);
    }

    //Streets required to have names as they are lower quality tags
    for (let type of ['track', 'service', 'construction', 'proposed', 'footway']) {
        t.equals(map({
            type: 'Feature',
            properties: {
                highway: type
            },
            geometry: {
                type: 'LineString',
                coordinates: [[0,0],[1,1]]
            }
        },{}), false, `${type} requires name`);
    }

    for (let type of ['track', 'service', 'construction', 'proposed', 'footway']) {
        t.deepEquals(map({
            type: 'Feature',
            properties: {
                "@id": 2,
                highway: type,
                name: 'Test'
            },
            geometry: {
                type: 'LineString',
                coordinates: [[0,0],[1,1]]
            }
        },{}), [{ geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 2, street: { display: 'Test', priority: 0 } }, type: 'Feature' }], `${type} is accepted w/ name`);
    }

    t.deepEquals(map({
        type: 'Feature',
        properties: {
            highway: 'motorway',
            "@id": 3,
            name: 'name',
            loc_name: 'loc_name',
            alt_name: 'alt_name',
            ref: 'ref'
        },
        geometry: {
            type: 'LineString',
            coordinates: [[0,0],[1,1]]
        }
    },{}), [
        { geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 3, street: { display: 'name', priority: 0 } }, type: 'Feature' },
        { geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 3, street: { display: 'loc_name', priority: 0 } }, type: 'Feature' },
        { geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 3, street: { display: 'alt_name', priority: 0 } }, type: 'Feature' },
        { geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 3, street: { display: 'ref', priority: 0 } }, type: 'Feature' }], 'AltNames');

    t.deepEquals(map({
        type: 'Feature',
        properties: {
            "@id": 4,
            highway: 'motorway',
            name: '1 Name;2 Name;3 Name'
        },
        geometry: {
            type: 'LineString',
            coordinates: [[0,0],[1,1]]
        }
    },{}), [
        { geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 4, street: { display: '1 Name', priority: 0 } }, type: 'Feature'},
        { geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 4, street: { display: '2 Name', priority: 0 } }, type: 'Feature'},
        { geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 4, street: { display: '3 Name', priority: 0 } }, type: 'Feature'}
    ], 'OSM ; AltNames');

    t.deepEquals(map({
        type: 'Feature',
        properties: {
            '@id': 5,
            highway: 'motorway',
            name: '1 Name; '
        },
        geometry: {
            type: 'LineString',
            coordinates: [[0,0],[1,1]]
        }
    },{}), [{ geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 5, street: { display: '1 Name', priority: 0 } }, type: 'Feature' }], 'OSM ; AltNames null');

    // remove octothorpes from highway names
    t.deepEquals(map({
        type: 'Feature',
        properties: {
            highway: 'motorway',
            "@id": 3,
            name: 'name',
            ref: 'HWY #35'
        },
        geometry: {
            type: 'LineString',
            coordinates: [[0,0],[1,1]]
        }
    },{country: "us"}), [
        { geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 3, street: { display: 'name', priority: 0 } }, type: 'Feature' },
        { geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: { id: 3, street: { display: 'HWY 35', priority: 0 } }, type: 'Feature' }
    ], 'HWY # replaced');

    // handle suffixless numeric streets
    let streets = [
        ['1 Ave', 'st'],
        ['2 St', 'nd'],
        ['3 Lane', 'rd'],
        ['4 St', 'th'],
        ['10 Ave', 'th'],
        ['11 Ave', 'th'],
        ['12 Ave', 'th'],
        ['13 Ave', 'th'],
        ['14 Ave', 'th'],
        ['21 Ave', 'st'],
        ['22 Ave', 'nd'],
        ['23 Ave', 'rd'],
        ['34 Ave', 'th'],
        ['101 St', 'st']
    ];
    streets.forEach((x) => {
        let res = map({
            type: 'Feature',
            properties: {
                highway: 'motorway',
                "@id": 3,
                name: x[0]
            },
            geometry: {
                type: 'LineString',
                coordinates: [[0,0],[1,1]]
            }
        }, { country: 'us' });

        t.equals(res.length, 2, '2 feats returned');

        let desired = x[0].split(' ')[0] + x[1] + ' ' + x[0].split(' ')[1];

        let modified = res.filter((y) => { return y.properties.street.display === desired; });
        let original = res.filter((y) => { return y.properties.street.display === x[0]; });

        t.equals(original.length, 1, x[0] + ' still present');
        t.equals(modified.length, 1, desired + ' is present');

        modified = modified[0];
        original = original[0];

        t.ok((original.properties.street.priority || 0) > (modified.properties.street.priority || 0), 'original feature has higher priority');
    });

    streets.forEach((x) => {
        let res = map({
            type: 'Feature',
            properties: {
                highway: 'motorway',
                "@id": 3,
                name: x[0]
            },
            geometry: {
                type: 'LineString',
                coordinates: [[0,0],[1,1]]
            }
        }, { country: 'de' });
        t.equals(res.length, 1, x[0] + ' unmodified when country=de');
    });

    for (let name of [
        'State Highway 123',
        'Highway 123',
        'Hwy 123',
        '123 hwy',
        '123 Highway',
        'Pennsylvania Hwy 123',
        'Pennsylvania highway 123',
        'PA 123'
    ]) {
        t.deepEquals(map({
            type: 'Feature',
            properties: {
                highway: 'motorway',
                "@id": 3,
                name: name
            },
            geometry: {
                type: 'LineString',
                coordinates: [[0,0],[1,1]]
            }
        }, { country: "us", region: "pa"}), [
            { type: 'Feature', properties: { id: 3, street: { display: name, priority: 0 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
            { type: 'Feature', properties: { id: 3, street: { display: 'PA 123', priority: -1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
            { type: 'Feature', properties: { id: 3, street: { display: 'PA 123 Highway', priority: -1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
            { type: 'Feature', properties: { id: 3, street: { display: 'Pennsylvania Highway 123', priority: 1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
            { type: 'Feature', properties: { id: 3, street: { display: 'Highway 123', priority: -1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
            { type: 'Feature', properties: { id: 3, street: { display: 'State Highway 123', priority: -1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } }
        ], `STATE HIGHWAY: ${name}`);
    }

    for (let name of [
        'us-81',
        'US 81',
        'U.S. Route 81',
        'US Route 81',
        'US Rte 81',
        'US Hwy 81',
        'US Highway 81',
        'United States 81',
        'United States Route 81',
        'United States Highway 81',
        'United States Hwy 81',
    ]) {
        t.deepEquals(map({
            type: 'Feature',
            properties: {
                highway: 'motorway',
                "@id": 3,
                name: name
            },
            geometry: {
                type: 'LineString',
                coordinates: [[0,0],[1,1]]
            }
        }, { country: "us", region: "pa"}), [
             { type: 'Feature', properties: { id: 3, street: { display: name, priority: 0 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
             { type: 'Feature', properties: { id: 3, street: { display: 'US 81', priority: -1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
             { type: 'Feature', properties: { id: 3, street: { display: 'US Route 81', priority: 1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
             { type: 'Feature', properties: { id: 3, street: { display: 'US Highway 81', priority: -1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
             { type: 'Feature', properties: { id: 3, street: { display: 'United States Route 81', priority: -1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } },
             { type: 'Feature', properties: { id: 3, street: { display: 'United States Highway 81', priority: -1 } }, geometry: { type: 'LineString', coordinates: [ [ 0, 0 ], [ 1, 1 ] ] } }
        ], `US ROUTE: ${name}`);
    }

    t.end();
});

