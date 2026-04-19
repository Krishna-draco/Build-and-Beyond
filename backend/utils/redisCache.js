const {
  REDIS_DEFAULT_TTL_SECONDS,
  REDIS_CACHE_LOG_EVERY_N,
} = require("../config/constants");
const { getRedisClient } = require("./redisClient");

const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  invalidateCalls: 0,
  invalidatedKeys: 0,
  skippedNoRedis: 0,
  errors: 0,
};

const totalOps = () =>
  cacheStats.hits +
  cacheStats.misses +
  cacheStats.sets +
  cacheStats.invalidateCalls;

const maybeLogStats = (source) => {
  const everyN = Number(REDIS_CACHE_LOG_EVERY_N || 0);
  const currentOps = totalOps();
  if (!everyN || everyN <= 0 || currentOps === 0 || currentOps % everyN !== 0)
    return;

  const ratio =
    cacheStats.hits + cacheStats.misses > 0
      ? (
          (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) *
          100
        ).toFixed(2)
      : "0.00";

  console.log(
    `[redis-cache] source=${source} ops=${currentOps} hitRate=${ratio}% hits=${cacheStats.hits} misses=${cacheStats.misses} sets=${cacheStats.sets} invalidateCalls=${cacheStats.invalidateCalls} invalidatedKeys=${cacheStats.invalidatedKeys} skippedNoRedis=${cacheStats.skippedNoRedis} errors=${cacheStats.errors}`,
  );
};

const sortObjectKeys = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
};

const buildCacheKey = (prefix, params = {}) => {
  const normalized = JSON.stringify(sortObjectKeys(params));
  return `${prefix}:${normalized}`;
};

const getCacheLinkFromKey = (key) => {
  if (typeof key !== "string") return key;

  const jsonStart = key.indexOf("{");
  if (jsonStart === -1) return key;

  try {
    const parsed = JSON.parse(key.slice(jsonStart));
    if (parsed && typeof parsed.path === "string") {
      return parsed.path;
    }
  } catch (error) {
    return key;
  }

  return key;
};

const formatElapsedMs = (startedAt) =>
  Number(process.hrtime.bigint() - startedAt) / 1e6;

const getCacheJson = async (key) => {
  const redis = getRedisClient();
  if (!redis) {
    cacheStats.skippedNoRedis += 1;
    maybeLogStats("get-no-redis");
    return null;
  }

  try {
    const startedAt = process.hrtime.bigint();
    const value = await redis.get(key);
    const elapsedMs = formatElapsedMs(startedAt).toFixed(2);
    const cacheLink = getCacheLinkFromKey(key);

    if (!value) {
      cacheStats.misses += 1;
      console.log(`(miss) ${cacheLink} : ${elapsedMs}ms`);
      maybeLogStats("get-miss");
      return null;
    }
    cacheStats.hits += 1;
    console.log(`(hit) ${cacheLink} : ${elapsedMs}ms`);
    maybeLogStats("get-hit");
    return JSON.parse(value);
  } catch (error) {
    cacheStats.errors += 1;
    console.error(`Redis get failed for ${key}:`, error.message);
    maybeLogStats("get-error");
    return null;
  }
};

const setCacheJson = async (
  key,
  payload,
  ttlSeconds = Number(REDIS_DEFAULT_TTL_SECONDS || 120),
) => {
  const redis = getRedisClient();
  if (!redis) {
    cacheStats.skippedNoRedis += 1;
    maybeLogStats("set-no-redis");
    return;
  }

  try {
    await redis.set(key, JSON.stringify(payload), { EX: Number(ttlSeconds) });
    cacheStats.sets += 1;
    maybeLogStats("set");
  } catch (error) {
    cacheStats.errors += 1;
    console.error(`Redis set failed for ${key}:`, error.message);
    maybeLogStats("set-error");
  }
};

const invalidateCacheByPrefix = async (prefix) => {
  const redis = getRedisClient();
  if (!redis || !prefix) {
    cacheStats.skippedNoRedis += 1;
    maybeLogStats("invalidate-no-redis");
    return 0;
  }

  const pattern = `${prefix}*`;
  let deletedCount = 0;
  cacheStats.invalidateCalls += 1;

  try {
    if (typeof redis.scanIterator === "function") {
      const batch = [];
      for await (const key of redis.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        batch.push(key);
        if (batch.length >= 100) {
          await Promise.all(batch.map((item) => redis.del(item)));
          deletedCount += batch.length;
          batch.length = 0;
        }
      }

      if (batch.length) {
        await Promise.all(batch.map((item) => redis.del(item)));
        deletedCount += batch.length;
      }

      cacheStats.invalidatedKeys += deletedCount;
      maybeLogStats("invalidate");
      return deletedCount;
    }

    let cursor = "0";
    do {
      const reply = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = Array.isArray(reply) ? reply[0] : reply.cursor;
      const keys = Array.isArray(reply) ? reply[1] : reply.keys;

      if (Array.isArray(keys) && keys.length) {
        await Promise.all(keys.map((item) => redis.del(item)));
        deletedCount += keys.length;
      }
    } while (cursor !== "0");

    cacheStats.invalidatedKeys += deletedCount;
    maybeLogStats("invalidate");
    return deletedCount;
  } catch (error) {
    cacheStats.errors += 1;
    console.error(`Redis invalidate failed for ${prefix}:`, error.message);
    maybeLogStats("invalidate-error");
    return 0;
  }
};

const getRedisCacheStats = () => ({ ...cacheStats, totalOps: totalOps() });

const resetRedisCacheStats = () => {
  Object.keys(cacheStats).forEach((key) => {
    cacheStats[key] = 0;
  });
};

module.exports = {
  buildCacheKey,
  getCacheJson,
  setCacheJson,
  invalidateCacheByPrefix,
  getRedisCacheStats,
  resetRedisCacheStats,
};
