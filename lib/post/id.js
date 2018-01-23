/**
 * Exposes a post function to add a numeric id value
 * @param {Object} feat     GeoJSON Feature to add an id to
 * @return {Object}         Output GeoJSON feature to write to output
 */
function post(feat) {
    if (!feat) return feat;

    // Use all 53 bits we have available when setting ID
    // This lowers, but does not remove, the chance of a collision
    feat.id = Math.floor((Math.random() * Number.MAX_SAFE_INTEGER) + 1);

    return feat;
}

module.exports.post = post;
