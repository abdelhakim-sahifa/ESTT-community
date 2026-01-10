'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ProgramBanners() {
    const banners = [
        { href: "/browse?field=ia", img: "/assets/images/DUT-1.jpg", label: "Intelligence Artificielle" },
        { href: "/browse?field=insem", img: "/assets/images/DUT-2.jpg", label: "Industrie Navale" },
        { href: "/browse?field=casi", img: "/assets/images/DUT-3.jpg", label: "Cybersécurité" },
        { href: "/browse?field=idd", img: "/assets/images/program-big3.jpg", label: "Informatique & Dév Digital" },
    ];

    return (
        <section id="program-banners" className="py-16 container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="banners-container">
                {banners.map((banner, index) => (
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
                        <div className="absolute bottom-3 left-3 right-3">
                            <span className="inline-block rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
                                {banner.label}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
