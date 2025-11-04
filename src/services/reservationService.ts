import redis from "../utils/redisClient";
import { v4 as uuidv4 } from "uuid";
import { ReservationItem, ReservationPayload } from "../utils/types";
import { CONFIG } from "../config";
import fs from "fs";
import path from "path";
import {ERROR_MSG} from "../constants";

let reserveScriptSha: string | any | null = null;
const luaScript = fs.readFileSync(path.join(__dirname, "lua", "reserve.lua"), "utf8");

async function loadScript() {
    reserveScriptSha = await redis.script("LOAD", luaScript);
}
loadScript().catch(console.error);

export async function createReservation(userId: string, items: ReservationItem[]): Promise<string> {
    const reservationId = uuidv4();
    const now = Date.now();
    const expiry = now + CONFIG.RESERVATION_TTL * 1000;

    const payload: ReservationPayload = {
        reservationId,
        userId,
        items,
        createdAt: now,
        expiry,
    };

    if (!reserveScriptSha) {
        reserveScriptSha = await redis.script("LOAD", luaScript);
    }

    const result = await redis.evalsha(
        reserveScriptSha,
        0,
        JSON.stringify(payload),
        CONFIG.RESERVATION_TTL
    );

    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    if (!parsed.success) throw new Error(parsed.message);
    return parsed.reservationId;
}

export async function cancelReservation(reservationId: string, userId: string) {
    const key = `reservation:${reservationId}`;
    const exists = await redis.exists(key);
    if (!exists) throw new Error(ERROR_MSG.RESERVATION_EXPIRED_NOT_FOUND);

    const owner = await redis.hget(key, "userId");
    if (owner !== userId) throw new Error(ERROR_MSG.NOT_AUTHORIZED);

    const itemsJson = await redis.hget(key, "items");
    const items: ReservationItem[] = JSON.parse(itemsJson || "[]");

    const pipeline = redis.pipeline();
    for (const it of items) {
        pipeline.decrby(`product:${it.sku}:reserved`, it.qty);
    }
    pipeline.del(key);
    pipeline.zrem("reservations:expiries", reservationId);
    await pipeline.exec();
}
