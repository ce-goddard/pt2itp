const post = require('../lib/post/cardinality').post;
const test = require('tape');

test('Post: Cardinality', (t) => {
    t.equals(post(), undefined);
    t.deepEquals(post({}), {});
    t.deepEquals(post({
        properties: {}
    }), {
        properties: {}
    });

    t.equals(f('Test'), 'Test');
    t.equals(f('Main St'), 'Main St');
    t.equals(f('S Main St'), 'S Main St,Main St S,Main St');
    t.equals(f('South Main St'), 'South Main St,Main St South,Main St');
    t.equals(f('Main St South'), 'Main St South,South Main St,Main St');

    t.equals(f('South Main St,Fake St South'), 'South Main St,Fake St South,Main St South,Main St,South Fake St,Fake St');

    //Random Sample From SG File
    t.equals(f('TUAS SOUTH BOULEVARD'), 'TUAS SOUTH BOULEVARD'); //We don't handle this format atm
    t.equals(f('JURONG WEST AVENUE'), 'JURONG WEST AVENUE');

    t.equals(f('ADMIRALTY ROAD EAST'), 'ADMIRALTY ROAD EAST,EAST ADMIRALTY ROAD,ADMIRALTY ROAD');
    t.equals(f('ADMIRALTY ROAD WEST'), 'ADMIRALTY ROAD WEST,WEST ADMIRALTY ROAD,ADMIRALTY ROAD');
    t.equals(f('EAST COAST PARKWAY'), 'EAST COAST PARKWAY,COAST PARKWAY EAST,COAST PARKWAY');
    t.equals(f('CORONATION ROAD WEST'), 'CORONATION ROAD WEST,WEST CORONATION ROAD,CORONATION ROAD');
    t.equals(f('BEDOK INDUSTRIAL PARK E'), 'BEDOK INDUSTRIAL PARK E,E BEDOK INDUSTRIAL PARK,BEDOK INDUSTRIAL PARK');
    t.equals(f('WEST COAST WALK'), 'WEST COAST WALK,COAST WALK WEST,COAST WALK');
    t.equals(f('TANJONG KATONG ROAD SOUTH'), 'TANJONG KATONG ROAD SOUTH,SOUTH TANJONG KATONG ROAD,TANJONG KATONG ROAD');
    t.equals(f('WEST COAST VIEW'), 'WEST COAST VIEW,COAST VIEW WEST,COAST VIEW');

    t.end();
});

/**
 * Create input Feature given text
 * @param {string} text
 * @return {Object} GeoJSON Feature
 */
function f(text) {
    return post({
        type: 'Feature',
        properties: {
            'carmen:text': text
        }
    }).properties['carmen:text'];
}
