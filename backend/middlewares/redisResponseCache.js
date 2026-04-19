const {
  buildCacheKey,
  getCacheJson,
  setCacheJson,
} = require("../utils/redisCache");

const redisResponseCache = (prefix, ttlSeconds = 180) => {
  return async (req, res, next) => {
    try {
      const identity =
        req.user?.user_id ||
        req.user?.id ||
        req.admin?.id ||
        req.admin?.email ||
        "anonymous";
      const role = req.user?.role || req.admin?.role || "unknown";
      const cacheKey = buildCacheKey(prefix, {
        path: req.originalUrl,
        role,
        identity,
      });

      const cachedPayload = await getCacheJson(cacheKey);
      if (cachedPayload) {
        return res
          .status(cachedPayload.statusCode || 200)
          .json(cachedPayload.body);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        const statusCode = res.statusCode || 200;
        if (statusCode >= 200 && statusCode < 300) {
          setCacheJson(cacheKey, { statusCode, body }, ttlSeconds).catch(
            (error) => {
              console.error("Redis response cache set error:", error.message);
            },
          );
        }

        return originalJson(body);
      };

      return next();
    } catch (error) {
      console.error("Redis response cache middleware error:", error.message);
      return next();
    }
  };
};

module.exports = redisResponseCache;
