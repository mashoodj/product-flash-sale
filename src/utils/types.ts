export interface Product {
    id: string;
    sku: string;
    name: string;
    total_stock: number;
}

export interface ReservationItem {
    sku: string;
    qty: number;
}

export interface ReservationPayload {
    reservationId: string;
    userId: string;
    items: ReservationItem[];
    createdAt: number;
    expiry: number;
}

export interface Order {
    orderId: string;
    createdAt: string;
}
