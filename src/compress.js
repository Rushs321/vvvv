const sharp = require('sharp');
const redirect = require('./redirect');

function compress(req, res, stream) {
  const format = req.params.webp ? 'webp' : 'jpeg';

  stream
    .pipe(
      sharp()
        .grayscale(req.params.grayscale)
        .toFormat(format, {
          quality: req.params.quality,
          progressive: true,
          optimizeScans: true
        })
        .on('info', info => {
          res.setHeader('content-type', `image/${format}`);
          res.setHeader('content-length', info.size);
          res.setHeader('x-original-size', req.params.originSize);
          res.setHeader('x-bytes-saved', req.params.originSize - info.size);
        })
        .on('error', () => redirect(req, res))
        .pipe(res)
    );
}

module.exports = compress;
