const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 600 });

/**
 * Cache GET requests for improved performance
 * Caches responses for 10 minutes by default
 */
const cacheMiddleware = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== "GET") {
    return next();
  }

  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    res.json(cachedResponse);
    return;
  }

  // Store original send
  const originalSend = res.json;

  res.json = function(data) {
    cache.set(key, data);
    return originalSend.call(this, data);
  };

  next();
};

module.exports = { cacheMiddleware, cache };
