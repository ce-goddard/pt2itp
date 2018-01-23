const posts = [ //Mandatory Steps
    require('./post/id').post,
    require('./post/text').post,
    require('./post/dedupe-address').post,
    require('./post/sort').post,
    require('./post/centre').post
];

class Post {
    constructor(opts = {}) {
        this.opts = opts || {};
        this.opts.post = this.opts && this.opts.post || [];

        if (!this.opts.label && !this.opts.tokens) {
            console.error('WARN: map.orphanAddr() using titlecase behavior on non-English data; English capitalization rules will be applied, potentially in error');
        }

        this.opts.label = require('./label/' + (opts.label || 'titlecase'))()

        for (let p of this.opts.post) {
            posts.push(require(`./post/${p}`).post);
        }
    }

    feat(f) {
        for (let post of posts) {
            f = post(f, this.opts);
        }

        return f;
    }
}

module.exports = Post;
