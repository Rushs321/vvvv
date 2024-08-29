const fetch = require('node-fetch');
const pick = require('lodash').pick;
const shouldCompress = require('./shouldCompress');
const redirect = require('./redirect');
const compress = require('./compress');
const copyHeaders = require('./copyHeaders');

async function proxy(req, res) {
  try {
    const url = req.query.url;
    console.log('Requested URL:', url);

    const headers = {
      ...pick(req.headers, ["cookie", "dnt", "referer"]),
      "user-agent": "Bandwidth-Hero Compressor",
      "x-forwarded-for": req.headers["x-forwarded-for"] || req.ip,
      via: "1.1 bandwidth-hero",
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
      timeout: 10000,  // Note: node-fetch does not support timeout directly
    });

    if (!response.ok) {
      console.error('Fetch failed with status:', response.status);
      redirect(req, res);
      return;
    }

    copyHeaders(response, res);

    req.params.originType = response.headers.get("content-type") || "";
    req.params.originSize = response.headers.get("content-length") || "0";
    console.log('Content-Type:', req.params.originType);
    console.log('Content-Length:', req.params.originSize);

    if (shouldCompress(req)) {
      console.log('Compressing image...');
      return compress(req, res, response.body);
    } else {
      console.log('Bypassing compression...');
      res.setHeader("x-proxy-bypass", 1);
      res.setHeader("content-length", response.headers.get("content-length") || "0");
      response.body.pipe(res);
    }
  } catch (error) {
    console.error('Error during proxying:', error);
    redirect(req, res);
  }
}


module.exports = proxy;
