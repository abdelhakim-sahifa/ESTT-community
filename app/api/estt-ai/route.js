import { NextResponse } from 'next/server';
import {
    ESTT_AI_MODEL,
    ESTT_AI_SYSTEM_INSTRUCTION,
} from '@/lib/estt-ai';
import { searchResourcesAction } from '@/lib/resourceUtils';

export const dynamic = 'force-dynamic';

function extractAiResponse(payload) {
    const text = payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || '')
        .join('')
        .trim();
        
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

async function callGemini(contents, apiKey, systemInstruction) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${ESTT_AI_MODEL}:generateContent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }],
                },
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        }
    );

    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || 'Gemini API Error');
    return payload;
}

export async function POST(request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
        }

        const { message, history = [], userProfile = null } = await request.json();
        
        // Prepare formatted history for Gemini
        const formattedHistory = Array.isArray(history) 
            ? history
                .filter((item) => item && (item.text || item.parts))
                .slice(-12)
                .map((item) => {
                    if (item.parts) return item; // Already formatted
                    return {
                        role: item.role === 'model' ? 'model' : 'user',
                        parts: [{ text: item.text?.trim() || "" }],
                    };
                })
            : [];

        const contents = [...formattedHistory, { role: 'user', parts: [{ text: message?.trim() || "" }] }];

        const userContext = [
            userProfile?.firstName ? `First name: ${userProfile.firstName}` : null,
            userProfile?.lastName ? `Last name: ${userProfile.lastName}` : null,
            userProfile?.filiere ? `Field: ${userProfile.filiere}` : null,
        ].filter(Boolean).join('\n');

        const systemInstruction = userContext 
            ? `${ESTT_AI_SYSTEM_INSTRUCTION}\n\nCurrent user context:\n${userContext}` 
            : ESTT_AI_SYSTEM_INSTRUCTION;

        // Phase 1: Call Gemini
        console.log(`🤖 [ESTT-AI] Phase 1 START`);
        const payload = await callGemini(contents, apiKey, systemInstruction);
        const { reply, action } = extractAiResponse(payload);

        // Check if we need to perform a search (Phase 2 & 3)
        if (action?.action === 'read' && action?.target === 'resources') {
            console.log(`📡 [ESTT-AI] Phase 2: Server-side search for "${action.query}"`);
            const searchResults = await searchResourcesAction(action.query, userProfile?.filiere);
            
            console.log(`📥 [ESTT-AI] Found ${searchResults.length} resources. Starting Phase 3...`);
            
            const systemResultsMessage = {
                role: 'user',
                parts: [{ text: `[SYSTEM DATA FETCH RESULTS]\nQuery: "${action.query}"\nFound: ${JSON.stringify(searchResults.map(r => ({id: r.id, title: r.title, description: r.description})))}\n\nTASK: Recommend 2-5 resources using "display_resources" action.` }]
            };

            const finalPayload = await callGemini([...contents, { role: 'model', parts: [{ text: reply || "Searching..." }] }, systemResultsMessage], apiKey, systemInstruction);
            const final = extractAiResponse(finalPayload);

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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
