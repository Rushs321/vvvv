const sharp = require('sharp');
const redirect = require('./redirect');

function compress(req, res, stream) {
  const format = req.query.webp ? 'webp' : 'jpeg';

  stream
    .pipe(
      sharp()
        .grayscale(req.query.grayscale)
        .toFormat(format, {
          quality: parseInt(req.query.quality, 10) || 80,
          progressive: true,
          optimizeScans: true,
        })
        .on('info', info => {
          res.setHeader('content-type', `image/${format}`);
          res.setHeader('content-length', info.size);
          res.setHeader('x-original-size', req.params.originSize);
          res.setHeader('x-bytes-saved', req.params.originSize - info.size);
        })
        .on('error', err => {
          console.error('Compression error:', err);
          redirect(req, res);
        })
        .pipe(res)
    );
}

module.exports = compress;
