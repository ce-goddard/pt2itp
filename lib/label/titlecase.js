/*eslint no-lonely-if: "off"*/ // <-- complying with this linting rule would reduce code readability
const wordBoundary = new RegExp("[\\s\\u2000-\\u206F\\u2E00-\\u2E7F\\\\!\"#$%&()*+,\\-.\\/:;<=>?@\\[\\]^_{|}~]+", 'g');
const allowedAfterSpace = new RegExp("[()#<>\\[\\]{}\"]+");
const diacritics = require('diacritics').remove;
const dist = require('fast-levenshtein').get
const numCaseChanges = require('./util').numCaseChanges;
const isUpperCase = require('./util').isUpperCase;
const _ = require('lodash');

module.exports = (opts = {}) => {
    // for the time being we only use en rules -- supporting culturally correct capitalization
    // conventions is an effort that has to span layers beyond just address
    let titleCaseConfig = require('@mapbox/title-case')('en');

    return (texts) => {
        texts = texts.map((text) => {
            if (text.priority === 0 || !text.priority) {
                //Less Desirable street names
                let subs = ['ext', 'extension', 'connector', 'br', 'branch', 'unit', 'apt', 'suite', 'lot'];

                tokens = text.tokenized.split(' ');
                for (token of tokens) {
                    if (subs.indexOf(token) >= 0) {
                        text.priority = -1;
                        break;
                    }
                }

                //Freq Values on identical tokenless values must match
                for (let tmatch of texts) {
                    if (text.tokenized === tmatch.tokenized && text.freq < tmatch.freq) {
                        text.freq = tmatch.freq;
                    }
                }
            }

            return text;
        });

        texts = _.uniqBy(texts, (name) => {
            //Remove duplicate display fields
            return name.display
        }).filter((name) => {
            //Eliminate empty names
            try {
                if (!name.display.trim()) return false;
            } catch (err) {
                console.error(JSON.stringify(name));
                throw err;
            }
            return true;
        }).map((name) => {
            //Add character length for next deduping operation
            name.display_length = name.display.length;
            //Ensure priority is set otherwise null values are > +INT values in next sort
            if (!name.priority) name.priority = 0;

            //Ensure Freq is set for same reason
            if (!name.freq) name.freq = 1;

            return name;
        });

        texts = _.orderBy(texts, [ 'priority', 'tokenized', 'display_length' ], [ 'desc', 'asc', 'desc' ]);
        texts = _.sortedUniqBy(texts, 'tokenized');
        texts = _.orderBy(texts, [ 'priority', 'freq', 'display_length' ], [ 'desc', 'desc', 'desc' ]);

        return texts.map((name) => {
            name.display = titleCase(name.display.trim(), titleCaseConfig);
            return name;
        }).reduce((acc, name) => {
            if (!acc) return name.display;
            return `${acc},${name.display}`;
        }, '');
    };
};

/**
 * Title case a given string except for minors
 * @param {string} text Text to be titlecased
 * @param {Array} config Object containing @mapbox/title-case configuration
 */
function titleCase(text, config) {
    config.minors = config.minors || [];
    config.pre = config.pre || [];
    config.post = config.post || [];
    let separators = [];
    for (let separator = wordBoundary.exec(text); !!separator; separator = wordBoundary.exec(text)) {
        // preserve the characters separating words, collapsing runs of whitespace but preserving other stuff
        let sep = '';
        for (let sep_i = 0; sep_i < separator[0].length; sep_i++) {
            let lastCharIsSpace = (sep_i > 0) && (sep[sep.length - 1] === ' ');
            if (!(/\s/.test(separator[0][sep_i]))) {
                // don't add separators at the beginning of words (after spaces)
                if (!lastCharIsSpace || allowedAfterSpace.test(separator[0][sep_i]))
                    sep += separator[0][sep_i];
            } else if (!lastCharIsSpace) {
                sep += ' ';
            }
        }
        separators.push(sep);
    }
    text = config.pre.reduce((prev, cur) => { return cur(prev); }, text);

    text = text
        .split(wordBoundary)
        .map((y) => { return y.toLowerCase(); })
        .reduce((prev, cur, i) => {
            if (i > 0)
                prev.push(separators[i-1]);
            if (cur.length > 0) {
                if (config.minors.indexOf(cur) !== -1)
                    prev.push(cur);
                else
                    prev.push(cur[0].toUpperCase() + cur.slice(1));
            }
            return prev;
        }, [])
        .join('');

    return config.post.reduce((prev, cur) => { return cur(prev); }, text);
}

module.exports.titleCase = titleCase;
