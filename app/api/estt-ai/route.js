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

function sanitizeQuery(text) {
    if (!text) return '';
    return text
        .replace(/^["'`]+|["'`]+$/g, '')
        .replace(/^```[\s\S]*?\n?/gm, '')
        .replace(/\n/g, ' ')
        .trim();
}

async function rewriteQueryWithGemini(message, history) {
    const historyContext = history.slice(-4)
        .map(msg => `${msg.role === 'model' ? 'AI' : 'User'}: ${msg.parts?.[0]?.text || ''}`)
        .join('\n');

    const model = genAI.getGenerativeModel({ model: ESTT_AI_MODEL });
    const result = await model.generateContent(
        `You are a search query rewriter for an educational platform (ESTT).
Rewrite the user's message into search-friendly keywords in French.

RULES:
- Return ONLY keywords separated by spaces, nothing else
- Use the conversation history for context if the user's message refers to something earlier
- If the message is just a greeting or not academic, return ONLY the word: NONE
- Keep it short: 2-6 keywords max
- Focus on: subject names, topics, document types (cours, td, tp, examen)
- Use terms that would appear in resource/module titles on an educational platform
- Do NOT include filler words like "quel", "est", "le", "la", "des", "dans", "je", "veux"
- Example: "quel est le syntaxe des boucles dans C" → "langage C boucles"

${historyContext ? `Conversation history:\n${historyContext}` : ''}

User message: "${message}"`
    );
    return sanitizeQuery(result.response.text());
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
    if (!message) return { isAcademic: false, intent: 'chat' };

    const matched = ACADEMIC_INTENT_PATTERNS.some(p => p.test(message));
    if (!matched) return { isAcademic: false, intent: 'chat' };

    const isSummary = /r[eé]sume|sommaire|synth[eè]se|récapitulatif|summary|summarize/i.test(message);
    const isFind = /je veux|je cherche|donne|montre|affiche|liste|trouve|t[eé]l[eé]charge|cherche/i.test(message);

    let intent = 'general';
    if (isSummary) intent = 'summarize';
    else if (isFind) intent = 'find';

    return { isAcademic: true, intent };
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
        const { isAcademic, intent } = detectAcademicIntent(userMessage);
        let forcedResourceContext = '';

        if (isAcademic) {
            // Step 1: Gemini rewrites query (decides on its own whether to use history)
            let rewrittenQuery = '';
            try {
                rewrittenQuery = await rewriteQueryWithGemini(userMessage, sanitizedHistory);
            } catch (e) {
                console.warn(`[ESTT-AI] Gemini rewrite failed: ${e.message}`);
            }

            let results = [];

            // Step 2: Search with rewritten query + filiere
            if (rewrittenQuery && rewrittenQuery !== 'NONE') {
                console.log(`🧠 [ESTT-AI] Gemini rewrite: "${rewrittenQuery}"`);
                results = await searchResourcesAction(rewrittenQuery, userProfile?.filiere);
            }

            // Step 3: GUARDRAIL — fallback without filiere
            if (results.length === 0 && rewrittenQuery && rewrittenQuery !== 'NONE') {
                results = await searchResourcesAction(rewrittenQuery, null);
            }

            // Step 4: GUARDRAIL — raw query fallback
            if (results.length === 0) {
                const rawQuery = userMessage.substring(0, 100);
                results = await searchResourcesAction(rawQuery, userProfile?.filiere);
            }

            // Step 5: Enrich + build context
            if (results.length > 0) {
                const enriched = await enrichResourcesWithText(results);
                forcedResourceContext = buildResourceContext(enriched, rewrittenQuery || userMessage);
                console.log(`📥 [ESTT-AI] Found ${results.length} resources`);
            }
        }

        // Build final system instruction with resource context
        let finalSystemInstruction = systemInstruction;
        if (forcedResourceContext) {
            const intentLabel = intent === 'summarize' ? 'SUMMARY' : intent === 'find' ? 'FIND' : 'RAG';
            const resourceInstruction = `The user is asking about academic content. Mode: ${intentLabel}.
Use the [RESOURCE DATA] below to provide an informed answer.
${intent === 'summarize' ? 'Summarize the key points from the content. You may suggest consulting the full document.' : intent === 'find' ? 'Recommend the most relevant resources and briefly explain what each covers.' : 'Extract the answer DIRECTLY from the provided content. Present it clearly with examples/code if applicable. Do NOT just say "consult the document" — answer first, then suggest the resource for more details.'}
Always include a JSON action block at the end (NOT inside code fences, just raw JSON):
{"action": "display_resources", "resource_ids": ["id1", "id2", "..."]}`;
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
