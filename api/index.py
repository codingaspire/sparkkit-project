# This is our Python backend: api/index.py
import os
import json
import google.generativeai as genai
from http.server import BaseHTTPRequestHandler
import traceback

class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        try:
            # 1. Get the secret API key
            API_KEY = os.environ.get('GEMINI_API_KEY')
            if not API_KEY:
                print("ERROR: GEMINI_API_KEY environment variable is NOT SET.")
            
            genai.configure(api_key=API_KEY)

            # 2. THIS IS THE NEW PART: LIST ALL AVAILABLE MODELS
            print("Attempting to list models...")
            
            model_list = []
            for m in genai.list_models():
                # We only care about models that can generate content
                if 'generateContent' in m.supported_generation_methods:
                    model_list.append(m.name)

            print(f"Found models: {model_list}")

            # 3. Send the list of models back as a single string
            ai_text = "Available Models:\n\n" + "\n".join(model_list)
            
            if not model_list:
                ai_text = "Error: No models found for your API key. Please check Google Cloud project permissions and ensure billing is enabled."

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = {'text': ai_text}
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
# # This is our Python backend: api/index.py
# import os
# import json
# import google.generativeai as genai
# from http.server import BaseHTTPRequestHandler
# import traceback # <-- ADDED THIS IMPORT

# class handler(BaseHTTPRequestHandler):

#     def do_POST(self):
#         try:
#             # 1. Read the data from the HTML form
#             content_length = int(self.headers['Content-Length'])
#             post_data = self.rfile.read(content_length)
#             data = json.loads(post_data)

#             # Get the user's inputs
#             eventName = data.get('eventName')
#             eventType = data.get('eventType')
#             eventVibe = data.get('eventVibe')
            
#             # 2. Get the secret API key (SECURELY!)
#             API_KEY = os.environ.get('GEMINI_API_KEY')
            
#             # --- START DEBUGGING PRINT ---
#             if not API_KEY:
#                 print("ERROR: GEMINI_API_KEY environment variable is NOT SET.")
#             else:
#                 print(f"API Key loaded, starting with... {API_KEY[:4]}...")
#             # --- END DEBUGGING PRINT ---
            
#             genai.configure(api_key=API_KEY)

#             # 3. This is the "brain" - our prompt to the AI
#             print("Configuring prompt...")
#             prompt = f"""
#             You are "SparkKit," an expert AI copywriter for events.
#             Generate 3 distinct event descriptions for the following event.

#             Event Name: {eventName}
#             Event Type: {eventType}
#             Desired Vibe: {eventVibe}

#             RULES:
#             1. Generate 3 options.
#             2. Separate each option with '---' (three hyphens).
#             3. Do NOT include any other text, just the 3 descriptions separated by '---'.
#             """
            
#             # 4. Call the Gemini API
#             print("Calling Gemini API...")
#             model = genai.GenerativeModel('gemini-1.0-pro')
#             response = model.generate_content(prompt)
#             ai_text = response.text
#             print("Gemini API call successful.")

#             # 5. Send the AI's answer back to the HTML page
#             self.send_response(200)
#             self.send_header('Content-type', 'application/json')
#             self.send_header('Access-Control-Allow-Origin', '*')
#             self.end_headers()
            
#             response_data = {'text': ai_text}
#             self.wfile.write(json.dumps(response_data).encode('utf-8'))

#         except Exception as e:
#             # --- THIS IS THE NEW PART ---
#             # Print the FULL error traceback to the Vercel logs
#             print("!!!!!!!!!! AN ERROR OCCURRED !!!!!!!!!!")
#             print(traceback.format_exc())
#             print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
#             # --- END OF NEW PART ---

#             # Send an error message if something goes wrong
#             self.send_response(500)
#             self.send_header('Content-type', 'application/json')
#             self.send_header('Access-Control-Allow-Origin', '*')
#             self.end_headers()
#             error_response = {'error': str(e)}
#             self.wfile.write(json.dumps(error_response).encode('utf-8'))

#     # Handle 'OPTIONS' requests (for security/CORS)
#     def do_OPTIONS(self):
#         self.send_response(200)
#         self.send_header('Access-Control-Allow-Origin', '*')
#         self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
#         self.send_header('Access-Control-Allow-Headers', 'Content-Type')
#         self.end_headers()




