export const AD_STATUSES = {
    DRAFT: 'draft',
    UNDER_REVIEW: 'under_review',
    PAYMENT_REQUIRED: 'payment_required',
    LIVE: 'live',
    EXPIRED: 'expired',
    REFUSED: 'refused'
};

export const AD_CATEGORIES = [
    { id: 'service', label: 'Service (Cours, Design, etc.)', icon: 'Tool' },
    { id: 'event', label: 'Événement', icon: 'Calendar' },
    { id: 'project', label: 'Projet Étudiant', icon: 'Rocket' },
    { id: 'other', label: 'Autre', icon: 'MoreHorizontal' }
];

export const AD_PRICING = [
    { id: '7_days', label: '7 Jours', duration: 7, price: 7 },
    { id: '30_days', label: '30 Jours', duration: 30, price: 20 },
    { id: '90_days', label: '90 Jours', duration: 90, price: 50 }
];

export const AD_LIMITS = {
    TITLE_MAX_LENGTH: 60,
    DESC_MAX_LENGTH: 500,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime']
};

export const DEFAULT_AD_DURATION = 30; // days
