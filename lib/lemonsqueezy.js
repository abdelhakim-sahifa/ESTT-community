
/**
 * LemonSqueezy payment helper
 * Replaces lib/stripe.js — uses the LemonSqueezy REST API directly (no SDK needed).
 *
 * Required environment variables:
 *   LEMONSQUEEZY_API_KEY           - Your LS API key (Settings → API)
 *   LEMONSQUEEZY_STORE_ID          - Your LS store ID
 *   LEMONSQUEEZY_TICKET_VARIANT_ID - Variant ID for the "Ticket" product
 *   LEMONSQUEEZY_AD_VARIANT_ID     - Variant ID for the "Ad" product
 *   LEMONSQUEEZY_WEBHOOK_SECRET    - Signing secret for webhook verification
 */

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1';

/**
 * Build the standard LS API request headers.
 */
function lsHeaders() {
    return {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    };
}

/**
 * Create a LemonSqueezy checkout session.
 *
 * @param {object} options
 * @param {'ticket'|'ad'} options.type        - Payment type
 * @param {number}        options.price        - Price in MAD (whole units, e.g. 50)
 * @param {string}        options.productName  - Product display name on checkout page
 * @param {string}        options.successUrl   - Redirect URL on success
 * @param {string}        options.cancelUrl    - Redirect URL on cancel
 * @param {string}        options.userEmail    - Pre-fill customer email
 * @param {object}        options.customData   - Arbitrary metadata (type, ticketId, adId, …)
 *
 * @returns {Promise<{url: string, id: string}>} Checkout URL and LS checkout ID
 */
export async function createCheckout({
    type,
    price,
    productName,
    successUrl,
    cancelUrl,
    userEmail,
    customData = {},
}) {
    const variantId =
        type === 'ad'
            ? process.env.LEMONSQUEEZY_AD_VARIANT_ID
            : process.env.LEMONSQUEEZY_TICKET_VARIANT_ID;

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    if (!variantId || !storeId) {
        throw new Error(
            'Missing LemonSqueezy env vars: LEMONSQUEEZY_STORE_ID or variant IDs.'
        );
    }

    // LemonSqueezy custom_price is in cents (smallest currency unit)
    const customPrice = Math.round(price * 100);

    const payload = {
        data: {
            type: 'checkouts',
            attributes: {
                custom_price: customPrice,
                product_options: {
                    name: productName,
                    redirect_url: successUrl,
                },
                checkout_options: {
                    // Hide the quantity selector — always 1 unit
                    button_color: '#1d4ed8',
                },
                checkout_data: {
                    email: userEmail,
                    custom: {
                        ...customData,
                        type,
                    },
                },
                expires_at: null, // No expiry
            },
            relationships: {
                store: {
                    data: { type: 'stores', id: storeId.toString() },
                },
                variant: {
                    data: { type: 'variants', id: variantId.toString() },
                },
            },
        },
    };

    const response = await fetch(`${LS_API_BASE}/checkouts`, {
        method: 'POST',
        headers: lsHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `LemonSqueezy API error (${response.status}): ${errorBody}`
        );
    }

    const json = await response.json();
    return {
        url: json.data.attributes.url,
        id: json.data.id,
    };
}

/**
 * Retrieve a single LemonSqueezy order by its ID.
 *
 * @param {string|number} orderId
 * @returns {Promise<object>} The order object from the LS API
 */
export async function getOrder(orderId) {
    const response = await fetch(`${LS_API_BASE}/orders/${orderId}`, {
        method: 'GET',
        headers: lsHeaders(),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `LemonSqueezy getOrder error (${response.status}): ${errorBody}`
        );
    }

    const json = await response.json();
    return json.data;
}
