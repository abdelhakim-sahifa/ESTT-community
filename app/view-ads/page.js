'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { AlertCircle, Carrot, TrendingUp, Eye, Sparkles } from 'lucide-react';
import { db, ref, set, get, push, onValue } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ViewAds() {
  const [donationCount, setDonationCount] = useState(0);
  const [pageOpenCount, setPageOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [adError, setAdError] = useState(false);

  // Track page opens and fetch counts on mount
  useEffect(() => {
    // Check if we are on localhost
    setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const trackPageOpen = async () => {
      try {
        // Record page open with timestamp
        const pageOpenRef = ref(db, 'monetization/pageOpens');
        const newOpenRef = await push(pageOpenRef);
        const timestamp = new Date().toISOString();
        await set(newOpenRef, { timestamp });

        // Fetch and display page open count
        const openCountSnapshot = await get(pageOpenRef);
        if (openCountSnapshot.exists()) {
          const openCount = Object.keys(openCountSnapshot.val()).length;
          setPageOpenCount(openCount);
        }

        // Listen to donation count in real-time
        const donationRef = ref(db, 'monetization/donations');
        onValue(donationRef, (snapshot) => {
          if (snapshot.exists()) {
            setDonationCount(Object.keys(snapshot.val()).length);
          } else {
            setDonationCount(0);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('Error tracking page open:', error);
        setLoading(false);
      }
    };

    trackPageOpen();
  }, []);

  // Initialize ads
  useEffect(() => {
    if (!isLocalhost && !loading) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense initialization error:', err);
        setAdError(true);
      }
    }
  }, [isLocalhost, loading]);

  // Handle donation button click
  const handleDonation = async () => {
    try {
      const donationRef = ref(db, 'monetization/donations');
      const newDonationRef = await push(donationRef);
      const timestamp = new Date().toISOString();
      await set(newDonationRef, { timestamp });
    } catch (error) {
      console.error('Error recording donation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8145062068015821"
        strategy="afterInteractive"
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-600 to-indigo-700 text-white py-16 mb-8">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-blue-400/30 text-white border-none hover:bg-blue-400/40 backdrop-blur-sm">
            Supportez la Plateforme
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Monétisation & Soutien
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Aidez-nous à garder ESTT.community gratuit et accessible pour tous les étudiants en interagissant avec nos partenaires.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <Alert className="mb-8 border-blue-200 bg-blue-50/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <div>
              <AlertTitle className="text-blue-900 font-semibold">Comment ça marche?</AlertTitle>
              <AlertDescription className="text-blue-800">
                En regardant et interagissant avec les annonces, vous générez des revenus directs pour le développement.
                Chaque clic nous aide à améliorer vos outils quotidiens.
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-1 w-full bg-orange-500" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Carrot className="w-4 h-4 text-orange-500" />
                    Total des Carottes Données
                  </p>
                  <p className="text-4xl font-bold mt-2 text-orange-600 tabular-nums">
                    {donationCount}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
            <div className="h-1 w-full bg-blue-500" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    Vues de la Page
                  </p>
                  <p className="text-4xl font-bold mt-2 text-blue-600 tabular-nums">
                    {pageOpenCount}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                  <Eye className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donation Section */}
        <Card className="mb-12 border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm border-2">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-orange-100">
              <Carrot className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-orange-900 mb-2">
              Soutien Direct aux Développeurs
            </h3>
            <p className="text-orange-800/80 mb-6 max-w-md">
              Vous aimez la plateforme ? Envoyez-nous une "Carotte" virtuelle pour nous motiver !
            </p>
            <Button
              size="lg"
              onClick={handleDonation}
              className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border-2 border-orange-200 px-10 h-14 rounded-full text-lg font-bold shadow-sm transition-all duration-500 active:opacity-70"
            >
              <Carrot className="w-6 h-6 mr-2" />
              Donner une Carotte ({donationCount})
            </Button>
          </CardContent>
        </Card>

        {/* AdSense Unit */}
        <div className="ad-container max-w-4xl mx-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center mb-4">Annonce Recommandée</p>

          {isLocalhost ? (
            <div className="min-h-[250px] w-full bg-slate-50 rounded-xl flex flex-col items-center justify-center p-8 border border-dashed border-slate-200">
              <AlertCircle className="w-8 h-8 text-slate-400 mb-3" />
              <p className="text-slate-600 font-medium text-center">Mode Développement</p>
              <p className="text-slate-400 text-sm text-center max-w-xs mt-1">
                Les publicités Google AdSense ne sont pas affichées sur localhost.
                Elles apparaîtront une fois le site déployé sur un domaine approuvé.
              </p>
            </div>
          ) : (
            <div className="min-h-[250px] w-full bg-gray-50/50 rounded-xl overflow-hidden border border-dashed border-gray-200 block">
              <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', minWidth: '250px' }}
                data-ad-format="autorelaxed"
                data-ad-client="ca-pub-8145062068015821"
                data-ad-slot="6636305857"
              ></ins>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
