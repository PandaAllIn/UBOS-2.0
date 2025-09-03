import fetch from 'node-fetch';
export async function geminiComplete(prompt, model = 'gemini-1.5-pro') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new Error('Missing GEMINI_API_KEY');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!res.ok)
        throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return text;
}
