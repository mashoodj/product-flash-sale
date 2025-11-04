import { Request, Response } from "express";
import * as ReservationService from "../services/reservationService";

export async function createReservation(req: Request, res: Response) {
    try {
        const { userId, items } = req.body;
        if (!userId || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Invalid input" });
        }
        const reservationId = await ReservationService.createReservation(userId, items);
        res.json({ reservationId });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}

export async function cancelReservation(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        await ReservationService.cancelReservation(id, userId);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}
