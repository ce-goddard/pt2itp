var tokenize = require('../lib/tokenize');
var test = require('tape');

test('tokenizes basic strings', function(t) {
    t.deepEqual(tokenize('foo'), ['foo']);
    t.deepEqual(tokenize('foo bar'), ['foo', 'bar']);
    t.deepEqual(tokenize('foo-bar'), ['foo', 'bar'], 'splits on - (non-numeric)');
    t.deepEqual(tokenize('foo+bar'), ['foo', 'bar'], 'splits on +');
    t.deepEqual(tokenize('foo_bar'), ['foo', 'bar'], 'splits on _');
    t.deepEqual(tokenize('foo:bar'), ['foo', 'bar'], 'splits on :');
    t.deepEqual(tokenize('foo;bar'), ['foo', 'bar'], 'splits on ;');
    t.deepEqual(tokenize('foo|bar'), ['foo', 'bar'], 'splits on |');
    t.deepEqual(tokenize('foo}bar'), ['foo', 'bar'], 'splits on }');
    t.deepEqual(tokenize('foo{bar'), ['foo', 'bar'], 'splits on {');
    t.deepEqual(tokenize('foo[bar'), ['foo', 'bar'], 'splits on [');
    t.deepEqual(tokenize('foo]bar'), ['foo', 'bar'], 'splits on ]');
    t.deepEqual(tokenize('foo(bar'), ['foo', 'bar'], 'splits on (');
    t.deepEqual(tokenize('foo)bar'), ['foo', 'bar'], 'splits on )');
    t.deepEqual(tokenize('foo b.a.r'), ['foo', 'bar'], 'collapses .');
    t.deepEqual(tokenize('foo\'s bar'), ['foos', 'bar'], 'collapses apostraphe');
    t.deepEqual(tokenize('69-150'), ['69-150']);
    t.deepEqual(tokenize('4-10'), ['4-10']);
    t.deepEqual(tokenize('5-02A'), ['5-02a']);
    t.deepEqual(tokenize('23-'), ['23']);
    t.deepEqual(tokenize('San José'), ['san', 'josé']);
    t.deepEqual(tokenize('Chamonix-Mont-Blanc'), ['chamonix','mont','blanc']);
    t.deepEqual(tokenize('Москва'), ['москва']);
    t.deepEqual(tokenize('京都市'), ['京都市']);
    t.end();
});
test('edge cases - empty string', function(t) {
    t.deepEqual(tokenize(''), []);
    t.end();
});

