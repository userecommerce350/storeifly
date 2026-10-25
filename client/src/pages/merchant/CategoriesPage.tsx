import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { MerchantLayout } from "../../components/MerchantLayout";
import { Plus, Trash2, FolderTree } from "lucide-react";
import { Spinner } from "../../components/common/Spinner";
import toast from "react-hot-toast";
import { api } from "../../config/api";

interface Category {
    id: number;
    name: string;
    slug?: string;
    product_count?: number;
}

export const CategoriesPage: React.FC = () => {
    const { store } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        if (store) {
            void fetchCategories();
        } else {
            setLoading(false);
        }
    }, [store]);

    const fetchCategories = async () => {
        setLoading(true);

        try {
            const storeRes = await api.get("/api/stores/me");

            if (!storeRes.data?.success || !storeRes.data?.store?.id) {
                setCategories([]);
                return;
            }

            const storeId = storeRes.data.store.id;

            const res = await api.get(
                `/api/categories?storeId=${encodeURIComponent(storeId)}`
            );

            if (res.data?.success) {
                setCategories(res.data.categories ?? []);
            } else {
                toast.error(res.data?.message || "Failed to load categories");
            }
        } catch (err: any) {
            console.error("Failed to fetch categories:", err);
            toast.error(
                err.response?.data?.message || "Failed to load categories"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedName = name.trim();
        if (!trimmedName) return;

        setSubmitting(true);

        try {
            const res = await api.post("/api/categories", {
                name: trimmedName,
            });

            if (res.data?.success) {
                toast.success("Category created!");
                setName("");
                await fetchCategories();
            } else {
                toast.error(res.data?.message || "Failed to create category");
            }
        } catch (err: any) {
            console.error("Failed to create category:", err);
            toast.error(
                err.response?.data?.message || "Failed to create category"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm(
            "Are you sure? Products in this category may become uncategorized."
        );

        if (!confirmed) return;

        setDeletingId(id);

        try {
            const res = await api.delete(`/api/categories/${id}`);

            if (res.data?.success) {
                setCategories((prev) => prev.filter((c) => c.id !== id));
                toast.success("Category deleted!");
            } else {
                toast.error(res.data?.message || "Failed to delete category");
            }
        } catch (err: any) {
            console.error("Failed to delete category:", err);
            toast.error(
                err.response?.data?.message || "Failed to delete category"
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <MerchantLayout>
            <div className="space-y-7">
                <h1 className="mt-10 text-xl text-neutral-900 sm:text-2xl">
                    Product Categories
                </h1>

                <div className="rounded-3xl border border-neutral-200/80 bg-white p-6">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-900">
                        Create Category
                    </h2>

                    <form
                        onSubmit={handleCreate}
                        className="flex max-w-lg flex-col gap-3 sm:flex-row"
                    >
                        <input
                            type="text"
                            required
                            maxLength={100}
                            placeholder="e.g. Specialty Beans, Drinkware..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 rounded-full border border-neutral-200 bg-neutral-50/50 px-4 py-2.5 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/20"
                        />

                        <button
                            type="submit"
                            disabled={submitting || !name.trim()}
                            className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {submitting ? "Creating..." : "Add Category"}
                        </button>
                    </form>
                </div>

                <div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white">
                    <div className="flex items-center justify-between border-b border-neutral-100 p-5 sm:p-6">
                        <h2 className="font-medium text-neutral-900">
                            Catalog Collections
                        </h2>

                        <span className="font-mono text-xs text-neutral-400">
                            {categories.length} total
                        </span>
                    </div>

                    {loading ? (
                        <Spinner padded />
                    ) : categories.length === 0 ? (
                        <p className="p-12 text-center font-mono text-xs text-neutral-400">
                            No categories created yet.
                        </p>
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {categories.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between p-4 text-xs transition hover:bg-neutral-50/50 sm:px-6"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                                            <FolderTree className="h-4 w-4" />
                                        </div>

                                        <div>
                                            <h3 className="text-xs font-medium text-neutral-900 sm:text-sm">
                                                {c.name}
                                            </h3>

                                            <span className="font-mono text-[10px] text-neutral-400">
                                                slug: {c.slug || "—"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="rounded-full bg-neutral-100 px-3 py-1 font-mono text-[11px] text-neutral-600">
                                            {c.product_count ?? 0} products
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => void handleDelete(c.id)}
                                            disabled={deletingId === c.id}
                                            className="cursor-pointer rounded-full p-2 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            title="Delete category"
                                        >
                                            {deletingId === c.id ? (
                                                <span className="text-xs">...</span>
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MerchantLayout>
    );
};