// ESTT Community — Email Design System
// Modern, simple and aligned with the platform brand (#0056b3 primary, #00a8ff secondary, #ffc107 accent).

export const emailStyles = {
    // ---------- Layout ----------
    body: `
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f1f5f9;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    `,
    container: `
        width: 100%;
        max-width: 600px;
        margin: 24px auto;
        background-color: #ffffff;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    `,
    topBar: `
        height: 4px;
        background: linear-gradient(90deg, #0056b3 0%, #00a8ff 100%);
    `,
    header: `
        background-color: #ffffff;
        padding: 26px 32px;
        text-align: center;
        border-bottom: 1px solid #f1f5f9;
    `,
    logo: `
        height: 44px;
        width: auto;
        display: inline-block;
        border: 0;
    `,
    content: `
        padding: 32px;
        color: #334155;
        line-height: 1.7;
        font-size: 16px;
    `,
    footer: `
        background-color: #f8fafc;
        padding: 22px 32px;
        text-align: center;
        border-top: 1px solid #eef2f6;
        color: #94a3b8;
        font-size: 12px;
    `,

    // ---------- Typography ----------
    h1: `
        color: #0f172a;
        font-size: 23px;
        line-height: 1.35;
        font-weight: 700;
        margin-top: 0;
        margin-bottom: 18px;
    `,
    h2: `
        color: #0f172a;
        font-size: 18px;
        line-height: 1.4;
        font-weight: 600;
        margin-top: 26px;
        margin-bottom: 12px;
    `,
    h3: `
        color: #0f172a;
        font-size: 16px;
        line-height: 1.4;
        font-weight: 600;
        margin-top: 20px;
        margin-bottom: 10px;
    `,
    paragraph: `
        margin: 0 0 16px;
        line-height: 1.7;
    `,

    // ---------- Components ----------
    button: `
        display: inline-block;
        background-color: #0056b3;
        color: #ffffff;
        padding: 12px 28px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
        font-size: 15px;
        margin-top: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 14px rgba(0, 86, 179, 0.22);
    `,
    link: `
        color: #0056b3;
        text-decoration: underline;
    `,
    highlightBox: `
        background-color: #f8fafc;
        border: 1px solid #eef2f6;
        border-radius: 12px;
        padding: 18px 20px;
        margin: 20px 0;
        color: #334155;
    `,
    infoBox: `
        background-color: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 12px;
        padding: 18px 20px;
        margin: 20px 0;
        color: #1e3a5f;
    `,
    successBox: `
        background-color: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 12px;
        padding: 18px 20px;
        margin: 20px 0;
        color: #065f46;
    `,
    warningBox: `
        background-color: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 12px;
        padding: 18px 20px;
        margin: 20px 0;
        color: #92400e;
    `,
    dangerBox: `
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 12px;
        padding: 18px 20px;
        margin: 20px 0;
        color: #991b1b;
    `,
    code: `
        font-family: 'Roboto Mono', 'Courier New', Courier, monospace;
        background-color: #eef2f7;
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 14px;
        color: #0f172a;
    `,
    divider: `
        border: 0;
        border-top: 1px solid #eef2f6;
        margin: 24px 0;
    `,
    small: `
        font-size: 13px;
        color: #64748b;
        line-height: 1.6;
    `,
    clubLogo: `
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 14px;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
    `,
    eventImage: `
        width: 100%;
        max-height: 280px;
        object-fit: cover;
        border-radius: 12px;
        margin-bottom: 22px;
    `
};