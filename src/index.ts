import express from "express";
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import { CONFIG } from "./config";
import * as ProductController from "./controllers/productController";
import * as ReservationController from "./controllers/reservationController";
import * as CheckoutController from "./controllers/checkoutController";
import { setupSwagger } from "./swagger";

const app = express();
app.use(bodyParser.json());

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 60,
    })
);

// routes
app.post("/products", ProductController.createProduct);
app.get("/products/:sku/status", ProductController.getStatus);
app.post("/reservations", ReservationController.createReservation);
app.post("/reservations/:id/cancel", ReservationController.cancelReservation);
app.post("/checkout", CheckoutController.checkout);

setupSwagger(app);

app.listen(CONFIG.PORT, () => {
    console.log(`Server running on port ${CONFIG.PORT}`);
});
