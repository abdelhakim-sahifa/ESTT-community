import { NextResponse } from 'next/server';
import {
    ESTT_AI_MODEL,
    ESTT_AI_SYSTEM_INSTRUCTION,
} from '@/lib/estt-ai';
import { searchResourcesAction } from '@/lib/resourceUtils';

export const dynamic = 'force-dynamic';

async function extractTextFromServer(file) {
    try {
        const parse = require('pdf-parse/lib/pdf-parse.js');
        
        if (typeof parse !== 'function') {
            console.error('❌ [ESTT-AI] pdf-parse structure:', typeof parse);
            throw new Error('pdf-parse core is not a function');
        }

        console.log(`📄 [ESTT-AI] Extracting text locally via pdf-parse core...`);
        
        // Convert the File object to a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse the PDF
        const data = await parse(buffer);
        
        if (!data || !data.text) {
            console.warn("⚠️ [ESTT-AI] pdf-parse returned no text.");
            return null;
        }

        console.log(`✅ [ESTT-AI] Local extraction successful. Length: ${data.text.length} characters.`);
        return data.text;
    } catch (error) {
        console.error(`❌ [ESTT-AI] Local extraction failed:`, error.message);
        throw error;
    }
}

function extractAiResponse(text) {
    if (!text) return { reply: null, action: null };

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const rawJson = jsonMatch[0];
            const actionData = JSON.parse(rawJson);
            const reply = text.replace(rawJson, '').trim();
            
            return {
                reply: reply || actionData.message || null,
                action: actionData
            };
        }
    } catch (e) {
        console.warn('AI returned malformed JSON or plain text.');
    }

    return { reply: text, action: null };
}

async function callOllama(prompt) {
    const OLLAMA_URL = 'https://ollama.com/api/generate';
    const OLLAMA_KEY = '8a64838fe32644c687ef1681e7a8a6f5.YqaEPBHJMqXQnjdqSdH8Gkrx';
    const OLLAMA_MODEL = 'gemma4:31b-cloud';

    try {
        console.log(`📡 [ESTT-AI] Calling Ollama Cloud with model: ${OLLAMA_MODEL}`);
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OLLAMA_KEY}`
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Ollama API Error (${response.status}): ${err}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error(`🚨 [Ollama API Error]:`, error.message);
        throw error;
    }
}

async function callOllamaChat(messages, systemInstruction) {
    // Format messages into a single prompt for Ollama
    let prompt = `System Instruction:\n${systemInstruction}\n\n`;
    
    messages.forEach(msg => {
        const role = msg.role === 'assistant' ? 'Assistant' : 'User';
        prompt += `${role}: ${msg.content}\n`;
    });
    
    prompt += "Assistant:";

    return await callOllama(prompt);
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
            const context = formData.get('context'); // Extra info like system prompt

            if (purpose === 'pdf-analysis' && file) {
                console.log('🤖 [ESTT-AI] Processing PDF analysis request with file:', file.name);
                const extractedText = await extractTextFromServer(file);
                
                if (!extractedText) throw new Error('No text extracted from PDF');

                console.log('🤖 [ESTT-AI] Analyzing extracted text via Ollama...');
                // The context sent from client includes the system prompt + any previous text
                const aiResultText = await callOllama(`${context}\n\nTexte extrait :\n${extractedText.substring(0, 5000)}`);
                const { action } = extractAiResponse(aiResultText);

                return NextResponse.json({
                    action,
                    reply: aiResultText,
                    model: 'gemma4:31b-cloud'
                });
            }
        } else {
            const body = await request.json();
            message = body.message;
            history = body.history || [];
            userProfile = body.userProfile || null;
            purpose = body.purpose || 'chat';

            console.log('📦 [ESTT-AI] Request body purpose:', purpose);

            // Legacy path for text-only analysis (if needed)
            if (purpose === 'pdf-analysis') {
                console.log('🤖 [ESTT-AI] Starting text-only PDF analysis via Ollama...');
                const text = await callOllama(message);
                const { action } = extractAiResponse(text);
                
                return NextResponse.json({
                    action,
                    reply: text,
                    model: 'gemma4:31b-cloud'
                });
            }
        }

        // We no longer require GROQ_API_KEY as we switched to Ollama Cloud
        // if (!process.env.GROQ_API_KEY) {
        //     return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 500 });
        // }
        
        // Prepare formatted history for Groq (role must be 'user' or 'assistant')
        const formattedHistory = Array.isArray(history) 
            ? history
                .filter((item) => item && (item.content || item.text))
                .slice(-12)
                .map((item) => ({
                    role: item.role === 'assistant' || item.role === 'model' ? 'assistant' : 'user',
                    content: item.content || item.text || "",
                }))
            : [];

        const messages = [...formattedHistory, { role: 'user', content: message?.trim() || "" }];

        const userContext = [
            userProfile?.firstName ? `First name: ${userProfile.firstName}` : null,
            userProfile?.lastName ? `Last name: ${userProfile.lastName}` : null,
            userProfile?.filiere ? `Field: ${userProfile.filiere}` : null,
        ].filter(Boolean).join('\n');

        const systemInstruction = userContext 
            ? `${ESTT_AI_SYSTEM_INSTRUCTION}\n\nCurrent user context:\n${userContext}` 
            : ESTT_AI_SYSTEM_INSTRUCTION;

        // Phase 1: Call Ollama
        console.log(`🤖 [ESTT-AI] Phase 1 START (Ollama)`);
        const text = await callOllamaChat(messages, systemInstruction);
        const { reply, action } = extractAiResponse(text);

        // Check if we need to perform a search (Phase 2 & 3)
        if (action?.action === 'read' && action?.target === 'resources') {
            console.log(`📡 [ESTT-AI] Phase 2: Server-side search for "${action.query}"`);
            const searchResults = await searchResourcesAction(action.query, userProfile?.filiere);
            
            console.log(`📥 [ESTT-AI] Found ${searchResults.length} resources. Starting Phase 3...`);
            
            const systemResultsMessage = {
                role: 'user',
                content: `[SYSTEM DATA FETCH RESULTS]\nQuery: "${action.query}"\nFound: ${JSON.stringify(searchResults.map(r => ({id: r.id, title: r.title, description: r.description})))}\n\nTASK: Recommend 2-5 resources using "display_resources" action.`
            };

            const finalText = await callOllamaChat([...messages, { role: 'assistant', content: text || "Searching..." }, systemResultsMessage], systemInstruction);
            const final = extractAiResponse(finalText);

            console.log(`✅ [ESTT-AI] Pipeline COMPLETE`);
            return NextResponse.json({
                reply: final.reply,
                action: final.action,
                interimReply: reply,
                model: ESTT_AI_MODEL,
            });
        }

        console.log(`✅ [ESTT-AI] Single-turn COMPLETE`);
        return NextResponse.json({
            reply,
            action,
            model: ESTT_AI_MODEL,
        });

    } catch (error) {
        console.error('❌ ESTT-AI Route Error:', error);
        
        // Provide more descriptive errors to the frontend
        const errorMessage = error.message || 'An unexpected error occurred in the AI assistant.';
        const status = error.status || 500;
        
        return NextResponse.json({ 
            error: errorMessage,
            details: error.name !== 'Error' ? error.name : undefined,
            code: error.code
        }, { status });
    }
}
