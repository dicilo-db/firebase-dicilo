type RateLimitRecord = {
    count: number;
    resetTime: number;
};

// In-memory cache for rate limiting (Note: clears on server restart and doesn't span across multi-instance edge clusters cleanly, but perfectly serves basic brute-force protection without Redis overhead)
const rateLimits = new Map<string, RateLimitRecord>();

/**
 * Validates if the given action key (e.g. IP + Action Name) exceeds the limit.
 * @param key Unique identifier for the rate limit (e.g., `req.ip_login`)
 * @param limit Maximum number of requests allowed within the window
 * @param windowMs Time window in milliseconds (e.g. 60000 for 1 minute)
 * @returns boolean `true` if allowed, `false` if ratelimited
 */
export function checkRateLimit(key: string, limit: number = 20, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = rateLimits.get(key);

    if (!record) {
        rateLimits.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (now > record.resetTime) {
        // Window expired, reset
        rateLimits.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        // Rate limited
        return false;
    }

    // Increment
    record.count += 1;
    rateLimits.set(key, record);
    return true;
}
