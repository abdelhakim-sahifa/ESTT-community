import { NextResponse } from 'next/server';
import {
    AI_MODELS,
    DEFAULT_AI_MODEL,
    ESTT_AI_SYSTEM_INSTRUCTION,
} from '@/lib/estt-ai';
import { searchResourcesAction } from '@/lib/resourceUtils';

export const dynamic = 'force-dynamic';

let TurndownService;
let mammoth;
try { TurndownService = require('turndown'); } catch (e) { console.warn('[ESTT-AI] turndown not available:', e.message); }
try { mammoth = require('mammoth'); } catch (e) { console.warn('[ESTT-AI] mammoth not available:', e.message); }

function extractAiResponse(text) {
    if (!text) return { reply: null, action: null };

    try {
        const allCodeBlocks = text.match(/```[\s\S]*?```/g) || [];
        for (const block of allCodeBlocks) {
            if (block.includes('"action"')) {
                const jsonMatch = block.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const actionData = JSON.parse(jsonMatch[0]);
                    const reply = text.replace(block, '').trim();
                    return {
                        reply: reply || actionData.message || null,
                        action: actionData,
                    };
                }
            }
        }

        const jsonMatch = text.match(/\{"action"\s*:\s*"[^"]+"[\s\S]*?\}/);
        if (jsonMatch) {
            const rawJson = jsonMatch[0];
            const actionData = JSON.parse(rawJson);
            let reply = text.replace(rawJson, '').trim();
            reply = reply.replace(/```\w*\s*```/g, '').trim();
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
        const buffer = Buffer.from(arrayBuffer);
        const data = await parse(buffer);
        return data?.text || null;
    } catch (error) {
        console.warn(`[ESTT-AI] PDF extraction failed for ${url}:`, error.message);
        return null;
    }
}

async function extractTextFromGDrive(url) {
    try {
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (!fileIdMatch) return null;
        const fileId = fileIdMatch[1];
        const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const response = await safeFetch(exportUrl, 10000);
        if (!response || !response.ok) return null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/pdf')) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const parse = require('pdf-parse/lib/pdf-parse.js');
            if (typeof parse !== 'function') return null;
            const data = await parse(buffer);
            return data?.text || null;
        }
        return await response.text();
    } catch (error) {
        console.warn(`[ESTT-AI] Google Drive extraction failed: ${error.message}`);
        return null;
    }
}

async function extractTextFromGDoc(url) {
    try {
        if (!url.includes('docs.google.com')) return null;
        const exportUrl = url.replace(/\/edit.*$/, '/export?format=txt');
        const response = await safeFetch(exportUrl, 10000);
        if (!response || !response.ok) return null;
        return await response.text();
    } catch (error) {
        console.warn(`[ESTT-AI] Google Docs extraction failed: ${error.message}`);
        return null;
    }
}

