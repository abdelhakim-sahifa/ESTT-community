import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    ESTT_AI_MODEL,
    ESTT_AI_SYSTEM_INSTRUCTION,
} from '@/lib/estt-ai';
import { searchResourcesAction } from '@/lib/resourceUtils';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let TurndownService;
let mammoth;
try { TurndownService = require('turndown'); } catch (e) { console.warn('[ESTT-AI] turndown not available:', e.message); }
try { mammoth = require('mammoth'); } catch (e) { console.warn('[ESTT-AI] mammoth not available:', e.message); }

function extractAiResponse(text) {
    if (!text) return { reply: null, action: null };

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const rawJson = jsonMatch[0];
            const actionData = JSON.parse(rawJson);
            let reply = text.replace(rawJson, '').trim();
            // Strip orphaned code fences left after JSON removal (```json\n\n```)
            reply = reply.replace(/```\w*\s*```/g, '').trim();
            reply = reply.replace(/^```+\s*$/gm, '').trim();

            return {
                reply: reply || actionData.message || null,
                action: actionData,
            };
        }
    } catch (e) {
        console.warn('[ESTT-AI] Malformed JSON in response, treating as plain text.');
    }

    return { reply: text, action: null };
}

async function extractTextFromServer(file) {
    try {
        const parse = require('pdf-parse/lib/pdf-parse.js');
        if (typeof parse !== 'function') {
            throw new Error('pdf-parse core is not a function');
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await parse(buffer);

        if (!data || !data.text) return null;
        return data.text;
    } catch (error) {
        console.error('[ESTT-AI] PDF extraction failed:', error.message);
        throw error;
    }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function safeFetch(url, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        if (contentLength > MAX_FILE_SIZE) {
            console.warn(`[ESTT-AI] File too large (${(contentLength / 1024 / 1024).toFixed(1)}MB): ${url}`);
            return null;
        }
        return response;
    } finally {
        clearTimeout(timer);
    }
}

async function extractTextFromPdfUrl(url) {
    try {
        const parse = require('pdf-parse/lib/pdf-parse.js');
        if (typeof parse !== 'function') return null;

        const response = await safeFetch(url, 10000);
        if (!response || !response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_FILE_SIZE) return null;

        const buffer = Buffer.from(arrayBuffer);
        const data = await parse(buffer);

        if (!data || !data.text) return null;
        return data.text.substring(0, 15000);
    } catch (error) {
        console.warn(`[ESTT-AI] Failed to extract text from ${url}:`, error.message);
        return null;
    }
}

function detectUrlType(url) {
    if (!url) return 'unknown';
    if (url.endsWith('.pdf')) return 'pdf';
    if (url.includes('docs.google.com/document')) return 'gdoc';
    if (url.includes('drive.google.com/file')) return 'gdrive-file';
    if (url.includes('drive.google.com/drive') || url.includes('drive.google.com/folder')) return 'gdrive-folder';
    if (url.endsWith('.docx') || url.includes('.docx?')) return 'docx';
    return 'unknown';
}

function extractRelevantSection(text, query, maxLength = 15000) {
    if (!text || !query) return text?.substring(0, maxLength) || '';
    if (text.length <= maxLength) return text;

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return text.substring(0, maxLength);

    // Split text into paragraphs/sections
    const sections = text.split(/\n\s*\n/);

    // Score each section by keyword matches
    const scored = sections.map((section, idx) => {
        const lower = section.toLowerCase();
        const score = queryWords.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0);
        return { section, score, idx };
    });

    // Sort by score (descending), take top sections that fit within maxLength
    scored.sort((a, b) => b.score - a.score);

    let result = '';
    for (const { section } of scored) {
        if (result.length + section.length + 2 > maxLength) break;
        result += section.trim() + '\n\n';
    }

    // If no sections matched, fallback to beginning of text
    if (!result.trim()) {
        return text.substring(0, maxLength);
    }

    return result.trim();
}

function htmlToMarkdown(html) {
    try {
        if (!TurndownService) return null;
        const turndown = new TurndownService({
            headingStyle: 'atx',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
        });
        return turndown.turndown(html).substring(0, 15000);
    } catch (error) {
        console.warn('[ESTT-AI] HTML to Markdown conversion failed:', error.message);
        return null;
    }
}

async function extractTextFromGDrive(url) {
    try {
        const match = url.match(/\/file\/d\/([^/]+)/);
        if (!match) return null;

        const fileId = match[1];
        const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        const response = await safeFetch(exportUrl, 15000);
        if (!response || !response.ok) return null;

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_FILE_SIZE) return null;

        const buffer = Buffer.from(arrayBuffer);

        // If it's a PDF, extract text with pdf-parse
        if (contentType.includes('pdf') || buffer[0] === 0x25) { // %PDF magic bytes
            try {
                const parse = require('pdf-parse/lib/pdf-parse.js');
                if (typeof parse === 'function') {
                    const data = await parse(buffer);
                    if (data?.text) return data.text.substring(0, 15000);
                }
            } catch {}
        }

        // If it's HTML, convert to Markdown
        if (contentType.includes('text/html') || contentType.includes('html')) {
            const html = new TextDecoder().decode(arrayBuffer);
            const md = htmlToMarkdown(html);
            if (md) return md;
        }

        // Fallback: try as plain text
        const text = new TextDecoder().decode(buffer);
        if (text.length > 100 && !contentType.includes('application/json')) {
            return text.substring(0, 15000);
        }

        return null;
    } catch (error) {
        console.warn(`[ESTT-AI] Google Drive extraction failed: ${error.message}`);
        return null;
    }
}

async function extractTextFromGDoc(url) {
    try {
        const match = url.match(/\/document\/d\/([^/]+)/);
        if (!match) return null;

        const docId = match[1];
        const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;

        const response = await safeFetch(exportUrl, 15000);
        if (!response || !response.ok) return null;

        const html = await response.text();
        if (!html || html.length < 50) return null;

        const md = htmlToMarkdown(html);
        return md || null;
    } catch (error) {
        console.warn(`[ESTT-AI] Google Docs extraction failed: ${error.message}`);
        return null;
    }
}

async function extractTextFromDocx(url) {
    try {
        if (!mammoth) return null;
        const response = await safeFetch(url, 15000);
        if (!response || !response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_FILE_SIZE) return null;

        // Try HTML output first (preserves structure)
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        if (htmlResult?.value && htmlResult.value.length > 50) {
            const md = htmlToMarkdown(htmlResult.value);
            if (md) return md;
        }

        // Fallback to plain text
        const textResult = await mammoth.extractRawText({ arrayBuffer });
        if (textResult?.value) return textResult.value.substring(0, 15000);

        return null;
    } catch (error) {
        console.warn(`[ESTT-AI] Word document extraction failed: ${error.message}`);
        return null;
    }
}

async function enrichResourcesWithText(searchResults) {
    return Promise.all(
        searchResults.map(async (res) => {
            try {
                let rawText = null;
                const url = res.file || res.url;
                if (!url) return { ...res, rawText };

                const type = detectUrlType(url);

                switch (type) {
                    case 'pdf':
                        rawText = await extractTextFromPdfUrl(url);
                        break;
                    case 'gdrive-file':
                        rawText = await extractTextFromGDrive(url);
                        break;
                    case 'gdoc':
                        rawText = await extractTextFromGDoc(url);
                        break;
                    case 'docx':
                        rawText = await extractTextFromDocx(url);
                        break;
                    default:
                        console.log(`[ESTT-AI] Unsupported URL type for: ${url}`);
                        break;
                }

                return { ...res, rawText };
            } catch (e) {
                console.warn(`[ESTT-AI] Extraction failed for resource ${res.id}: ${e.message}`);
                return { ...res, rawText: null };
            }
        })
    );
}

function buildResourceContext(searchResults, searchQuery = '') {
    if (!searchResults || searchResults.length === 0) return '';

    const sections = searchResults.map((res, i) => {
        const parts = [
            `[${i + 1}] ID: ${res.id}`,
            `Title: ${res.title}`,
            `Module: ${res.module || 'N/A'}`,
            `Professor: ${res.professor || 'N/A'}`,
            `Type: ${res.docType || res.type || 'N/A'}`,
        ];

        if (res.description) parts.push(`Description: ${res.description}`);
        if (res.file) parts.push(`File URL: ${res.file}`);
        if (res.url) parts.push(`Link: ${res.url}`);
        if (res.rawText) {
            const relevantText = extractRelevantSection(res.rawText, searchQuery);
            parts.push(`Content:\n${relevantText}`);
        }

        return parts.join('\n');
    });

    return sections.join('\n\n---\n\n');
}

const ACADEMIC_INTENT_PATTERNS = [
    /r[eé]sume/i, /sommaire/i, /r[eé]capitulatif/i, /synth[iè]se/i,
    /cours/i, /module/i, /mati[eè]re/i, /chapitre/i, /leçon/i,
    /td\b/i, /tp\b/i, /exam/i, /exercice/i,
    /professeur/i, /prof\b/i,
    /je veux/i, /je cherche/i, /je voudrais/i, /donne[ -]moi/i,
    /montre[ -]moi/i, /affiche/i, /liste des/i, /trouve/i,
    /t[ée]l[ée]charge/i, /pdf/i, /document/i,
    /cours du module/i, /cours de/i, /td de/i, /tp de/i, /exam de/i, /examen de/i,
    /resume/i, /summary/i, /summarize/i,
    /syntaxe/i, /quel/i, /quelle/i, /explique/i, /d[eé]finition/i,
    /règles?/i, /regles?/i, /comment/i, /pourquoi/i, /diff[eé]rence/i,
    /compare/i, /comparaison/i, /exemple/i, /application/i,
    /sql/i, /select/i, /where/i, /insert/i, /update/i, /delete/i,
    /mcd/i, /mld/i, /relation/i, /table/i, /base de donn[eé]es/i,
    /algorithme/i, /programmation/i, /fonction/i, /variable/i,
    /math/i, /physique/i, /chimie/i, /informatique/i,
];

function detectAcademicIntent(message) {
    if (!message) return { isAcademic: false, searchQuery: '', intent: 'chat' };

    const matched = ACADEMIC_INTENT_PATTERNS.some(p => p.test(message));
    if (!matched) return { isAcademic: false, searchQuery: '', intent: 'chat' };

    const isSummary = /r[eé]sume|sommaire|synth[eè]se|récapitulatif|summary|summarize/i.test(message);
    const isFind = /je veux|je cherche|donne|montre|affiche|liste|trouve|t[eé]l[eé]charge|cherche/i.test(message);

    let intent = 'general';
    if (isSummary) intent = 'summarize';
    else if (isFind) intent = 'find';

    // Extract search keywords: remove filler words and common French stopwords
    const stopwords = /^(je|veux|les|le|la|l[e']|un|une|des|du|de|d[e']|sur|pour|avec|et|que|qui|est|sont|a|au|aux|en|y|ça|mon|ma|mes|son|sa|ses|notre|votre|leur|leurs|tout|tous|toute|toutes|plus|moins|très|bien|bon|mauvais|nouveau|nouvelle|ancien|ancienne|premier|première|dernier|dernière|autre|autres|même|mêmes|quel|quelle|quels|quelles|comment|pourquoi|quand|où|combien|r[eé]sume|sommaire|synth[eè]se|récapitulatif|cours|module|mati[eè]re|chapitre|leçon|td|tp|exam|exercice|professeur|prof|donne|montre|affiche|liste|trouve|t[eé]l[eé]charge|cherche|pdf|document|je|veux|les|du|de|d[e']|le|la|l[e']|un|une|des|au|aux|en|y|sur|pour|avec|et|que|qui|a|mon|ma|son|sa|notre|votre|leur|leurs|ce|cette|ces|celui|ceux|qui|quoi|où|comment|pourquoi|quand|combien|sont|est|fait|faire|avoir|être|pas|ne|pas|oui|non|très|trop|peu|bien|mal|mal|nouveau|nouvelle|ancien|ancienne|autre|autres|premier|première|dernier|dernière|même|mêmes|tel|telle|tels|telles|quel|quelle|quels|quelles|sera|serait|seront|seraient|peut|pourrait|pourraient|doit|devrait|devraient|faut|fais|fait|font|ai|as|avons|avez|ont|suis|es|sommes|êtes|sont)$/i;

    const words = message
        .replace(/[?!.,;:()]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1 && !stopwords.test(w));

    const searchQuery = words.join(' ').trim();

    return { isAcademic: true, searchQuery, intent };
}

export async function POST(request) {
    console.log('🚀 [ESTT-AI] POST request received');
    try {
        let message, history = [], userProfile = null, purpose = 'chat';

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            purpose = formData.get('purpose');
            const file = formData.get('file');
            const context = formData.get('context');

            if (purpose === 'pdf-analysis' && file) {
                console.log('🤖 [ESTT-AI] Processing PDF analysis:', file.name);
                const extractedText = await extractTextFromServer(file);
                if (!extractedText) throw new Error('No text extracted from PDF');

                const model = genAI.getGenerativeModel({ model: ESTT_AI_MODEL });
                const result = await model.generateContent(
                    `${context}\n\nTexte extrait :\n${extractedText.substring(0, 30000)}`
                );
                const aiText = result.response.text();
                const { action } = extractAiResponse(aiText);

                return NextResponse.json({
                    action,
                    reply: aiText,
                    model: ESTT_AI_MODEL,
                });
            }
        } else {
            const body = await request.json();
            message = body.message;
            history = body.history || [];
            userProfile = body.userProfile || null;
            purpose = body.purpose || 'chat';

            if (purpose === 'pdf-analysis') {
                const model = genAI.getGenerativeModel({ model: ESTT_AI_MODEL });
                const result = await model.generateContent(message);
                const aiText = result.response.text();
                const { action } = extractAiResponse(aiText);

                return NextResponse.json({
                    action,
                    reply: aiText,
                    model: ESTT_AI_MODEL,
                });
            }
        }

        const userContext = [
            userProfile?.firstName ? `First name: ${userProfile.firstName}` : null,
            userProfile?.lastName ? `Last name: ${userProfile.lastName}` : null,
            userProfile?.filiere ? `Field: ${userProfile.filiere}` : null,
        ].filter(Boolean).join('\n');

        const systemInstruction = userContext
            ? `${ESTT_AI_SYSTEM_INSTRUCTION}\n\nCurrent user context:\n${userContext}`
            : ESTT_AI_SYSTEM_INSTRUCTION;

        const formattedHistory = Array.isArray(history)
            ? history
                .filter((item) => item && (item.parts || item.content || item.text))
                .slice(-12)
                .map((item) => {
                    if (item.parts) return item;
                    return {
                        role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
                        parts: [{ text: item.content || item.text || '' }],
                    };
                })
            : [];

        const chatHistory = formattedHistory.map((item) => ({
            role: item.role === 'model' ? 'model' : 'user',
            parts: item.parts,
        }));

        // Gemini requires history to start with 'user' and alternate strictly
        const sanitizedHistory = [];
        let expectedRole = 'user';
        for (const item of chatHistory) {
            if (item.role === expectedRole) {
                sanitizedHistory.push(item);
                expectedRole = expectedRole === 'user' ? 'model' : 'user';
            }
        }

        console.log(`📋 [ESTT-AI] History: ${sanitizedHistory.length} messages, API key present: ${!!process.env.GEMINI_API_KEY}`);

        const userMessage = message?.trim() || '';

        // Detect academic intent — only search for academic queries
        const { isAcademic, searchQuery, intent } = detectAcademicIntent(userMessage);
        let forcedResourceContext = '';

        if (isAcademic && searchQuery) {
            console.log(`🎓 [ESTT-AI] Academic intent detected. Searching for "${searchQuery}"...`);

            // Proactive: if short query + conversation history, rewrite query before searching
            let finalSearchQuery = searchQuery;
            const queryWords = searchQuery.split(/\s+/).filter(w => w.length > 2);
            if (queryWords.length <= 2 && sanitizedHistory.length > 0) {
                try {
                    const historyContext = sanitizedHistory
                        .slice(-4)
                        .map(msg => `${msg.role === 'model' ? 'AI' : 'User'}: ${msg.parts?.[0]?.text || ''}`)
                        .join('\n');

                    const contextModel = genAI.getGenerativeModel({ model: ESTT_AI_MODEL });
                    const contextResult = await contextModel.generateContent(
                        `Based on this conversation, extract search keywords for finding relevant resources. Return ONLY keywords in French, separated by spaces. No sentences, no explanation.\n\n${historyContext}\n\nUser: "${userMessage}"`
                    );
                    const contextQuery = contextResult.response.text().trim();
                    if (contextQuery && contextQuery.length > 3) {
                        finalSearchQuery = contextQuery;
                        console.log(`🧠 [ESTT-AI] Proactive rewrite: "${contextQuery}"`);
                    }
                } catch (e) {
                    console.warn(`[ESTT-AI] Proactive rewrite failed, using original: ${e.message}`);
                }
            }

            let forcedResults = await searchResourcesAction(finalSearchQuery, userProfile?.filiere);

            if (forcedResults.length > 0) {
                const enriched = await enrichResourcesWithText(forcedResults);
                forcedResourceContext = buildResourceContext(enriched, finalSearchQuery);
                console.log(`📥 [ESTT-AI] Found ${forcedResults.length} resources`);
            } else {
                // Try each word individually for broader matching
                const words = finalSearchQuery.split(/\s+/).filter(w => w.length > 2);
                for (const word of words) {
                    const wordResults = await searchResourcesAction(word, userProfile?.filiere);
                    if (wordResults.length > 0) {
                        const enriched = await enrichResourcesWithText(wordResults);
                        forcedResourceContext = buildResourceContext(enriched, word);
                        console.log(`📥 [ESTT-AI] Found ${wordResults.length} resources via word "${word}"`);
                        break;
                    }
                }
            }
        }

        // Build final system instruction with resource context
        let finalSystemInstruction = systemInstruction;
        if (forcedResourceContext) {
            const resourceInstruction = `The user is asking about academic content. Use the [RESOURCE DATA] below to provide an informed answer. Answer ONLY from the provided resources — do NOT use your own training knowledge. Recommend 2-5 relevant resources using: {"action":"display_resources","resource_ids":["id1","id2"]}`;
            finalSystemInstruction = `${systemInstruction}\n\n## RETRIEVED RESOURCES\n${resourceInstruction}\n\n[RESOURCE DATA]\n${forcedResourceContext}\n[END RESOURCE DATA]`;
        } else if (isAcademic) {
            // Academic intent but no resources found — strict resources-only
            const noResourceInstruction = `No resources were found on the platform for the user's request. You MUST respond with: "Je n'ai pas trouvé de ressources correspondantes sur la plateforme pour cette demande. Essayez de consulter la page Ressources pour trouver ce que vous cherchez." Do NOT answer from your own training knowledge.`;
            finalSystemInstruction = `${systemInstruction}\n\n## NO RESOURCES FOUND\n${noResourceInstruction}`;
        }

        const model = genAI.getGenerativeModel({
            model: ESTT_AI_MODEL,
            systemInstruction: finalSystemInstruction,
        });

        const chat = model.startChat({ history: sanitizedHistory });

        console.log('🤖 [ESTT-AI] Sending to Gemini...');
        const result = await chat.sendMessage(userMessage);
        const aiText = result.response.text();
        const { reply, action } = extractAiResponse(aiText);

        if (action?.action === 'read' && action?.target === 'resources') {
            console.log(`📡 [ESTT-AI] RAG: Searching for "${action.query}"`);
            const searchResults = await searchResourcesAction(action.query, userProfile?.filiere);

            if (searchResults.length > 0) {
                console.log(`📥 [ESTT-AI] Found ${searchResults.length} resources. Extracting text & injecting...`);
                const enriched = await enrichResourcesWithText(searchResults);
                const resourceContext = buildResourceContext(enriched, action.query);

                const ragPrompt = [
                    `[RESOURCE DATA]\nThe user asked: "${userMessage}"`,
                    `We found ${searchResults.length} relevant resources:`,
                    resourceContext,
                    `\n[END RESOURCE DATA]`,
                    `\nBased on the resources above, recommend 2-5 of the most relevant ones.`,
                    `Return your response with a JSON action block:`,
                    `{"action": "display_resources", "resource_ids": ["id1", "id2", "..."]}`,
                    `Keep your human response helpful and concise. Do not expose raw data or JSON to the user.`,
                ].join('\n\n');

                const ragResult = await chat.sendMessage(ragPrompt);
                const ragText = ragResult.response.text();
                const final = extractAiResponse(ragText);

                console.log('✅ [ESTT-AI] RAG Pipeline COMPLETE');
                return NextResponse.json({
                    reply: final.reply || reply,
                    action: final.action,
                    interimReply: reply,
                    model: ESTT_AI_MODEL,
                });
            }
        }

        console.log('✅ [ESTT-AI] Single-turn COMPLETE');
        return NextResponse.json({
            reply,
            action,
            model: ESTT_AI_MODEL,
        });

    } catch (error) {
        console.error('❌ ESTT-AI Route Error:', error?.message || error);
        if (error?.stack) console.error(error.stack.split('\n').slice(0, 5).join('\n'));

        const errorMessage = error.message || 'An unexpected error occurred in the AI assistant.';
        const status = error.status || 500;

        return NextResponse.json({
            error: errorMessage,
            details: error.name !== 'Error' ? error.name : undefined,
            code: error.code,
        }, { status });
    }
}
