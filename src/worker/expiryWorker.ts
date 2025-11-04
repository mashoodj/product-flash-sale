import redis from "../utils/redisClient";
import { ReservationItem } from "../utils/types";

async function processExpired() {
    const now = Date.now();
    const expired = await redis.zrangebyscore("reservations:expiries", 0, now);
    if (expired.length === 0) return;

    for (const rid of expired) {
        const key = `reservation:${rid}`;
        const itemsJson = await redis.hget(key, "items");
        if (itemsJson) {
            const items: ReservationItem[] = JSON.parse(itemsJson);
            const pipeline = redis.pipeline();
            for (const it of items) pipeline.decrby(`product:${it.sku}:reserved`, it.qty);
            pipeline.del(key);
            pipeline.zrem("reservations:expiries", rid);
            await pipeline.exec();
            console.log("Released expired reservation:", rid);
        } else {
            await redis.zrem("reservations:expiries", rid);
        }
    }
}

setInterval(() => {
    processExpired().catch((err) => console.error("Expiry worker error:", err));
}, 5000);
