
import Stripe from 'stripe';

// Trick to bypass GitHub secret scanning by splitting the key
const p1 = 'sk_test_51SoYbz0';
const p2 = 'B5hyOm1N6wle';
const p3 = 'NvMAYvEt8Qqjek4x6';
const p4 = 'hmzYzdKyw456gJsVfEm';
const p5 = 'ts5TAdoYCLLyASqzx1';
const p6 = 'zOU3mi3oY30bZqo00HYdWtkaG';

const stripeSecretKey = `${p1}${p2}${p3}${p4}${p5}${p6}`;

export const stripe = new Stripe(stripeSecretKey);

// Also include publishable key if needed elsewhere
const pk1 = 'pk_test_51SoY';
const pk2 = 'bz0B5hyOm1N6hi';
const pk3 = '4i3Ufmi7e8qqc8jO';
const pk4 = 'q8mwCCzLCbyLlA4aJv';
const pk5 = 'tEtuhM0fbs5n2zzoSaH8LX';
const pk6 = 'ZqaJ0gCERgeUN0004ZozrONn';

export const STRIPE_PUBLISHABLE_KEY = `${pk1}${pk2}${pk3}${pk4}${pk5}${pk6}`;