async function extractTextFromDocx(url) {
    try {
        if (!mammoth) return null;
        const response = await safeFetch(url, 10000);
        if (!response || !response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await mammoth.extractRawText({ buffer });
        return result?.value || null;
    } catch (error) {
        console.warn(`[ESTT-AI] Word document extraction failed: ${error.message}`);
        return null;
    }
}

function detectUrlType(url) {
    if (!url) return 'unknown';
    if (url.includes('drive.google.com')) {
        if (url.includes('/document/')) return 'gdoc';
        return 'gdrive-file';
    }
    if (url.includes('docs.google.com')) return 'gdoc';
    if (url.match(/\.pdf$/i)) return 'pdf';
    if (url.match(/\.(docx|doc)$/i)) return 'docx';
    if (url.match(/\.(pptx|ppt)$/i)) return 'powerpoint';
    if (url.match(/\.(xlsx|xls)$/i)) return 'excel';
    return 'unknown';
}

function extractRelevantSection(rawText, query, maxChars = 1500) {
    if (!rawText || !query) return rawText?.substring(0, maxChars) || '';

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const sentences = rawText.split(/[.!?]\s+/);
    const scored = sentences.map(sentence => {
        const lower = sentence.toLowerCase();
        const score = queryWords.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);
        return { sentence, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.filter(s => s.score > 0).slice(0, 10);
    if (top.length === 0) return rawText.substring(0, maxChars);

    const result = top.map(s => s.sentence).join('. ');
    return result.substring(0, maxChars);
}

async function enrichResourcesWithText(searchResults) {
    const MAX_RESOURCES = 3;
    const limited = searchResults.slice(0, MAX_RESOURCES);

    return Promise.all(
        limited.map(async (res) => {
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

const MAX_RESOURCE_TEXT_CHARS = 1500;
const MAX_TOTAL_CONTEXT_CHARS = 4000;

function buildResourceContext(searchResults, searchQuery = '') {
    if (!searchResults || searchResults.length === 0) return '';

    let totalChars = 0;
    const sections = [];

    for (const [i, res] of searchResults.entries()) {
        if (totalChars >= MAX_TOTAL_CONTEXT_CHARS) break;

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
            const relevantText = extractRelevantSection(res.rawText, searchQuery, MAX_RESOURCE_TEXT_CHARS);
            parts.push(`Content:\n${relevantText}`);
        }

        const section = parts.join('\n');
        const remaining = MAX_TOTAL_CONTEXT_CHARS - totalChars;
        sections.push(section.substring(0, remaining));
        totalChars += section.length;
    }

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

async function callGroq(messages, systemInstruction) {
    const allMessages = [];
    if (systemInstruction) {
        allMessages.push({ role: 'system', content: systemInstruction });
    }
    allMessages.push(...messages);

    const apiKey = process.env.GROQ_API_KEY;
    console.log(`🔍 [Groq] Calling model: ${DEFAULT_AI_MODEL}, messages: ${allMessages.length}, hasKey: ${!!apiKey}`);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: DEFAULT_AI_MODEL,
            messages: allMessages,
            max_tokens: 4096,
        }),
    });

    console.log(`🔍 [Groq] Response status: ${res.status}`);

    if (!res.ok) {
        const err = await res.text();
        console.error(`❌ [Groq] API error ${res.status}:`, err.substring(0, 500));
        throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    console.log(`🔍 [Groq] Response keys: ${Object.keys(data).join(', ')}`);

    try {
        if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message && choice.message.content) {
                return choice.message.content;
            }
        }
        console.error('❌ [Groq] Unexpected response format:', JSON.stringify(data).substring(0, 500));
        throw new Error('Unexpected response format from Groq API');
    } catch (parseErr) {
        console.error('❌ [Groq] Parse error:', parseErr.message);
        throw parseErr;
    }
}

function toOpenAIMessages(history) {
    const messages = [];
    for (const item of history) {
        const text = item.parts?.[0]?.text || item.content || item.text || '';
        if (!text) continue;
        const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
        messages.push({ role, content: text });
    }
    return messages;
}

async function rewriteQueryWithLLM(message, history) {
    const historyContext = history.slice(-4)
        .map(msg => `${msg.role === 'model' ? 'AI' : 'User'}: ${msg.parts?.[0]?.text || ''}`)
        .join('\n');

    const prompt = `You are a search query rewriter for an educational platform (ESTT).
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

User message: "${message}"`;

    const messages = [{ role: 'user', content: prompt }];
    const text = await callGroq(messages);
    return sanitizeQuery(text);
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
    /règles?/i, /regles?/i, /comment (faire|calculer|résoudre|fonctionne|marche|créer|implémenter|écrire|programmer)/i, /pourquoi/i, /diff[eé]rence/i,
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

                const prompt = `${context}\n\nTexte extrait :\n${extractedText.substring(0, 30000)}`;
                const messages = [{ role: 'user', content: prompt }];
                const aiText = await callGroq(messages);
                const { action } = extractAiResponse(aiText);

                return NextResponse.json({
                    action,
                    reply: aiText,
                    model: DEFAULT_AI_MODEL,
                });
            }
        } else {
            const body = await request.json();
            message = body.message;
            history = body.history || [];
            userProfile = body.userProfile || null;
            purpose = body.purpose || 'chat';

            if (purpose === 'pdf-analysis') {
                const messages = [{ role: 'user', content: message }];
                const aiText = await callGroq(messages);
                const { action } = extractAiResponse(aiText);

                return NextResponse.json({
                    action,
                    reply: aiText,
                    model: DEFAULT_AI_MODEL,
                });
            }
        }

        const baseInstruction = ESTT_AI_SYSTEM_INSTRUCTION;

        const userContext = [
            userProfile?.firstName ? `First name: ${userProfile.firstName}` : null,
            userProfile?.lastName ? `Last name: ${userProfile.lastName}` : null,
            userProfile?.filiere ? `Field: ${userProfile.filiere}` : null,
        ].filter(Boolean).join('\n');

        const systemInstruction = userContext
            ? `${baseInstruction}\n\nCurrent user context:\n${userContext}`
            : baseInstruction;

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

        // Ensure history alternates strictly
        const sanitizedHistory = [];
        let expectedRole = 'user';
        for (const item of chatHistory) {
            if (item.role === expectedRole) {
                sanitizedHistory.push(item);
                expectedRole = expectedRole === 'user' ? 'model' : 'user';
            }
        }

        // Limit history for Groq (keep context tight)
        const limitedHistory = sanitizedHistory.slice(-6);

        console.log(`📋 [ESTT-AI] Model: ${DEFAULT_AI_MODEL}, History: ${limitedHistory.length} messages (from ${sanitizedHistory.length} total), Groq key: ${!!process.env.GROQ_API_KEY}`);

        const userMessage = message?.trim() || '';

        // Allow greetings to pass through without search
        const isGreeting = /^(bonjour|salut|hello|hi|hey|merci|ok|oui|non|au revoir|goodbye|bye|cc|slt|bonsoir)/i.test(userMessage.trim());

        // Detect intent for RAG mode (summarize/find/general)
        const { isAcademic, intent } = detectAcademicIntent(userMessage);
        let forcedResourceContext = '';

        if (!isGreeting && isAcademic) {
            // Search for resources only for academic queries
            let rewrittenQuery = '';
            try {
                rewrittenQuery = await rewriteQueryWithLLM(userMessage, limitedHistory);
            } catch (e) {
                console.warn(`[ESTT-AI] Query rewrite failed: ${e.message}`);
            }

            let results = [];

            if (rewrittenQuery && rewrittenQuery !== 'NONE') {
                console.log(`🧠 [ESTT-AI] Query rewrite: "${rewrittenQuery}"`);
                results = await searchResourcesAction(rewrittenQuery, userProfile?.filiere);
            }

            // Fallback without filiere
            if (results.length === 0 && rewrittenQuery && rewrittenQuery !== 'NONE') {
                results = await searchResourcesAction(rewrittenQuery, null);
            }

            // Fallback with raw query
            if (results.length === 0) {
                const rawQuery = userMessage.substring(0, 100);
                results = await searchResourcesAction(rawQuery, userProfile?.filiere);
            }

            // Enrich + build context (truncated for Groq's TPM limit)
            if (results.length > 0) {
                const enriched = await enrichResourcesWithText(results);
                forcedResourceContext = buildResourceContext(enriched, rewrittenQuery || userMessage);
                console.log(`📥 [ESTT-AI] Found ${results.length} resources, context: ${forcedResourceContext.length} chars`);
            }
        }

        // Build final system instruction with resource context
        let finalSystemInstruction = systemInstruction;
        if (forcedResourceContext) {
            const intentLabel = intent === 'summarize' ? 'SUMMARY' : intent === 'find' ? 'FIND' : 'RAG';
            const isFind = intent === 'find';
            const resourceInstruction = `You have [RESOURCE DATA] from the platform.

Mode: ${intentLabel}.
${isFind ? `- List ALL resources from [RESOURCE DATA] by their Title, Module, Professor, and Type. Always list them even if the content excerpt is short.
- The JSON action at the end MUST include ALL resource IDs from [RESOURCE DATA].` : intent === 'summarize' ? '- Summarize the key points from the content.' : '- Extract the answer from the content.'}
- NEVER fabricate. Only use what is in [RESOURCE DATA].
- If [RESOURCE DATA] is truly empty, say: "Aucune ressource trouvée. Consultez /browse pour explorer les ressources disponibles."
- Use plain Markdown.
- End with JSON (NOT inside code fences): {"action": "display_resources", "resource_ids": ["id1"]}`;
            finalSystemInstruction = `${systemInstruction}\n\n## RETRIEVED RESOURCES\n${resourceInstruction}\n\n[RESOURCE DATA]\n${forcedResourceContext}\n[END RESOURCE DATA]`;
        }

        console.log(`🤖 [ESTT-AI] Sending to Groq...`);
        const messages = toOpenAIMessages(limitedHistory);
        messages.push({ role: 'user', content: userMessage });
        const aiText = await callGroq(messages, finalSystemInstruction);
        const { reply, action } = extractAiResponse(aiText);

        // RAG pipeline: if model wants to read more resources
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
                    `\nBased on the resources above, recommend 2-3 of the most relevant ones.`,
                    `Return your response with a JSON action block:`,
                    `{"action": "display_resources", "resource_ids": ["id1", "id2"]}`,
                    `Keep your human response helpful and concise.`,
                ].join('\n\n');

                const ragMessages = [
                    ...toOpenAIMessages(limitedHistory),
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: aiText },
                    { role: 'user', content: ragPrompt },
                ];

                const ragText = await callGroq(ragMessages, finalSystemInstruction);
                const final = extractAiResponse(ragText);

                console.log('✅ [ESTT-AI] RAG Pipeline COMPLETE');
                return NextResponse.json({
                    reply: final.reply || reply,
                    action: final.action,
                    interimReply: reply,
                    model: DEFAULT_AI_MODEL,
                });
            }
        }

        console.log('✅ [ESTT-AI] Single-turn COMPLETE');
        return NextResponse.json({
            reply,
            action,
            model: DEFAULT_AI_MODEL,
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
