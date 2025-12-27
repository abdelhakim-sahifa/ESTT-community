'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { db, ref, set, get, push, onValue } from '@/lib/firebase';

export default function ViewAds() {
  const [donationCount, setDonationCount] = useState(0);
  const [pageOpenCount, setPageOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Track page opens and fetch counts on mount
  useEffect(() => {
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Monétisation - Regarder les Annonces</h1>
      <p className="text-gray-600 mb-2">Découvrez nos annonces les plus intéressantes</p>
      <p className="text-gray-700 mb-8 bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <span>
          <strong>Comment ça marche?</strong> En regardant et interagissant avec les annonces ci-dessous, vous aidez à générer des revenus pour soutenir le développement de cette plateforme. Chaque vue et chaque clic contribue à maintenir Moniti gratuit et accessible pour tous les étudiants.
        </span>
      </p>

      {/* Stats Section */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-sm">Total des Carottes Données</p>
          <p className="text-3xl font-bold text-orange-600">{donationCount}</p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600 text-sm">Fois Cette Page a Été Ouverte</p>
          <p className="text-3xl font-bold text-blue-600">{pageOpenCount}</p>
        </div>
      </div>

      {/* Carrot Donation Section */}
      <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <p className="text-orange-900 mb-4 flex items-center gap-2">
          Soutenez les développeurs avec une carotte!
        </p>
        <button
          onClick={handleDonation}
          className="flex items-center gap-2 bg-orange-100 text-orange-700 font-bold py-3 px-6 rounded-lg border-2 border-orange-300 hover:bg-orange-200 transition-colors"
        >
          <i className="fa-solid fa-carrot text-xl" style={{color: '#ea580c'}}></i>
          Donner une Carotte aux Développeurs ({donationCount})
        </button>
      </div>

      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8145062068015821"
        crossOrigin="anonymous"
      ></script>

      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
        }}
        data-ad-format="autorelaxed"
        data-ad-client="ca-pub-8145062068015821"
        data-ad-slot="6636305857"
      ></ins>
    </div>
  );
}
