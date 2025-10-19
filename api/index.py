# This is our Python backend: api/index.py
import os
import json
import google.generativeai as genai
from http.server import BaseHTTPRequestHandler

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
            
            # 2. Get the secret API key (SECURELY!)
            # We will set this up in our server settings, NOT here.
            API_KEY = os.environ.get('GEMINI_API_KEY')
            genai.configure(api_key=API_KEY)

            # 3. This is the "brain" - our prompt to the AI
            prompt = f"""
            You are "SparkKit," an expert AI copywriter for events.
            Generate 3 distinct event descriptions for the following event.

            Event Name: {eventName}
            Event Type: {eventType}
            Desired Vibe: {eventVibe}

            RULES:
            1. Generate 3 options.
            2. Separate each option with '---' (three hyphens).
            3. Do NOT include any other text, just the 3 descriptions separated by '---'.
            """
            
            # 4. Call the Gemini API
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            ai_text = response.text

            # 5. Send the AI's answer back to the HTML page
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*') # Allow our HTML to talk to this
            self.end_headers()
            
            response_data = {'text': ai_text}
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

        except Exception as e:
            # Send an error message if something goes wrong
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