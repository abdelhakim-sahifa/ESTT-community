/**
 * Utility for uploading images to ImgBB
 * API Key: 2906f198a8694axxxxxxxxxxxxxxx
 */

const IMGBB_API_KEY = '2906f198a8694a02986394d2ecea8ebf';

/**
 * Uploads an image file or base64 string to ImgBB
 * @param {File|string} image - The image file or base64 string to upload
 * @returns {Promise<string>} - The public URL of the uploaded image
 * @throws {Error} - If the upload fails
 */
export async function uploadToImgBB(image) {
    if (!image) {
        throw new Error('Aucune image fournie pour l\'envoi.');
    }

    const formData = new FormData();
    formData.append('image', image);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error?.message || 'Une erreur est survenue lors de l\'envoi vers ImgBB.');
        }
    } catch (error) {
        console.error('ImgBB upload error:', error);
        throw new Error(error.message || 'Erreur réseau lors de l\'envoi vers ImgBB.');
    }
}
