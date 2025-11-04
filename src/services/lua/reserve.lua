-- ARGV[1] = JSON stringified payload {reservationId, userId, items, createdAt, expiry}
-- ARGV[2] = TTL seconds

local cjson = cjson
local payload = cjson.decode(ARGV[1])
local ttl = tonumber(ARGV[2])

local items = payload.items
-- Validate each item availability using cached total and reserved
for i=1,#items do
  local sku = items[i].sku
  local qty = tonumber(items[i].qty)
  local total_key = "product:" .. sku .. ":total"
  local reserved_key = "product:" .. sku .. ":reserved"
  local total = tonumber(redis.call("GET", total_key) or "0")
  local reserved = tonumber(redis.call("GET", reserved_key) or "0")
  if qty <= 0 then
    return cjson.encode({ success=false, message="invalid qty for " .. sku })
  end
  if reserved + qty > total then
    return cjson.encode({ success=false, message="insufficient stock for " .. sku })
  end
end

-- All good: increment reserved for each
for i=1,#items do
  local sku = items[i].sku
  local qty = tonumber(items[i].qty)
  local reserved_key = "product:" .. sku .. ":reserved"
  redis.call("INCRBY", reserved_key, qty)
end

-- Create reservation hash
local reservation_key = "reservation:" .. payload.reservationId
redis.call("HMSET", reservation_key,
  "userId", payload.userId,
  "items", cjson.encode(payload.items),
  "createdAt", tostring(payload.createdAt),
  "expiry", tostring(payload.expiry)
)
redis.call("EXPIRE", reservation_key, ttl)

-- Add to expiry sorted set
redis.call("ZADD", "reservations:expiries", payload.expiry, payload.reservationId)

return cjson.encode({ success=true, reservationId=payload.reservationId })
