/**
 * Exposes a map function to convert/filter address numbers to integers
 * And remove generally invalid coords
 *
 * @param {Object} feat     GeoJSON feature to convert/filter
 * @return {Object|false}   Converted GeoJSON feature or false if it cannot be converted.
 */
function map(feat, context) {
    //Skip points & Polygons
    if (feat.geometry.type !== 'Point') return new Error('Feat must be a Point geom');
    if (!feat.properties) return new Error('Feat must have properties object');

    if (!feat.properties.number) return new Error('Feat must have number property');
    if (typeof feat.properties.number === 'string') {
        if (!feat.properties.number.trim().length) return new Error('Feat must have non-empty number property');
    } else if (typeof feat.properties.number === 'number') {
        feat.properties.number = String(feat.properties.number);
    } else {
        return new Error('Feat must have a string or numeric number property');
    }

    feat.properties.number = feat.properties.number.toLowerCase();

    //Transform addresses that are almost supported to a supported type
    feat.properties.number = feat.properties.number.replace(/\s1\/2$/, '');

    //123 B => 123B
    if (/^\d+\s[a-z]$/.test(feat.properties.number)) feat.properties.number = feat.properties.number.replace(/\s/g, '');

    //Don't add new address formats here without adding them to carmen first. Addresses need to be converted to one of these formats or dropped
    if (!/^\d+[a-z]?$/.test(feat.properties.number) && !/^(\d+)-(\d+)[a-z]?$/.test(feat.properties.number) && !/^(\d+)([nsew])(\d+)[a-z]?$/.test(feat.properties.number)) return new Error('Feat number is not a supported address/unit type');

    if (feat.properties.number.length > 10) return new Error('Number should not exceed 10 chars');

    if (!feat.properties.street) return new Error('Feat must have street property');
    if (typeof feat.properties.street === 'string') {
        if (!feat.properties.street.trim().length) return new Error('Feat must have non-empty street property');

        feat.properties.street = [{
            display: feat.properties.street,
            priority: 0
        }];

    } else if (Array.isArray(feat.properties.street)) {
        if (!feat.properties.street.length) return new Error('Feat must have non-empty street property');
        if (!feat.properties.street.some(syn => Object.keys(syn).includes('display')) || !feat.properties.street.some(syn => Object.keys(syn).includes('priority')) || !feat.properties.street.some(syn => Object.keys(syn).length === 2)) return new Error('Synonym objects in street array must contain only display and priority properties');

        for (let i = 0; i < feat.properties.street.length; i++) {
            if (typeof feat.properties.street[i].display !== 'string' || isNaN(Number(feat.properties.street[i].priority))) return new Error('Display property must be a string and priority property must be a number');
        }
    } else return new Error('Feat must have a string or array street property');

    if (!feat.geometry.coordinates || !Array.isArray(feat.geometry.coordinates) || feat.geometry.coordinates.length !== 2) return new Error('Feat must have 2 element coordinates array');

    if (isNaN(Number(feat.geometry.coordinates[0])) || feat.geometry.coordinates[0] < -180 || feat.geometry.coordinates[0] > 180) return new Error('Feat exceeds +/-180deg coord bounds');
    if (isNaN(Number(feat.geometry.coordinates[1])) || feat.geometry.coordinates[1] < -85 || feat.geometry.coordinates[1] > 85) return new Error('Feat exceeds +/-85deg coord bounds');

    return feat;
}

module.exports.map = map;
