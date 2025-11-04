import { Request, Response } from "express";
import * as ProductService from "../services/productService";

export async function createProduct(req: Request, res: Response) {
    try {
        const { sku, name, total_stock } = req.body;
        if (!sku || !name || typeof total_stock !== "number") {
            return res.status(400).json({ error: "Invalid input" });
        }

        const product = await ProductService.createProduct({ sku, name, total_stock });
        res.status(201).json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

export async function getStatus(req: Request, res: Response) {
    try {
        const { sku } = req.params;
        const status = await ProductService.getStatus(sku);
        if (!status) return res.status(404).json({ error: "Product not found" });
        res.json(status);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}
