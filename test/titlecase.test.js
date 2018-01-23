const tape = require('tape');
const titlecase = require('../lib/label/titlecase').titleCase;
const minors = require('@mapbox/title-case')('en');

tape('title case xformation', (t) => {
    let tests = [
        ['Väike-Sõjamäe', 'Väike-Sõjamäe'],
        ['Väike-sõjamäe', 'Väike-Sõjamäe'],
        ['väike-sõjamäe', 'Väike-Sõjamäe'],
        ['väike sõjamäe', 'Väike Sõjamäe'],
        ['väike  sõjamäe', 'Väike Sõjamäe'],
        ['Väike Sõjamäe', 'Väike Sõjamäe'],
        ['VäikeSõjamäe', 'Väikesõjamäe'],
        ['abra CAda -bra', 'Abra Cada Bra'],
        ['our lady of whatever', 'Our Lady of Whatever'],
        ['our lady OF whatever', 'Our Lady of Whatever'],
        ['St Martin\'s Neck Road', 'St Martin\'s Neck Road'],
        ['MT. MOOSILAUKE HWY', 'Mt. Moosilauke Hwy'],
        ['some  miscellaneous rd (what happens to parentheses?)', 'Some Miscellaneous Rd (What Happens to Parentheses?)'],
        ['main st NE', 'Main St NE'],
        ['main St NW', 'Main St NW'],
        ['SW Main St.', 'SW Main St.'],
        ['Main S.E. St', 'Main SE St'],
        ['main st ne', 'Main St NE'],
        ['nE. Main St', 'Ne. Main St']
    ];

    for (let test of tests) {
        t.equal(titlecase(test[0], minors), test[1], `${test[0]} => ${test[1]}`);
    }

    t.end();
});

tape('label logic, default behavior', (t) => {
    const label = require('../lib/label/titlecase')();
    let tests = [
        [[
            { freq: 12, display: 'our lady of whatever', tokenized: 'our lady of whatever', source: 'address' },
            { freq: 2, display: 'our lady', tokenized: 'our lady', source: 'network' }
        ], 'Our Lady of Whatever,Our Lady'],
        [[
            { display: 'our lady of whatever', tokenized: 'our lady of whatever', source: 'address' },
            { display: 'OUR LADY of WHATEVER', tokenized: 'our lady of whatever', source: 'network' }
        ], 'Our Lady of Whatever'],
        [[
            { display: 'Our Lady of whatever', tokenized: 'our lady of whatever', source: 'address' },
            { display: 'OUR LÄDY OF WHATEVER', tokenized: 'our lady of whatever', source: 'network' }
        ], 'Our Lady of Whatever'],
        [[
            { display: 'York Branch Road', tokenized: 'york br rd', source: 'address' },
            { display: 'York Road', tokenized: 'york rd', source: 'address' },
            { display: 'York Road', tokenized: 'york rd', source: 'network' }
        ], 'York Road,York Branch Road'],
        [[
            {"freq": 603, "source": "address", "display": "GRAND AVE", "priority": 0, "tokenized": "grand av", "tokenless": "grand"},
            {"freq": 17, "source": "address", "display": "GRAND VALLEY DR", "priority": 0, "tokenized": "grand vly dr", "tokenless": "grand"},
            {"freq": 3, "source": "address", "display": "Grand Ave", "priority": 0, "tokenized": "grand av", "tokenless": "grand"},
            {"freq": 1, "source": "network", "display": "Grand Avenue", "priority": 0, "tokenized": "grand av", "tokenless": "grand"}
        ], 'Grand Avenue,Grand Valley Dr'],
        [[
            { display: 'State Highway 123', tokenized: 'state hwy 123', source: 'address', priority: 1 },
            { display: 'State Highway 123 ABC', tokenized: 'state hwy 123', source: 'address' }, //Should be deduped on tokenized
            { display: 'NC 123', tokenized: 'nc 123', source: 'network', priority: 5 }
        ], 'Nc 123,State Highway 123']
    ];

    for (let test of tests) {
        t.equal(label(test[0], true), test[1], `${test[0][0].display}/${test[0][1].display} => ${test[1]}`);
    }

    t.end();
});
