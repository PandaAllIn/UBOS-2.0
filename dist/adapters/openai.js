export async function openaiComplete(prompt, options) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
        throw new Error('Missing OPENAI_API_KEY');
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
        model: options.model,
        messages: [
            { role: 'system', content: 'You are EUFM OpenAI adapter.' },
            { role: 'user', content: prompt }
        ],
        temperature: options.temperature ?? 0.2
    };
    if (options.json)
        body.response_format = { type: 'json_object' };
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });
    if (!res.ok)
        throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
}
