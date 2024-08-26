const fetch = require('node-fetch');
const pick = require('lodash').pick;
const shouldCompress = require('./shouldCompress');
const redirect = require('./redirect');
const compress = require('./compress');
const bypass = require('./bypass');
const copyHeaders = require('./copyHeaders');

function proxy(req, res) {
    fetch(
        req.params.url,
        {
            headers: {
                ...pick(req.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': 'Bandwidth-Hero Compressor',
                'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip,
                via: '1.1 bandwidth-hero'
            },
        })
        .then(origin => {
            if (!origin.ok) {
                return redirect(req, res);
            }
            req.params.originType = origin.headers.get('content-type') || '';
            origin.buffer().then(buffer => {
                req.params.originSize = buffer.length;
                copyHeaders(origin, res);
                res.setHeader('content-encoding', 'identity');
                if (shouldCompress(req)) {
                    compress(req, res, buffer)
                } else {
                    bypass(req, res, buffer)
                }
            })
        })
        .catch(e => console.log(e));
}



module.exports = proxy;
