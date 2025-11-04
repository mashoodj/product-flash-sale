import db from "../utils/db";
import redis from "../utils/redisClient";
import {DB} from "../constants";

interface CreateProductInput {
    sku: string;
    name: string;
    total_stock: number;
}

export async function createProduct({ sku, name, total_stock }: CreateProductInput) {
    const client = await db.connect();
    try {
        await client.query(DB.BEGIN);
        const insert = await client.query(
            "INSERT INTO products (sku, name, total_stock) VALUES ($1, $2, $3) RETURNING *",
            [sku, name, total_stock]
        );
        await client.query(DB.COMMIT);

        // cache total and reserved counts in Redis
        await redis.set(`product:${sku}:total`, String(total_stock));
        await redis.set(`product:${sku}:reserved`, "0");

        return insert.rows[0];
    } catch (err) {
        await client.query(DB.ROLLBACK);
        throw err;
    } finally {
        client.release();
    }
}

export async function getStatus(sku: string) {
    const p = await db.query("SELECT total_stock FROM products WHERE sku=$1", [sku]);
    if (p.rowCount === 0) return null;
    const total = p.rows[0].total_stock;
    const reserved = parseInt((await redis.get(`product:${sku}:reserved`)) || "0", 10);
    return { sku, total_stock: total, reserved, available: total - reserved };
}
