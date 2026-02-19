'use client';

export default function SiteStats({ stats }) {
    return (
        <section id="site-stats" className="py-12 border-y border-slate-100">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="stats-container">
                    {[
                        { value: stats.contributions, label: "Contributions en attente" },
                        { value: stats.resources, label: "Ressources totales" },
                        { value: stats.modules, label: "Modules disponibles" },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-6 text-center">
                            <div className="text-4xl font-bold text-primary mb-1">{stat.value}</div>
                            <div className="text-slate-500 text-sm font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
