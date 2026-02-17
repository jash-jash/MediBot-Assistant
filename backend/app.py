from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# -----------------------------------------------------
# 🤖 FAST AI ENDPOINT
# -----------------------------------------------------
@app.post("/openai")
def openrouter_chat():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")

        OPENROUTER_KEY = os.getenv("OPENROUTER_KEY")

        if not OPENROUTER_KEY:
            return jsonify({"error": "Missing OpenRouter API key"}), 400

        headers = {
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json",
        }

        # ⚡ SPEED OPTIMIZED PAYLOAD
        payload = {
            "model": "mistralai/mistral-7b-instruct",  # faster model
            "messages": [
                {
                    "role": "system",
                    "content": "Respond in strict medical structured format."
                },
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 500,      # reduced from 1500 → faster
            "temperature": 0.2,     # lower = faster
        }

        response_raw = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=15  # prevents long waiting
        )

        if response_raw.status_code != 200:
            return jsonify({
                "error": "OpenRouter HTTP error",
                "details": response_raw.text
            }), 500

        response = response_raw.json()

        if "choices" not in response or not response["choices"]:
            return jsonify({
                "error": "OpenRouter returned no choices",
                "details": response
            }), 500

        text = response["choices"][0]["message"]["content"]
        return jsonify({"text": text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------
# 📺 YOUTUBE ENDPOINT
# -----------------------------------------------------
@app.get("/youtube")
def youtube_endpoint():
    try:
        YOUTUBE_KEY = os.getenv("YOUTUBE_KEY")
        query = request.args.get("q", "")

        if not YOUTUBE_KEY:
            return jsonify({"error": "Missing YouTube API key"}), 400

        url = (
            "https://www.googleapis.com/youtube/v3/search?"
            f"part=snippet&type=video&maxResults=3&q={query}&key={YOUTUBE_KEY}"
        )

        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            return jsonify({
                "error": "YouTube API error",
                "details": response.text
            }), 500

        return jsonify(response.json())

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------
# 🚀 START SERVER
# -----------------------------------------------------
if __name__ == "__main__":
    print("🔥 API running at http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000)
