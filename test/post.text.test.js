const post = require('../lib/post/text').post;
const test = require('tape');

const args = {
    label: require('../lib/label/titlecase')()
}

test('Post: Text', (t) => {
    t.deepEquals(post(), undefined, 'return unprocessable 1');

    t.deepEquals(post({
        properties: undefined
    }), {
        properties: undefined
    }, 'return unprocessable 2');

    t.deepEquals(post({
        properties: {
            'carmen:text': [{ display: 'Main Street', tokenized: 'main st' }],
            'carmen:text_xx': [{ display: 'Spring Rd', tokenized: 'spring rd' }]
        }
    }, args), {
        properties: {
            'carmen:text': 'Main Street',
            'carmen:text_xx': 'Spring Rd'
        }
    }, 'preserve basic feature');

    t.deepEquals(post({
        properties: {
            'carmen:text': [
                { freq: 12, display: 'Main Street', tokenized: 'main st' },
                { freq: 2, display: 'Some Other St', tokenized: 'some other st' },
                { display: 'Main Street', tokenized: 'main st' },
            ],
            'carmen:text_xx': [
                { display: 'Spring Rd', tokenized: 'spring rd' },
                { display: 'Spring Rd', tokenized: 'spring rd' }
            ]
        }
    }, args), {
        properties: {
            'carmen:text': 'Main Street,Some Other St',
            'carmen:text_xx': 'Spring Rd'
        }
    }, 'dedupe identical strings');

    t.deepEquals(post({
        properties: {
            'carmen:text': [
                { freq: 12, display: 'Main St', tokenized: 'main st' },
                { display: 'Some Other St', tokenized: 'some other st' },
                { freq: 12, display: 'Main Street', tokenized: 'main st' }
            ],
            'carmen:text_xx': [
                { display: 'Spring Road', tokenized: 'spring rd' },
                { display: 'Spring Rd', tokenized: 'spring rd' }
            ],
            'carmen:text_es': [
                { priority: 1, display: 'Pta Something', tokenized: 'pta something' },
                { freq: 2,display: 'Spring Road', tokenized: 'spring rd' },
                { freq: 12, display: 'Puerta Something', tokenized: 'puerta something' }
            ]
        }
    }, args), {
        properties: {
            'carmen:text': 'Main Street,Some Other St',
            'carmen:text_xx': 'Spring Road',
            'carmen:text_es': 'Pta Something,Puerta Something,Spring Road'

        }
    }, 'dedupe tokens, single language');

    t.deepEquals(post({
        properties: {
            'carmen:text': [
                { display: '204 Haywood Rd', tokenized: '204 haywood rd' },
                { display: '201 Haywood Rd', tokenized: '201 haywood rd' },
                { display: '202 Haywood Rd', tokenized: '202 haywood rd' },
                { display: '203 Haywood Rd', tokenized: '203 haywood rd' },
                { display: '208 Haywood Rd', tokenized: '208 haywood rd' },
                { display: '209 Haywood Rd', tokenized: '209 haywood rd' },
                { display: '210 Haywood Rd', tokenized: '210 haywood rd' },
                { display: '211 Haywood Rd', tokenized: '211 haywood rd' },
                { display: '212 Haywood Rd', tokenized: '212 haywood rd' },
                { display: '213 Haywood Rd', tokenized: '213 haywood rd' },
                { display: '214 Haywood Rd', tokenized: '214 haywood rd' },
                { display: '215 Haywood Rd', tokenized: '215 haywood rd' },
                { display: '216 Haywood Rd', tokenized: '216 haywood rd' },
                { display: '217 Haywood Rd', tokenized: '217 haywood rd' },
                { display: '218 Haywood Rd', tokenized: '218 haywood rd' }
            ]
        }
    }, args), {
        properties: {
            'carmen:text': '201 Haywood Rd,202 Haywood Rd,203 Haywood Rd,204 Haywood Rd,208 Haywood Rd,209 Haywood Rd,210 Haywood Rd,211 Haywood Rd,212 Haywood Rd,213 Haywood Rd'
        }
    }, 'dedupe tokens, excessive synonyms');

    t.end();
});
