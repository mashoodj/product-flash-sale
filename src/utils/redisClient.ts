import Redis from "ioredis";
import { CONFIG } from "../config";

const redis = new Redis(CONFIG.REDIS_URL);

redis.on("connect", () => console.log("Connected to Redis"));
redis.on("error", (err) => console.error("Redis error:", err));

export default redis;
