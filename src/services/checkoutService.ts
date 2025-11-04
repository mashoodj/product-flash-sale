import redis from "../utils/redisClient";
import db from "../utils/db";
import { ReservationItem, Order } from "../utils/types";
import {DB, ERROR_MSG} from "../constants";

export async function checkout(reservationId: string, userId: string): Promise<Order> {
    const key = `reservation:${reservationId}`;
    const exists = await redis.exists(key);
    if (!exists) throw new Error(ERROR_MSG.RESERVATION_EXPIRED_NOT_FOUND);

    const owner = await redis.hget(key, "userId");
    if (owner !== userId) throw new Error(ERROR_MSG.NOT_AUTHORIZED);

    const itemsJson = await redis.hget(key, "items");
    const items: ReservationItem[] = JSON.parse(itemsJson || "[]");

    const client = await db.connect();
    try {
        await client.query(DB.BEGIN);

        for (const it of items) {
            const result = await client.query(
                "SELECT id, total_stock FROM products WHERE sku=$1 FOR UPDATE",
                [it.sku]
            );
            if (result.rowCount === 0) throw new Error(ERROR_MSG.PRODUCT_NOT_FOUND +`: ${it.sku}`);
            const product = result.rows[0];
            if (product.total_stock < it.qty) throw new Error(ERROR_MSG.INSUFFICIENT_STOCK_FOR +` ${it.sku}`);
            await client.query(
                "UPDATE products SET total_stock=$1, updated_at=now() WHERE id=$2",
                [product.total_stock - it.qty, product.id]
            );
        }

        const orderRes = await client.query(
            "INSERT INTO orders (user_id) VALUES ($1) RETURNING id, created_at",
            [userId]
        );
        const orderId = orderRes.rows[0].id;

        for (const it of items) {
            await client.query(
                "INSERT INTO order_items (order_id, sku, qty, unit_price) VALUES ($1, $2, $3, $4)",
                [orderId, it.sku, it.qty, 0]
            );
        }

        await client.query(DB.COMMIT);

        const pipeline = redis.pipeline();
        for (const it of items) pipeline.decrby(`product:${it.sku}:reserved`, it.qty);
        pipeline.del(key);
        pipeline.zrem("reservations:expiries", reservationId);
        await pipeline.exec();

        return { orderId, createdAt: orderRes.rows[0].created_at };
    } catch (err) {
        await client.query(DB.ROLLBACK);
        throw err;
    } finally {
        client.release();
    }
}
