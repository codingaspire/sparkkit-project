# This is our Python backend: api/index.py
import os
import json
import google.generativeai as genai
from http.server import BaseHTTPRequestHandler
import traceback 

class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            # 1. Read the data from the HTML form
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            # Get the user's inputs
            eventName = data.get('eventName')
            eventType = data.get('eventType')
            eventVibe = data.get('eventVibe')
            
            # 2. Get the secret API key
            API_KEY = os.environ.get('GEMINI_API_KEY')
            if not API_KEY:
                print("ERROR: GEMINI_API_KEY environment variable is NOT SET.")
            
            genai.configure(api_key=API_KEY)

            # 3. --- THIS IS THE NEW V2 PROMPT ---
            print("Configuring V2 prompt for JSON output...")
            prompt = f"""
            You are "SparkKit," an expert AI copywriter for events.
            Generate a complete promotional kit for the following event.

            Event Name: {eventName}
            Event Type: {eventType}
            Desired Vibe: {eventVibe}

            RULES:
            1. Return ONLY a valid JSON object.
            2. Do not include any other text or markdown backticks (```json ... ```).
            3. Generate one piece of copy for each requested channel.

            Here is the JSON structure to follow:
            {{
              "email_subject": "A subject line for a promotional email.",
              "email_body": "The body for a promotional email (2-3 paragraphs).",
              "linkedin_post": "A professional post for LinkedIn, highlighting networking or learning.",
              "x_post": "A short, punchy post for X (formerly Twitter), under 280 chars.",
              "instagram_caption": "A high-energy, emoji-filled caption for an Instagram post.",
              "whatsapp_blurb": "A very short, casual message perfect for WhatsApp or Telegram groups."
            }}
            """
            
            # 4. Call the Gemini API
            print("Calling Gemini API with 'gemini-pro-latest'...")
            model = genai.GenerativeModel('gemini-pro-latest')
            response = model.generate_content(prompt)
            ai_text = response.text
            print("Gemini API call successful, got JSON string.")

            # 5. Send the AI's JSON string back to the HTML page
            # We'll put it inside a 'kit' key for the frontend to parse
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = {'kit': ai_text} # Send the JSON string as a value
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

        except Exception as e:
            # Print the FULL error traceback to the Vercel logs
            print("!!!!!!!!!! AN ERROR OCCURRED !!!!!!!!!!")
            print(traceback.format_exc())
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    # Handle 'OPTIONS' requests (for security/CORS)
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
