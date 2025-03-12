import axios from 'axios';
import * as https from 'https';  // Sửa lại


const CENSORLY_API_KEY = 'c2c34341-9083-4c67-91b9-ec57e8c6f725';
const CENSORLY_API_URL = `https://jwwodttgkwgvpnpxvgca.supabase.co/functions/v1/analyze-message`;

interface CensorlyResponse {
  flagged: boolean;
  language: string;
  topics: string[];
  confidence: number;
}

export async function checkSensitiveContent(text: string): Promise<boolean> {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });

    const response = await axios.post<CensorlyResponse>(
      CENSORLY_API_URL,
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CENSORLY_API_KEY}`
        },
        httpsAgent: agent, // Sử dụng httpsAgent thay vì fetch
      }
    );

    return response.data.flagged;
  } catch (error) {
    console.error('Error checking sensitive content:', error);
    return false;
  }
}
