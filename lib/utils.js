import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

/**
 * Returns current level (1 for S1/S2, 2 for S3/S4) based on startYear and July 1st reset.
 */
export function getUserLevel(startYear) {
    if (!startYear) return 1;
    const now = new Date();
    const currentYear = now.getFullYear();
    const isAfterJuly1st = now.getMonth() >= 6; // July is index 6

    const yearDiff = currentYear - parseInt(startYear);

    if (yearDiff === 0) return 1;
    if (yearDiff === 1) return isAfterJuly1st ? 2 : 1;
    return 2; // Year 2+
}


export function getAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const isAfterJuly1st = now.getMonth() >= 6;
    return isAfterJuly1st ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

