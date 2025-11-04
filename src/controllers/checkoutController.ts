import { Request, Response } from "express";
import * as CheckoutService from "../services/checkoutService";

export async function checkout(req: Request, res: Response) {
    try {
        const { reservationId, userId } = req.body;
        if (!reservationId || !userId) return res.status(400).json({ error: "Missing fields" });

        const order = await CheckoutService.checkout(reservationId, userId);
        res.json(order);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}
