const GEMINI_API_KEY = 'AIzaSyAmZKSn-Heb-YE-Y_n4HLESsxeSRaTzNP0';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

interface GeminiResponse {
  candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  error?: { message: string };
}

export async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
      }),
    });

    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(`API Error: ${data.error.message}`);
    }

    return data.candidates?.[0]?.content.parts[0].text || 'No response';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Error fetching response';
  }
}