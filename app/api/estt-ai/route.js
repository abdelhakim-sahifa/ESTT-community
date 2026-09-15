import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    AI_MODELS,
    DEFAULT_AI_MODEL,
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
        // First: find action JSON inside code blocks and strip the entire block
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

        // Second: try bare JSON (not in code block)
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

function getReasoningEffort(message, isAcademic, provider) {
    return undefined;
}

async function callGroq(modelId, messages, systemInstruction) {
    const allMessages = [];
    if (systemInstruction) {
        allMessages.push({ role: 'system', content: systemInstruction });
    }
    allMessages.push(...messages);

    const apiKey = process.env.GROQ_API_KEY;
    console.log(`🔍 [Groq] Calling model: ${modelId}, messages: ${allMessages.length}, hasKey: ${!!apiKey}`);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelId,
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

async function callLLM({ modelId, history, userMessage, systemInstruction, reasoningEffort }) {
    const modelConfig = AI_MODELS[modelId];
    if (!modelConfig) throw new Error(`Unknown model: ${modelId}`);

    if (modelConfig.provider === 'groq') {
        const messages = toOpenAIMessages(history);
        messages.push({ role: 'user', content: userMessage });
        return await callGroq(modelId, messages, systemInstruction);
    }

    // Default: Gemini
    const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction,
    });
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
}

