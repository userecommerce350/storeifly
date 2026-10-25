import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { MerchantLayout } from "../../components/MerchantLayout";
import toast from "react-hot-toast";
import { StoreBrandingForm } from "../../components/merchant/settings/StoreBrandingForm";
import { StoreShippingForm } from "../../components/merchant/settings/StoreShippingForm";
import { Spinner } from "../../components/common/Spinner";
import { StoreHeroStyleSelector, type HeroStyleType } from "../../components/merchant/settings/StoreHeroStyleSelector";
import { StoreAccentColorSelector } from "../../components/merchant/settings/StoreAccentColorSelector";
import { api } from "../../config/api";

export const SettingsPage: React.FC = () => {
    const { store, setStore } = useAuth();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [logoUrl, setLogoUrl] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [shippingFee, setShippingFee] = useState("0");
    const [freeShippingThreshold, setFreeShippingThreshold] = useState("0");
    const [heroStyle, setHeroStyle] = useState<HeroStyleType>("hero1");
    const [accentColor, setAccentColor] = useState("#059669");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    const accentColorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (accentColorTimeoutRef.current) {
                clearTimeout(accentColorTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {

        if (store) {
            setName(store.name || "");
            setDescription(store.description || "");
            setCurrency(store.currency || "USD");
            setLogoUrl(store.logo_url || "");
            setBannerUrl(store.banner_url || "");
            setShippingFee(store.shipping_fee?.toString() || "0");
            setFreeShippingThreshold(store.free_shipping_threshold?.toString() || "0");
            setHeroStyle((store.hero_style as HeroStyleType) || "hero1");
            setAccentColor(store.accent_color || "#ff9500");
            setLoading(false);
        }
    }, [store]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo" | "banner") => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        const fd = new FormData();
        fd.append("image", file);

        if (field === "logo") setUploadingLogo(true);
        else setUploadingBanner(true);

        try {
            const res = await api.post("/api/upload/single", fd, { headers: { "Content-Type": "multipart/form-data" } });
            if (res.data?.success) {
                if (field === "logo") setLogoUrl(res.data.url);
                else setBannerUrl(res.data.url);
                toast.success("Image uploaded!");
            }
        } catch (err) {
            toast.error("Upload failed");
        } finally {
            if (field === "logo") setUploadingLogo(false);
            else setUploadingBanner(false);
        }
    };

    const handleHeroStyleChange = async (newStyle: HeroStyleType) => {
        setHeroStyle(newStyle);

        try {
            const res = await api.put("/api/stores/me", { hero_style: newStyle });
            if (res.data?.success) {
                setStore(res.data.store);
                toast.success("Hero layout saved!");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save hero layout");
        }
    };

    const handleAccentColorChange = async (newColor: string) => {
        setAccentColor(newColor);

        if (accentColorTimeoutRef.current) {
            clearTimeout(accentColorTimeoutRef.current);
        }

        accentColorTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await api.put("/api/stores/me", { accent_color: newColor });
                if (res.data?.success) {
                    setStore(res.data.store);
                    toast.success("Accent color saved!");
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to save accent color");
            }
        }, 350);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put("/api/stores/me", {
                name: name.trim(),
                description: description.trim(),
                currency,
                logo_url: logoUrl,
                banner_url: bannerUrl,
                shipping_fee: Number(shippingFee) || 0,
                free_shipping_threshold: Number(freeShippingThreshold) || 0,
                hero_style: heroStyle,
                accent_color: accentColor,
            });

            if (res.data?.success) {
                setStore(res.data.store);
                toast.success("Store settings updated Successfully!");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update settings");
        }finally {
            setSaving(false)
        }
    };

    if (loading) {
        return (
            <MerchantLayout>
                <Spinner padded />
            </MerchantLayout>
        );
    }

    return (
        <MerchantLayout>
            <div className="space-y-6 max-w-4xl font-sans">
                <h1 className="text-xl sm:text-2xl text-neutral-900 mt-10">Store Settings</h1>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Hero Style Selection */}
                    <div className="p-6 bg-white border border-neutral-200/90 rounded-3xl shadow-xs">
                        <StoreHeroStyleSelector value={heroStyle} onChange={handleHeroStyleChange} />
                    </div>

                    {/* Brand Accent Color Selection */}
                    <div className="p-6 bg-white border border-neutral-200/90 rounded-3xl shadow-xs">
                        <StoreAccentColorSelector value={accentColor} onChange={handleAccentColorChange} />
                    </div>

                    {/* Branding Info */}
                    <StoreBrandingForm
                        name={name}
                        onNameChange={setName}
                        description={description}
                        onDescriptionChange={setDescription}
                        logoUrl={logoUrl}
                        onLogoUrlChange={setLogoUrl}
                        bannerUrl={bannerUrl}
                        onBannerUrlChange={setBannerUrl}
                        onFileUpload={handleFileUpload}
                        uploadingLogo={uploadingLogo}
                        uploadingBanner={uploadingBanner}
                    />

                    {/* Shipping Configuration */}
                    <StoreShippingForm
                        shippingFee={shippingFee}
                        onShippingFeeChange={setShippingFee}
                        freeShippingThreshold={freeShippingThreshold}
                        onFreeShippingThresholdChange={setFreeShippingThreshold}
                    />

                    <button
                        type="submit"
                        disabled={saving}
                        className="py-3 px-7 text-white bg-emerald-600 text-xs font-semibold rounded-full transition disabled:opacity-50 cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                        {saving ? "Saving Changes..." : "Save Store Settings"}
                    </button>
                </form>
            </div>
        </MerchantLayout>
    );
};
