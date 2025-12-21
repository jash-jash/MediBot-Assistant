from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# -----------------------------------------------------
# 🔐 LOAD API KEYS FROM ENV VARIABLES
# -----------------------------------------------------
OPENROUTER_KEY = os.getenv("OPENROUTER_KEY")
YOUTUBE_KEY = os.getenv("YOUTUBE_KEY")
NEWS_KEY = os.getenv("NEWS_KEY")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


# -----------------------------------------------------
# 🤖 AI ENDPOINT (OpenRouter)
# -----------------------------------------------------
@app.post("/openai")
def openrouter_chat():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")

        if not OPENROUTER_KEY:
            return jsonify({"error": "Missing OpenRouter API key"}), 400

        headers = {
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "meta-llama/llama-3.2-3b-instruct:free",
            "messages": [
                {"role": "system", "content": "Respond in strict medical structured format."},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 1500,
            "temperature": 0.4,
        }

        response = requests.post(OPENROUTER_URL, headers=headers, json=payload).json()

        if "choices" not in response:
            return jsonify({
                "error": "OpenRouter returned no choices",
                "details": response
            }), 500

        text = response["choices"][0]["message"]["content"]
        return jsonify({"text": text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------
# 📺 YouTube Endpoint
# -----------------------------------------------------
@app.get("/youtube")
def youtube_endpoint():
    try:
        query = request.args.get("q", "")

        if not YOUTUBE_KEY:
            return jsonify({"error": "Missing YouTube API key"}), 400

        url = (
            "https://www.googleapis.com/youtube/v3/search?"
            f"part=snippet&type=video&maxResults=5&q={query}&key={YOUTUBE_KEY}"
        )

        return jsonify(requests.get(url).json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------
# 📰 NEWS Endpoint
# -----------------------------------------------------
@app.get("/news")
def news_endpoint():
    try:
        if not NEWS_KEY:
            return jsonify({"error": "Missing News API key"}), 400

        url = f"https://gnews.io/api/v4/search?q=health&lang=en&max=10&token={NEWS_KEY}"

        return jsonify(requests.get(url).json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------
# 🚀 START SERVER
# -----------------------------------------------------
if __name__ == "__main__":
    print("🔥 API running at http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000)