async function callLLMSimple({ modelId, prompt, systemInstruction }) {
    const modelConfig = AI_MODELS[modelId];
    if (!modelConfig) throw new Error(`Unknown model: ${modelId}`);

    if (modelConfig.provider === 'groq') {
        const messages = [{ role: 'user', content: prompt }];
        return await callGroq(modelId, messages, systemInstruction);
    }

    // Default: Gemini
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function rewriteQueryWithLLM(message, history, modelId) {
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

    const text = await callLLMSimple({ modelId, prompt });
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
        let message, history = [], userProfile = null, purpose = 'chat', selectedModel = DEFAULT_AI_MODEL;

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

                const aiText = await callLLMSimple({
                    modelId: selectedModel,
                    prompt: `${context}\n\nTexte extrait :\n${extractedText.substring(0, 30000)}`,
                });
                const { action } = extractAiResponse(aiText);

                return NextResponse.json({
                    action,
                    reply: aiText,
                    model: selectedModel,
                });
            }
        } else {
            const body = await request.json();
            message = body.message;
            history = body.history || [];
            userProfile = body.userProfile || null;
            purpose = body.purpose || 'chat';
            selectedModel = body.model || DEFAULT_AI_MODEL;

            if (purpose === 'pdf-analysis') {
                const aiText = await callLLMSimple({
                    modelId: selectedModel,
                    prompt: message,
                });
                const { action } = extractAiResponse(aiText);

                return NextResponse.json({
                    action,
                    reply: aiText,
                    model: selectedModel,
                });
            }
        }

        const modelConfig = AI_MODELS[selectedModel];
        const baseInstruction = modelConfig?.systemInstruction || ESTT_AI_SYSTEM_INSTRUCTION;

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

        // Ensure history alternates strictly (required by Gemini, safe for all providers)
        const sanitizedHistory = [];
        let expectedRole = 'user';
        for (const item of chatHistory) {
            if (item.role === expectedRole) {
                sanitizedHistory.push(item);
                expectedRole = expectedRole === 'user' ? 'model' : 'user';
            }
        }

        // Limit history for Groq (8B model, keep it snappy)
        const limitedHistory = modelConfig?.provider === 'groq'
            ? sanitizedHistory.slice(-6)
            : sanitizedHistory;

        console.log(`📋 [ESTT-AI] Model: ${selectedModel}, History: ${limitedHistory.length} messages (from ${sanitizedHistory.length} total), Gemini key: ${!!process.env.GEMINI_API_KEY}, Groq key: ${!!process.env.GROQ_API_KEY}`);

        const userMessage = message?.trim() || '';

        // Allow greetings/small talk to pass through without search
        const isGreeting = /^(bonjour|salut|hello|hi|hey|merci|ok|oui|non|au revoir|goodbye|bye|cc|slt|cc|bonsoir)/i.test(userMessage.trim());

        // Detect platform navigation questions — answer from PLATFORM GUIDE, not resource search
        const isPlatformQuestion = /(comment|how|where|quoi|qu'est|est-ce que|peut-on|est-il|s'inscrire|contribuer|créer|ajouter|publier|rejoindre|s'abonner|clube?|événement|ressource|profil|message|chat|recherche|browse|filter|club|event|contribute|profile|message|notification)/i.test(userMessage)
            && /(comment|how to|where|plateforme|platform|page|site|appli|application|menu|bouton|navigation|utiliser|use|accéder|access|aller|go to)/i.test(userMessage);

        // Detect intent for RAG mode (summarize/find/general)
        const { isAcademic, intent } = detectAcademicIntent(userMessage);
        let forcedResourceContext = '';

        if (!isGreeting && !isPlatformQuestion) {
            // Always search for resources — academic AND platform questions
            let rewrittenQuery = '';
            try {
                rewrittenQuery = await rewriteQueryWithLLM(userMessage, limitedHistory, selectedModel);
            } catch (e) {
                console.warn(`[ESTT-AI] Query rewrite failed: ${e.message}`);
            }

            let results = [];

            // Search with rewritten query + filiere
            if (rewrittenQuery && rewrittenQuery !== 'NONE') {
                console.log(`🧠 [ESTT-AI] Query rewrite: "${rewrittenQuery}"`);
                results = await searchResourcesAction(rewrittenQuery, userProfile?.filiere);
            }

            // GUARDRAIL — fallback without filiere
            if (results.length === 0 && rewrittenQuery && rewrittenQuery !== 'NONE') {
                results = await searchResourcesAction(rewrittenQuery, null);
            }

            // GUARDRAIL — raw query fallback
            if (results.length === 0) {
                const rawQuery = userMessage.substring(0, 100);
                results = await searchResourcesAction(rawQuery, userProfile?.filiere);
            }

            // Enrich + build context
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
            const resourceInstruction = `You have [RESOURCE DATA] from the platform. Follow these rules:

Mode: ${intentLabel}.
- Answer DIRECTLY from the [RESOURCE DATA] content. Do NOT use your training knowledge.
- ${intent === 'summarize' ? 'Summarize the key points from the content.' : intent === 'find' ? 'Recommend the most relevant resources.' : 'Extract the answer from the content.'}
- If the resources do NOT answer the question, respond: "Je n'ai pas trouvé d'information pertinente dans les ressources disponibles pour cette demande. Veuillez consulter la page Ressources ou contacter un administrateur." Do NOT give a general answer.
- NEVER invent button names, page names, menu items, or UI steps.
- NEVER add tips, suggestions, advice, or extra information beyond what is EXPLICITLY stated in the [RESOURCE DATA]. Only state facts from the resources — nothing more.
- Use plain Markdown. Code blocks only for actual code.
- End with JSON (NOT inside code fences): {"action": "display_resources", "resource_ids": ["id1"]}`;
            finalSystemInstruction = `${systemInstruction}\n\n## RETRIEVED RESOURCES\n${resourceInstruction}\n\n[RESOURCE DATA]\n${forcedResourceContext}\n[END RESOURCE DATA]`;
        } else if (!isGreeting && !isPlatformQuestion) {
            // No resources found — direct refusal, no general answers
            finalSystemInstruction = `${systemInstruction}\n\nNo resources were found on the platform for this request. You MUST respond with: "Je n'ai pas trouvé de ressources correspondantes sur la plateforme pour cette demande. Veuillez consulter la page Ressources pour trouver ce que vous cherchez." Do NOT answer from your own knowledge. Do NOT give a general answer.`;
        }

        console.log(`🤖 [ESTT-AI] Sending to ${modelConfig?.shortName || selectedModel}...`);
        const reasoningEffort = getReasoningEffort(userMessage, isAcademic, modelConfig?.provider);
        console.log(`🧠 [ESTT-AI] Reasoning effort: ${reasoningEffort || 'default'} (provider: ${modelConfig?.provider})`);
        const aiText = await callLLM({
            modelId: selectedModel,
            history: limitedHistory,
            userMessage,
            systemInstruction: finalSystemInstruction,
            reasoningEffort,
        });
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

                // Extend history with the initial user message and AI response for context
                const ragHistory = [
                    ...limitedHistory,
                    { role: 'user', parts: [{ text: userMessage }] },
                    { role: 'model', parts: [{ text: aiText }] },
                ];

                const ragText = await callLLM({
                    modelId: selectedModel,
                    history: ragHistory,
                    userMessage: ragPrompt,
                    systemInstruction: finalSystemInstruction,
                });
                const final = extractAiResponse(ragText);

                console.log('✅ [ESTT-AI] RAG Pipeline COMPLETE');
                return NextResponse.json({
                    reply: final.reply || reply,
                    action: final.action,
                    interimReply: reply,
                    model: selectedModel,
                });
            }
        }

        console.log('✅ [ESTT-AI] Single-turn COMPLETE');
        return NextResponse.json({
            reply,
            action,
            model: selectedModel,
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
