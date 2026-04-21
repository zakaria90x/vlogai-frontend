const BASE_URL = 'https://vlogai-backend.onrender.com';

export const apiService = {
  async transcribe(videoFile) {
    const formData = new FormData();
    formData.append('file', videoFile);
    const res = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
    return res.json();
  },

  async generateSEO(title, transcription, duration) {
    const res = await fetch(`${BASE_URL}/api/seo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, transcription, duration }),
    });
    if (!res.ok) throw new Error(`SEO generation failed: ${res.status}`);
    return res.json();
  },

  async getSuggestions(transcription, duration, filename) {
    const res = await fetch(`${BASE_URL}/api/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcription, duration, filename }),
    });
    if (!res.ok) throw new Error(`Suggestions failed: ${res.status}`);
    return res.json();
  },

  async getShorts(transcription, duration, filename) {
    const res = await fetch(`${BASE_URL}/api/shorts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcription, duration, filename }),
    });
    if (!res.ok) throw new Error(`Shorts generation failed: ${res.status}`);
    return res.json();
  },
};
