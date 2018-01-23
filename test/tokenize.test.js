const tokenize = require('../lib/tokenize');
const test = require('tape');
const fs = require('fs');

test('tokenizes basic strings', (t) => {
    t.deepEqual(tokenize.main('foo'), ['foo']);
    t.deepEqual(tokenize.main('foo bar'), ['foo', 'bar']);
    t.deepEqual(tokenize.main('foo-bar'), ['foo', 'bar'], 'splits on - (non-numeric)');
    t.deepEqual(tokenize.main('foo+bar'), ['foo', 'bar'], 'splits on +');
    t.deepEqual(tokenize.main('foo_bar'), ['foo', 'bar'], 'splits on _');
    t.deepEqual(tokenize.main('foo:bar'), ['foo', 'bar'], 'splits on :');
    t.deepEqual(tokenize.main('foo;bar'), ['foo', 'bar'], 'splits on ;');
    t.deepEqual(tokenize.main('foo|bar'), ['foo', 'bar'], 'splits on |');
    t.deepEqual(tokenize.main('foo}bar'), ['foo', 'bar'], 'splits on }');
    t.deepEqual(tokenize.main('foo{bar'), ['foo', 'bar'], 'splits on {');
    t.deepEqual(tokenize.main('foo[bar'), ['foo', 'bar'], 'splits on [');
    t.deepEqual(tokenize.main('foo]bar'), ['foo', 'bar'], 'splits on ]');
    t.deepEqual(tokenize.main('foo(bar'), ['foo', 'bar'], 'splits on (');
    t.deepEqual(tokenize.main('foo)bar'), ['foo', 'bar'], 'splits on )');
    t.deepEqual(tokenize.main('foo b.a.r'), ['foo', 'bar'], 'collapses .');
    t.deepEqual(tokenize.main('foo\'s bar'), ['foos', 'bar'], 'collapses apostraphe');
    t.deepEqual(tokenize.main('69-150'), ['69-150'], 'does not drop number hyphen');
    t.deepEqual(tokenize.main('4-10'), ['4-10']);
    t.deepEqual(tokenize.main('5-02A'), ['5-02a']);
    t.deepEqual(tokenize.main('23-'), ['23'], 'drops dash at end of number');
    t.deepEqual(tokenize.main('San José'), ['san', 'josé'], 'does not drop accent');
    t.deepEqual(tokenize.main('A Coruña'), [ 'a', 'coruña' ], 'does not drop ñ');
    t.deepEqual(tokenize.main('Chamonix-Mont-Blanc'), ['chamonix','mont','blanc'], 'drops hyphen between words');
    t.deepEqual(tokenize.main('Rue d\'Argout'), [ 'rue', 'dargout' ], 'drops apostraphe');
    t.deepEqual(tokenize.main('Hale’iwa Road'), [ 'haleiwa', 'road' ]);
    t.deepEqual(tokenize.main('Москва'), ['москва']);
    t.deepEqual(tokenize.main('京都市'), ['京都市']);
    t.deepEqual(tokenize.main('ஜொஹோர் பாரு'), [ 'ஜொஹோர்', 'பாரு' ]);
    t.end();
});

test('Uses replacement tokens', (t) => {
    t.deepEqual(tokenize.main('foo', null), ['foo'], 'handles null token replacer');
    t.deepEqual(tokenize.main('foo', {}), ['foo'], 'handles empty args');
    t.deepEqual(tokenize.main('foo', { tokens: [] }), ['foo'], 'handles empty tokens array');
    t.deepEqual(tokenize.main('barter', { 'barter': 'foo' }), ['foo'], 'basic single replacement');
    t.deepEqual(tokenize.main('abc 234 def', { '(?<number>2\\d+)': '###${number}###' }), ['abc', '234', 'def'], 'named replacement');
    t.end();
});

test('removeDiacritics', (t) => {
    t.equal(tokenize.main("Hérê àrë søme wöřdš, including diacritics and puncatuation!").join(' '), 'hérê àrë søme wöřdš including diacritics and puncatuation', "diacritics are removed from latin text");
    t.equal(tokenize.main("Cranberries are low, creeping shrubs or vines up to 2 metres (7 ft)").join(' '), 'cranberries are low creeping shrubs or vines up to 2 metres 7 ft', "nothing happens to latin text with no diacritic marks");
    t.equal(tokenize.main("堪《たま》らん！」と片息《かたいき》になつて、喚《わめ》").join(' '), "堪《たま》らん！」と片息《かたいき》になつて、喚《わめ》", "nothing happens to Japanese text");
    t.equal(tokenize.main("किसी वर्ण के मूल चिह्न के ऊपर, नीचे, अलग-बगल लगने").join(' '), 'किसी वर्ण के मूल चिह्न के ऊपर नीचे अलग बगल लगने', "nothing happens to Hindi text");
    t.equal(tokenize.main("άΆέΈήΉίΊόΌύΎ αΑεΕηΗιΙοΟυΥ").join(' '), 'άάέέήήίίόόύύ ααεεηηιιοουυ', "greek diacritics are removed and other characters stay the same");
    t.equal(tokenize.main("ўЎёЁѐЀґҐйЙ уУеЕеЕгГиИ").join(' '), 'ўўёёѐѐґґйй ууееееггии', "cyrillic diacritics are removed and other characters stay the same");

    t.end();
});

test('edge cases - empty string', (t) => {
    t.deepEqual(tokenize.main(''), []);
    t.end();
});

test('test for global tokens', (t) => {
    let tokens = {'\\b(.+)(strasse|str|straße)\\b': "$1 str"};
    let query = 'talstrasse';
    let tokensRegex = tokenize.createGlobalReplacer(tokens);
    let replace = tokenize.replaceToken(tokensRegex, query);
    t.deepEqual('tal str', replace, 'handles global tokens - Strasse');
    t.end();
});


test('test for global tokens', (t) => {
    let tokens = {'\\bPost Office\\b': "Po"};
    let query = 'Post Office 25';
    let tokensRegex = tokenize.createGlobalReplacer(tokens);
    let replace = tokenize.replaceToken(tokensRegex, query);
    t.deepEqual('Po 25', replace, 'handles global tokens - Post Office');
    t.end();
});
