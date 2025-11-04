## Description.

Nodejs TypeScript starter repository.

## Installation.

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start
```

## Running the expiry worker process

```bash
# start the expiry worker process
$ npm run worker
```

## Test

```bash
# unit tests
$ npm run test
```

## Stack
- Node.js + Express
- Redis + Lua
- Postgres

## Reservation Logic
### Work
- Use Redis as the reservation store + counters for performance and concurrency control.
- Make reservation atomic with a Redis Lua script that validates availability across all SKUs in the request. Increments product reserved counters atomically and creates a reservation object key by reservation id with TTL and pushes that id into a Redis sorted set keyed as reservations.
### Logic
- For each SKU:
- - Read product:{sku}:reserved 0 if absent
- - Cache total in Redis on product creation: set product:{sku}:total = <n> and keep it in sync during create/checkouts.
- - Check reserved + qty <= total_stock

- If all OK:
- - Increment product:{sku}:reserved by qty.
- - Create reservation:{id} with hash fields and set TTL

- - Add reservationId to sorted set reservations:expiries with score expiry unix ms

- If failed: 
- - do nothing and return failure.

## Expiration
A background worker runs every 5 seconds
- Query ZREVRANGEBYSCORE reservations:expiries for scores <= now


- For each expired reservationId 
- - Fetch reservation:{id} hash -> items
- - For each item, DECRBY product:{sku}:reserved qty.
- - Delete reservation:{id} and remove from sorted set. This ensures reserved counters are released when TTL expiry is reached.

## Endpoints
   ```json
POST /products — body: { sku, name, total_stock }
POST http://localhost:3000/products
Body (JSON):
{ "sku": "SKU-A", "name": "mobile-a30s", "total_stock": 2 }

GET /products/:sku/status
GET http://localhost:3000/SKU-A/status

POST /reservations — body: { userId, items: [{ sku, qty }, ...] } returns { reservationId }
POST http://localhost:3000/reservations
Body (JSON):
{
"userId": "user_123",
"items": [
{ "sku": "SKU-A", "qty": 2 },
{ "sku": "SKU-B", "qty": 1 }
]
}

POST /reservations/:id/cancel — body: { userId }
GET http://localhost:3000/reservations/1/cancel
Body (JSON):
{ "userId": "user_123" }


POST /checkout — body: { reservationId, userId } returns Order
POST http://localhost:3000/checkout
Body (JSON):
{
"reservationId": "reservationId_123",
"userId": "user_123"
}



