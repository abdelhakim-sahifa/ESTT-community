'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  CreditCard,
  LayoutDashboard,
  PlusCircle,
  PlayCircle,
  MousePointer2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AD_PRICING } from '@/lib/ad-constants';

export default function AdPlatformLanding() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Hero Section */}
      <section className="relative pt-20 pb-40 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#f1f5f9,transparent)] opacity-100" />
        <div className="container relative mx-auto px-4 text-center">
          <div className="mb-0 flex justify-center">
            <Image
              src="/assets/images/logo__five.svg"
              alt="ESTT Logo"
              width={120}
              height={40}
              className="h-12 w-auto mb-6 opacity-90"
            />
          </div>
          <Badge className="mb-6 bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 text-xs font-black uppercase tracking-widest">
            ESTT Ad Platform • Phase Bêta
          </Badge>
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-[1.1]">
            Propulsez votre projet <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              au cœur de l'EST Tétouan
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl mb-12 leading-relaxed">
            Le moyen le plus simple et le plus efficace pour atteindre des milliers d'étudiants chaque jour. Services, projets ou événements : soyez visible là où ça compte.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-lg font-bold shadow-2xl shadow-blue-500/20 transition-all hover:scale-105"
            >
              <Link href="/view-ads/submit">
                <PlusCircle className="mr-2 w-5 h-5" />
                Lancer une Campagne
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-16 px-10 rounded-2xl border-slate-200 text-slate-900 hover:bg-slate-50 text-lg font-bold"
            >
              <Link href="/view-ads/dashboard">
                <LayoutDashboard className="mr-2 w-5 h-5" />
                Mon Dashboard
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: ShieldCheck, label: "Modération Rapide" },
              { icon: Clock, label: "Support 24/7" },
              { icon: CreditCard, label: "Paiement Sécurisé" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                <item.icon className="w-4 h-4 text-blue-500" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-950 mb-4 tracking-tight">Comment ça marche ?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Un processus simple et transparent pour mettre votre annonce en ligne.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Créez votre annonce",
                desc: "Remplissez le formulaire, téléchargez votre visuel (image ou vidéo) et définissez votre lien de redirection.",
                icon: Edit3 => <PlusCircle className="w-8 h-8 text-blue-600" />
              },
              {
                step: "02",
                title: "Validation & Review",
                desc: "Notre équipe vérifie le contenu de votre annonce sous 24h pour s'assurer de sa qualité.",
                icon: Shield => <ShieldCheck className="w-8 h-8 text-blue-600" />
              },
              {
                step: "03",
                title: "Activez & Rayonnez",
                desc: "Une fois validée, procédez au paiement pour activer votre annonce sur la page d'accueil de l'ESTT.",
                icon: Rocket => <Sparkles className="w-8 h-8 text-blue-600" />
              }
            ].map((step, i) => (
              <div key={i} className="relative group p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
                <span className="absolute -top-6 left-8 text-6xl font-black text-slate-100 group-hover:text-blue-50 transition-colors pointer-events-none">
                  {step.step}
                </span>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                    {step.icon()}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-black text-slate-950 mb-4 tracking-tight">Tarifs adaptés à votre budget</h2>
              <p className="text-slate-500 mb-0">Choisissez la durée qui correspond le mieux à vos objectifs de communication.</p>
            </div>
            <Link href="/view-ads/dashboard" className="text-blue-600 font-bold flex items-center group">
              Gérer mes abonnements <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {AD_PRICING.map((plan, i) => (
              <Card key={i} className={`relative overflow-hidden rounded-[40px] border-2 p-10 transition-all hover:-translate-y-2 ${i === 1 ? 'border-blue-600 bg-slate-950 text-white shadow-2xl shadow-blue-200' : 'border-slate-100 bg-white'}`}>
                {i === 1 && (
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-blue-600 text-white border-none py-1 px-3">Plus Populaire</Badge>
                  </div>
                )}
                <p className={`text-sm font-bold uppercase tracking-widest mb-6 ${i === 1 ? 'text-blue-400' : 'text-slate-400'}`}>{plan.label}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black">{plan.price}</span>
                  <span className={`text-sm font-bold ${i === 1 ? 'text-slate-400' : 'text-slate-500'}`}>MAD</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {[
                    `Affichage sur la Home Page`,
                    `${plan.duration} jours de diffusion`,
                    `Support via WhatsApp`,
                    `Image ou Vidéo supportée`,
                    `Lien de redirection perso`
                  ].map((feature, f) => (
                    <li key={f} className="flex items-center gap-3 text-sm font-medium">
                      <CheckCircle2 className={`w-4 h-4 ${i === 1 ? 'text-blue-400' : 'text-blue-600'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full h-14 rounded-2xl font-black text-lg ${i === 1 ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/40' : 'bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200'}`}
                >
                  <Link href="/view-ads/submit">Choisir ce Plan</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / Info */}
      <section className="py-32 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-950 mb-4">Questions Fréquentes</h2>
            <p className="text-slate-500">Tout ce qu'il faut savoir avant de vous lancer.</p>
          </div>

          <div className="space-y-4">
            {[
              { q: "Quels types d'annonces sont autorisés ?", a: "Nous acceptons tout contenu lié à la vie étudiante : services (design, cours, etc.), projets entrepreneuriaux, événements de clubs ou annonces personnelles. Tout contenu inapproprié sera refusé." },
              { q: "Combien de temps prend la validation ?", a: "La modération prend généralement moins de 24 heures. Vous recevrez une notification par e-mail dès que votre annonce sera approuvée." },
              { q: "Comment se fait le paiement ?", a: "Une fois l'annonce approuvée, vous pourrez nous contacter via WhatsApp pour finaliser le paiement. L'activation est manuelle et immédiate après réception." },
              { q: "Puis-je modifier mon annonce après publication ?", a: "Vous pouvez modifier votre annonce tant qu'elle est en mode brouillon ou si elle est refusée. Une annonce 'Live' ne peut être modifiée qu'après contact avec l'administrateur." }
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-3xl border border-slate-100 p-6 md:p-8 cursor-pointer open:ring-2 open:ring-blue-100 transition-all">
                <summary className="flex items-center justify-between font-bold text-lg text-slate-900 list-none">
                  {faq.q}
                  <PlusCircle className="w-5 h-5 text-slate-300 group-open:rotate-45 transition-transform" />
                </summary>
                <p className="mt-6 text-slate-500 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-blue-600 rounded-[50px] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-3xl shadow-blue-200">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">Prêt à briller sur le campus ?</h2>
              <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                Ne laissez pas votre projet dans l'ombre. Rejoignez les dizaines d'étudiants qui boostent leur visibilité avec nous.
              </p>
              <Button
                asChild
                size="lg"
                className="h-16 px-12 rounded-2xl bg-white text-blue-600 hover:bg-slate-50 text-xl font-black shadow-2xl transition-all hover:scale-105"
              >
                <Link href="/view-ads/submit">Publier mon annonce maintenant</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
