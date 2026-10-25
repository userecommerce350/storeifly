import React, { useEffect, useState } from "react";
import { MerchantLayout } from "../../components/MerchantLayout";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { ProductTable, type ProductItem } from "../../components/merchant/products/ProductTable";
import { ProductModal } from "../../components/merchant/products/ProductModal";
import { type VariantGroup } from "../../components/merchant/products/ProductVariantBuilder";
import { api } from "../../config/api";

const EMPTY_FORM = {
    name: "",
    desc: "",
    price: "",
    compareAt: "",
    sku: "",
    stock: "10",
    categoryId: "",
    status: "active",
    images: [] as string[],
    imageUrlInput: "",
    variants: [] as VariantGroup[],
};

const fetchStoreData = async (path: string) => {
    const storeRes = await api.get("/api/stores/me");
    if (!storeRes.data?.success) return null;
    const storeId = storeRes.data.store.id;
    const res = await api.get(`${path}?storeId=${encodeURIComponent(storeId)}`);
    return res.data?.success ? res.data : null;
};

export const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [newVariantName, setNewVariantName] = useState("");
    const [newVariantOptions, setNewVariantOptions] = useState("");

    const setF = (key: keyof typeof EMPTY_FORM, val: any) => setForm((f) => ({ ...f, [key]: val }));

    useEffect(() => {
        fetchStoreData("/api/products").then((d) => {
            if (d) setProducts(d.products);
            setLoading(false);
        })
        fetchStoreData("/api/categories").then((d) => {
            if (d) setCategories(d.categories);
        })
    }, []);

    const refetchProducts = async () => {
        setLoading(true);
        fetchStoreData("/api/products").then((d) => {
            if (d) setProducts(d.products);
            setLoading(false)
        })
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id?.toString() || "" });
        setIsModalOpen(true);
    };

    const openEditModal = (p: ProductItem) => {
        setEditingProduct(p);
        setForm({
            name: p.name,
            desc: p.description || "",
            price: p.price.toString(),
            compareAt: p.compare_at_price ? p.compare_at_price.toString() : "",
            sku: p.sku || "",
            stock: p.stock.toString(),
            categoryId: p.category_id ? p.category_id.toString() : "",
            status: p.status || "active",
            images: Array.isArray(p.images) ? p.images : [],
            imageUrlInput: "",
            variants: Array.isArray(p.variants) ? p.variants : [],
        });
        setIsModalOpen(true);
    };

    const handleAddImageFromUrl = () => {
        if (!form.imageUrlInput.trim()) return;
        setF("images", [...form.images, form.imageUrlInput.trim()]);
        setF("imageUrlInput", "");
    };

    const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const fd = new FormData();
        fd.append("image", e.target.files[0]);
        setUploadingImage(true)
        try {
            const res = await api.post("/api/upload/single", fd, { headers: { "Content-Type": "multipart/form-data" } });
            if (res.data?.success) {
                setF("images", [...form.images, res.data.url]);
                toast.success("Image uploaded!");
            }
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAddVariantGroup = () => {
        if (!newVariantName.trim() || !newVariantOptions.trim()) {
            toast.error("Provide variant name and comma-separated options");
            return;
        }
        setF("variants", [
            ...form.variants,
            {
                name: newVariantName.trim(),
                options: newVariantOptions
                    .split(",")
                    .map((o) => o.trim())
                    .filter(Boolean),
            },
        ]);
        setNewVariantName("");
        setNewVariantOptions("");
    };

    const handleAddColorVariantOption = (colorName: string) => {
        const cleanName = colorName.trim();
        if (!cleanName) return;

        const colorGroupIndex = form.variants.findIndex(
            (v) => v.name.toLowerCase() === "color" || v.name.toLowerCase() === "colour"
        );

        if (colorGroupIndex >= 0) {
            const existingGroup = form.variants[colorGroupIndex];
            if (!existingGroup.options.some((o) => o.toLowerCase() === cleanName.toLowerCase())) {
                const updatedGroup = {
                    ...existingGroup,
                    options: [...existingGroup.options, cleanName],
                };
                const updatedVariants = [...form.variants];
                updatedVariants[colorGroupIndex] = updatedGroup;
                setF("variants", updatedVariants);
            }
        } else {
            setF("variants", [
                ...form.variants,
                {
                    name: "Color",
                    options: [cleanName],
                },
            ]);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.price) {
            toast.error("Product name and price are required");
            return;
        }

        const payload = {
            name: form.name.trim(),
            description: form.desc.trim(),
            price: Number(form.price),
            compare_at_price: form.compareAt ? Number(form.compareAt) : null,
            sku: form.sku.trim() || null,
            stock: Number(form.stock) || 0,
            category_id: form.categoryId ? Number(form.categoryId) : null,
            images: form.images,
            variants: form.variants,
            status: form.status,
        };

        try {
            const res = editingProduct
                ? await api.put(`/api/products/${editingProduct.id}`, payload)
                : await api.post("/api/products", payload);

            if (res.data?.success) {
                toast.success(editingProduct ? "Product updated!" : "Product created!");
                setIsModalOpen(false);
                refetchProducts();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save product");
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            const res = await api.delete(`/api/products/${id}`);
            if (res.data?.success) {
                toast.success("Product deleted");
                setProducts((prev) => prev.filter((p) => p.id !== id));
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Delete failed");
        }
    };

    const filtered = products.filter(
        (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <MerchantLayout>
            <div className="space-y-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-xl sm:text-2xl text-neutral-900 mt-10">Product Catalog</h1>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full transition cursor-pointer shadow-xs shadow-emerald-700/20"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                </div>

                <div className="bg-white p-3 sm:px-4 rounded-full border border-neutral-200/80 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search products by title or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-transparent focus:outline-none placeholder:text-neutral-400"
                        />
                    </div>
                    <span className="text-xs text-neutral-400 font-mono pr-2">{filtered.length} products</span>
                </div>

                <ProductTable
                    products={filtered}
                    loading={loading}
                    onEdit={openEditModal}
                    onDelete={handleDeleteProduct}
                    onAddProduct={openCreateModal}
                />

                <ProductModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    editingProduct={editingProduct}
                    categories={categories}
                    formName={form.name}
                    onFormNameChange={(v) => setF("name", v)}
                    formDesc={form.desc}
                    onFormDescChange={(v) => setF("desc", v)}
                    formPrice={form.price}
                    onFormPriceChange={(v) => setF("price", v)}
                    formCompareAt={form.compareAt}
                    onFormCompareAtChange={(v) => setF("compareAt", v)}
                    formSku={form.sku}
                    onFormSkuChange={(v) => setF("sku", v)}
                    formStock={form.stock}
                    onFormStockChange={(v) => setF("stock", v)}
                    formCategoryId={form.categoryId}
                    onFormCategoryIdChange={(v) => setF("categoryId", v)}
                    formStatus={form.status}
                    onFormStatusChange={(v) => setF("status", v)}
                    formImages={form.images}
                    formImageUrlInput={form.imageUrlInput}
                    onFormImageUrlInputChange={(v) => setF("imageUrlInput", v)}
                    onAddImageFromUrl={handleAddImageFromUrl}
                    onUploadImageFile={handleUploadImageFile}
                    onRemoveImage={(i) =>
                        setF(
                            "images",
                            form.images.filter((_, idx) => idx !== i),
                        )
                    }
                    onAddTransformedImage={(url) => setF("images", [...form.images, url])}
                    onReplaceImage={(idx, url) =>
                        setF(
                            "images",
                            form.images.map((img, i) => (i === idx ? url : img)),
                        )
                    }
                    onAddColorVariantOption={handleAddColorVariantOption}
                    uploadingImage={uploadingImage}
                    formVariants={form.variants}
                    newVariantName={newVariantName}
                    onNewVariantNameChange={setNewVariantName}
                    newVariantOptions={newVariantOptions}
                    onNewVariantOptionsChange={setNewVariantOptions}
                    onAddVariantGroup={handleAddVariantGroup}
                    onRemoveVariantGroup={(i) =>
                        setF(
                            "variants",
                            form.variants.filter((_, idx) => idx !== i),
                        )
                    }
                    onSaveProduct={handleSaveProduct}
                />
            </div>
        </MerchantLayout>
    );
};
