const fetch = require('node-fetch');
const pick = require('lodash').pick;
const shouldCompress = require('./shouldCompress');
const redirect = require('./redirect');
const compress = require('./compress');
const copyHeaders = require('./copyHeaders');

async function proxy(req, res) {
  try {
    const url = req.query.url;
    const headers = {
      ...pick(req.headers, ["cookie", "dnt", "referer"]),
      "user-agent": "Bandwidth-Hero Compressor",
      "x-forwarded-for": req.headers["x-forwarded-for"] || req.ip,
      via: "1.1 bandwidth-hero",
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
      timeout: 10000,
    });

    if (!response.ok) {
      // Handle HTTP errors (status code >= 400)
      redirect(req, res);
      return;
    }

    // Copy headers from the response to our own response
    copyHeaders(response, res);

    res.setHeader("content-encoding", "identity");
    req.params.originType = response.headers.get("content-type") || "";
    req.params.originSize = response.headers.get("content-length") || "0";

    if (shouldCompress(req)) {
      // Compress the stream with Sharp
      return compress(req, res, response.body);
    } else {
      // Pipe the response body directly to the client
      res.setHeader("x-proxy-bypass", 1);
      res.setHeader("content-length", response.headers.get("content-length") || "0");
      response.body.pipe(res);
    }
  } catch (error) {
    // Handle network errors
    redirect(req, res);
  }
}

module.exports = proxy;
