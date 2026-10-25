import React from "react";
import { MerchantLayout } from "../../components/MerchantLayout";
import toast from "react-hot-toast";
import { OrderTable, type OrderItem } from "../../components/merchant/orders/OrderTable";
import { OrderDetailModal } from "../../components/merchant/orders/OrderDetailModal";
import { useEffect, useState } from "react";
import { api } from "../../config/api";

export const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [trackingInput, setTrackingInput] = useState("");

    useEffect(() => {
        fetchOrders();
    }, [filterStatus]);

    const fetchOrders = async () => {
        setLoading(true);

        try {
            const url = filterStatus !== "all" ? `/api/orders/merchant?status=${encodeURIComponent(filterStatus)}` : "/api/orders/merchant";
            const res = await api.get(url);
            if (res.data?.success) setOrders(res.data.orders);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrder = async (orderId: number, status: string, tracking?: string, payment?: string) => {
        setUpdatingStatus(true);
        try {
            const res = await api.patch(
                `/api/orders/merchant/${orderId}/status`, {
                order_status: status,
                ...(tracking !== undefined && { tracking_number: tracking }),
                ...(payment !== undefined && { payment_status: payment }),
            }
            );
            if (res.data?.success) {
                toast.success("Order status updated!");
                setOrders((prev) => prev.map((o) => o.id === orderId ? res.data.order : o));
                if (selectedOrder?.id === orderId) setSelectedOrder(res.data.order);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update order");
        } finally {
            setUpdatingStatus(false);
        }
    };

    return (
        <MerchantLayout>
            <div className="space-y-7 font-sans">
                <h1 className="text-xl sm:text-2xl text-neutral-900 mt-10">Orders & Fulfillment</h1>
                <OrderTable
                    orders={orders}
                    loading={loading}
                    filterStatus={filterStatus}
                    onFilterChange={setFilterStatus}
                    onUpdateOrderStatus={(id, status) => handleUpdateOrder(id, status)}
                    onOpenDetails={(o) => {
                        setSelectedOrder(o);
                        setTrackingInput(o.tracking_number || "");
                    }}
                />
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    trackingInput={trackingInput}
                    onTrackingInputChange={setTrackingInput}
                    onUpdateOrder={handleUpdateOrder}
                    updatingStatus={updatingStatus}
                />
            </div>
        </MerchantLayout>
    );
};
