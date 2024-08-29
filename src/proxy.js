const fetch = require('node-fetch');
const { pick } = require('lodash');
const shouldCompress = require('./shouldCompress');
const redirect = require('./redirect');
const compress = require('./compress');
const bypass = require('./bypass');
const copyHeaders = require('./copyHeaders');

function proxy(req, res) {
  fetch(req.params.url, {
    headers: {
      ...pick(req.headers, ['cookie', 'dnt', 'referer']),
      'user-agent': 'Bandwidth-Hero Compressor',
      'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip,
      via: '1.1 bandwidth-hero'
    },
    compress: true,
    redirect: 'follow',
  })
    .then(response => {
      if (!response.ok) {
        return redirect(req, res);
      }

      req.params.originType = response.headers.get('content-type') || '';
      req.params.originSize = response.headers.get('content-length') || '0';

      copyHeaders(response, res);
      res.setHeader('content-encoding', 'identity');

      if (shouldCompress(req)) {
        return compress(req, res, response.body);
      } else {
        res.setHeader('x-proxy-bypass', 1);
        res.setHeader('content-length', req.params.originSize);
        return response.body.pipe(res);
      }
    })
    .catch(() => redirect(req, res));
}

module.exports = proxy;
