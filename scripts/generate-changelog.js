const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function generateChangelog() {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

    const margin = 60;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const ensurePage = () => {
        if (y < margin + 40) {
            page = doc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
        }
    };

    const drawText = (text, x, options = {}) => {
        const { size = 10, color = rgb(0.15, 0.15, 0.15), f = font, maxWidth = pageWidth - margin * 2 } = options;
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (f.widthOfTextAtSize(testLine, size) > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        for (const line of lines) {
            ensurePage();
            page.drawText(line, { x, y, size, font: f, color });
            y -= size + 4;
        }
    };

    const drawLine = () => {
        ensurePage();
        page.drawLine({
            start: { x: margin, y: y + 4 },
            end: { x: pageWidth - margin, y: y + 4 },
            thickness: 0.5,
            color: rgb(0.85, 0.85, 0.85),
        });
        y -= 14;
    };

    const drawItem = (title, desc) => {
        ensurePage();
        page.drawText(`\u2022  ${title}`, { x: margin + 4, y, size: 10, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
        y -= 14;
        const words = desc.split(' ');
        let lines = [];
        let currentLine = '';
        const maxWidth = pageWidth - margin * 2 - 12;
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (fontItalic.widthOfTextAtSize(testLine, 9) > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        for (const line of lines) {
            ensurePage();
            page.drawText(line, { x: margin + 16, y, size: 9, font: fontItalic, color: rgb(0.4, 0.4, 0.4) });
            y -= 13;
        }
        y -= 6;
    };

    // Title
    drawText('ESTT Community', margin, { size: 26, f: fontBold, color: rgb(0.1, 0.1, 0.55) });
    y -= 2;
    drawText('Changelog  v1.27.3', margin, { size: 14, f: fontBold, color: rgb(0.3, 0.3, 0.3) });
    drawText('August 17, 2026', margin, { size: 9, f: fontItalic, color: rgb(0.5, 0.5, 0.5) });
    y -= 2;
    drawLine();

    // BUG FIXES
    drawText('BUG FIXES', margin, { size: 13, f: fontBold, color: rgb(0.85, 0.15, 0.15) });
    y -= 2;

    const fixes = [
        ['AI Agent Daily Limit Bypass for Premium Users',
         'ESTTPlus+ subscribers were incorrectly blocked after 2 free AI messages/day. The limit UI check and usage counter now correctly skip premium users.'],
        ['AI Agent Response Failure (Gemini API)',
         'The ESTT-AI agent returned a generic "technical difficulty" error for every message. Root cause: the Gemini chat history did not strictly alternate user/model roles. Added sanitization to enforce correct history format.'],
        ['Gemini History Format Error',
         'Gemini API rejects chat histories that do not start with "user" and alternate strictly. Added history sanitization loop that filters and corrects role ordering before each request.'],
        ['Deprecated AI Model (gemini-2.5-flash)',
         'Model gemini-2.5-flash was no longer available. Migrated to gemini-3.6-flash as recommended by Google.'],
        ['Next.js Config Warning: serverExternalPackages',
         'Invalid key "serverExternalPackages" at top level in next.config.js. Moved to "experimental.serverComponentsExternalPackages" for Next.js 14 compatibility.'],
        ['Environment Variable Not Loaded',
         '.env.local with GEMINI_API_KEY was created after the dev server started. Added startup logging to confirm key presence on server restart.'],
        ['Contact Page Footer Link Broken',
         'Footer "Contact" link pointed to a non-existent route. Fixed to /contact.'],
        ['Browse Page Filter State Lost on Navigation',
         'Filter selections (field, semester, module) reset when navigating away and back. Implemented module-level singleton variables to persist filter state across client-side navigation.'],
        ['Select Component Text Shift',
         'Long filiere names caused visual text shift in the Select dropdown. Changed [&>span]:line-clamp-1 to [&>span]:truncate to prevent layout jump.'],
        ['ChatBubble Inline Code Not Rendering',
         'react-markdown v10 removed the "inline" prop from the code component. Inline code (command names, keywords) rendered empty. Fixed by checking className instead.'],
        ['AI Agent: enrichResourcesWithText URL Bug',
         'PDF text extraction only checked res.file but resources store URLs in res.url. Now checks both fields.'],
    ];

    for (const [t, d] of fixes) drawItem(t, d);

    drawLine();

    // NEW FEATURES
    drawText('NEW FEATURES', margin, { size: 13, f: fontBold, color: rgb(0.1, 0.55, 0.3) });
    y -= 2;

    const features = [
        ['Ma Liste (Saved Resources)',
         'New dedicated page at /my-list where users can view, search, filter, and manage all their saved resources. Resources are grouped by module with semester badges. Includes "Retirer" and "Ouvrir" actions.'],
        ['Browse Page: Add to Ma Liste',
         'Cards on the browse page now have an "Ajouter a ma liste" button and an "Ouvrir" button. Professor info moved next to tags for a cleaner layout.'],
        ['Resource Detail: Favorite Toggle',
         'Resource detail pages show a ListPlus icon button to save/unsave resources. Favorites saved with extra metadata (moduleId, semester, professor). Real-time onValue listener reflects instant UI updates.'],
        ['Nav Item: Ma Liste',
         '"Ma Liste" added to the main navigation header (visible to logged-in users only).'],
        ['Contact Page',
         'New /contact page with a contact form, email sending functionality, and Firebase backup of submissions.'],
        ['ESTT-AI Agent: Gemini Migration',
         'Migrated ESTT-AI from Ollama Cloud to Google Gemini API. Initially used gemini-2.5-flash, later upgraded to gemini-3.6-flash after model deprecation. Single-shot generation with system instructions, user context injection, and RAG workflow.'],
        ['RAG Pipeline (Resource-Augmented Generation)',
         'When the AI detects a resource query, it searches the Firebase resource database, extracts text from PDFs server-side, injects the content as [RESOURCE DATA] context, and generates a grounded response.'],
        ['PDF Text Extraction (Server-Side)',
         'Server-side PDF text extraction using pdf-parse in the API route. Extracted text is injected into the Gemini prompt for RAG. pdf-parse excluded from client bundles.'],
        ['Discussion Shortcut Card (Messages Hub)',
         'Messages page shows an ESTT-Agent shortcut card with dynamic filiere abbreviation and semester badge. Clicking navigates directly to the AI chat.'],
        ['Chat Page: Back Navigation',
         'ArrowLeft button added to the chat header linking back to /messages. Empty state icon changed to PeopleIcon.'],
        ['AI Agent Display Rename',
         'ESTT-AI renamed to "ESTT-Agent" across the platform for clarity.'],
        ['Clear Chat Button (AI Agent)',
         'Trash icon button added next to the notification bell in the AI chat header. Clears all messages from Firebase, resets usage counter, and wipes local state. Only visible in the ESTT-Agent chat.'],
        ['Proactive Resource Search (AI Agent)',
         'Agent now automatically searches Firebase resources when students ask academic questions (e.g., "résume le cours de SQL", "je veux les cours du module DevOps"). Detects intent keywords, extracts search terms, fetches PDFs, and injects content into Gemini context — no manual RAG trigger needed.'],
    ];

    for (const [t, d] of features) drawItem(t, d);

    drawLine();

    // TWEAKS
    drawText('TWEAKS & IMPROVEMENTS', margin, { size: 13, f: fontBold, color: rgb(0.15, 0.45, 0.8) });
    y -= 2;

    const tweaks = [
        ['Profile Page: Removed Saved Resources Section',
         'The "Ressources enregistrees" section removed from the profile page since Ma Liste now serves this purpose.'],
        ['Browse Page: URL Params Removed',
         'Replaced useSearchParams/useRouter with window.history.replaceState for filter persistence. Removed unused imports to reduce bundle size.'],
        ['Browse Page: Condensed Select Items',
         'Select dropdown items in the browse page condensed to single-line display for a cleaner look.'],
        ['AI Usage Tracking: Premium Exempt',
         'Usage counter no longer increments for ESTTPlus+ subscribers. Daily limit UI completely hidden for premium users.'],
        ['Gemini History Sanitization',
         'Chat history sanitized before every API call to ensure strict user/model alternation, preventing API errors from malformed conversation histories.'],
        ['Error Logging Improved',
         'API route now logs whether the Gemini API key is present at startup, plus truncated stack traces on errors for easier debugging.'],
        ['Messages Page: Chat General Icon',
         'Changed the "Aller au chat general" button icon from Hash to PeopleIcon for visual consistency.'],
        ['AI Model Upgraded to gemini-3.6-flash',
         'Upgraded from gemini-2.0-flash to gemini-3.6-flash for improved response quality and latest features.'],
        ['Resource Page: Back Button Navigation',
         'Back button on resource detail page was hardcoded to /browse. Now uses router.back() to return to whatever page the user came from (AI chat, browse, etc.).'],
    ];

    for (const [t, d] of tweaks) drawItem(t, d);

    y -= 10;
    drawLine();
    y -= 2;
    drawText('ESTT Community  \u00B7  Built with Next.js, Firebase, Tailwind CSS, and Gemini AI', margin, { size: 8, f: fontItalic, color: rgb(0.6, 0.6, 0.6) });

    const pdfBytes = await doc.save();
    const outputPath = path.join('C:\\Users\\PC\\Desktop', 'ESTT-Community-Changelog-v1.27.3.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`PDF saved to: ${outputPath}`);
}

generateChangelog().catch(console.error);
