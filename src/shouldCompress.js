"use strict";

const MIN_COMPRESS_LENGTH = 1024;
const MIN_TRANSPARENT_COMPRESS_LENGTH = MIN_COMPRESS_LENGTH * 100;

function shouldCompress(req) {
  const { originType, originSize, webp } = req.params;

  // Convert originSize to a number and default to 0 if invalid
  const size = parseInt(originSize, 10) || 0;

  if (!originType || !originSize) return false; // Ensure originType and originSize are defined

  if (!originType.startsWith('image')) return false;
  if (size === 0) return false;
  if (req.headers.range) return false;
  if (webp && size < MIN_COMPRESS_LENGTH) return false;
  if (
    !webp &&
    (originType.endsWith('png') || originType.endsWith('gif')) &&
    size < MIN_TRANSPARENT_COMPRESS_LENGTH
  ) {
    return false;
  }

  return true;
}

module.exports = shouldCompress;
