'use client';

export default function SiteStats({ stats }) {
    return (
        <section id="site-stats" className="py-16 bg-slate-50 border-y">
            <div className="container text-center">
                <h2 className="text-3xl font-heading font-medium mb-12">État de la plateforme</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="stats-container">
                    {[
                        { value: stats.contributions, label: "Contributions en attente" },
                        { value: stats.resources, label: "Ressources totales" },
                        { value: stats.modules, label: "Modules disponibles" },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-6 bg-background rounded-xl shadow-sm border">
                            <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                            <div className="text-muted-foreground font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
