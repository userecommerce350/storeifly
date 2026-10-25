import React, { useEffect, useState } from "react";
import { Navbar } from "../../components/Navbar";
import { LandingHero } from "../../components/public/landing/LandingHero";
import { LandingFeatures } from "../../components/public/landing/LandingFeatures";
import { LandingStoreShowcase } from "../../components/public/landing/LandingStoreShowcase";
import { LandingFaq } from "../../components/public/landing/LandingFaq";
import { LandingCta } from "../../components/public/landing/LandingCta";
import { LandingFooter } from "../../components/public/landing/LandingFooter";
import { api } from "../../config/api";

export const LandingPage: React.FC = () => {
    const [stores, setStores] = useState<any[]>([]);

    useEffect(() => {
        api.get("/api/stores/public/featured").then((res) => {
            if (res.data?.success) {
                setStores(res.data.stores);
            }
        }).catch((err) => { console.error("Failed to fetch featured stores:", err) });
    }, []);

    return (
        <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
            <Navbar />
            <LandingHero />
            <LandingFeatures />
            <LandingStoreShowcase stores={stores} />
            <LandingFaq />
            <LandingCta />
            <LandingFooter />
        </div>
    );
};
