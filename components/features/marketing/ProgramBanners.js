'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ProgramBanners() {
    const dutBanners = [
        { href: "/browse?field=ia", img: "/assets/images/DUT-1.jpg", label: "Intelligence Artificielle" },
        { href: "/browse?field=insem", img: "/assets/images/DUT-2.jpg", label: "Industrie Navale : Systèmes Électriques et Maintenance" },
        { href: "/browse?field=idd", img: "/assets/images/program-big3.jpg", label: "Informatique & Développement Digital" },
        { href: "/browse?field=casi", img: "/assets/images/DUT-3.jpg", label: "Cybersécurité et audit des systèmes d'information" },
    ];

    const bachelorBanners = [
        { href: "/browse?field=idbi", img: "/assets/images/idbi.jpg", label: "Ingénierie des Données & Business Intelligence" },
        { href: "/browse?field=imn", img: "/assets/images/imn.jpg", label: "Ingénierie en Mécatronique Navale" },
    ];

    return (
        <section id="program-banners" className="py-10 md:py-16 container">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">DUT</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12" id="banners-container">
                {dutBanners.map((banner, index) => (
                    <Link key={index} className="group relative block overflow-hidden rounded-xl bg-background shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg" href={banner.href}>
                        <div className="aspect-[16/10] overflow-hidden">
                            <Image
                                src={banner.img}
                                alt={`${banner.label} banner`}
                                width={300}
                                height={160}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 saturate-[0.95] group-hover:saturate-100"
                                loading="lazy"
                            />
                        </div>
                        <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 right-2 md:right-3">
                            <span className="inline-block rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-sm font-semibold text-white shadow-sm">
                                {banner.label}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">Bachelor</h2>
            <div className="flex justify-center gap-4 md:gap-6" id="banners-container-bachelor">
                {bachelorBanners.map((banner, index) => (
                    <Link key={index} className="group relative block overflow-hidden rounded-xl bg-background shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg w-full max-w-[280px] lg:max-w-none lg:w-[calc(25%-12px)]" href={banner.href}>
                        <div className="aspect-[16/10] overflow-hidden">
                            <Image
                                src={banner.img}
                                alt={`${banner.label} banner`}
                                width={300}
                                height={160}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 saturate-[0.95] group-hover:saturate-100"
                                loading="lazy"
                            />
                        </div>
                        <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 right-2 md:right-3">
                            <span className="inline-block rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-sm font-semibold text-white shadow-sm">
                                {banner.label}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
