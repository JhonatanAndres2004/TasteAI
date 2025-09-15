from openai import OpenAI
import os
from dotenv import load_dotenv
import anthropic
import google.generativeai as genai
import json
class MultiLLMService:
    def __init__(self, providers: list, prompt:str=None):
        """
        providers: list of callable providers that accept a prompt and return a response.
        """
        self.providers = providers
        self.prompt=prompt
        load_dotenv()

        self.openai_api_key = os.environ.get("OPENAI_API_KEY")
        self.anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY")

        self.openai_client = OpenAI(api_key=self.openai_api_key) if self.openai_api_key else None
        self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key) if self.anthropic_api_key else None
        if self.gemini_api_key: 
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_client = genai

    def ensureJSONFormat(self, response: str) -> object:
        """
        Ensure the response is a string convertable to JSON format.

        Arguments:
        response: The response string to validate.

        Returns:
        The parsed JSON object if valid, otherwise None.
        """
        # Remove Markdown code block if present
        if response.strip().startswith("```"):
            # Remove the first line (```json or ```)
            lines = response.strip().splitlines()
            # Remove the first and last line (the backticks)
            if len(lines) >= 3 and lines[0].startswith("```") and lines[-1].startswith("```"):
                response = "\n".join(lines[1:-1])
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            print("Response is not valid JSON.")
            return None

    def getLLMResponse(self, prompt: str) -> str:
        """
        Try each provider in order until one succeeds.

        Arguments:
        prompt: The input prompt to send to the LLM.

        Returns:
        The response from the first successful provider.
        """
        for provider in self.providers:
            try:
                response = provider(prompt)
                print(f"Using provider: {provider.__name__}")
                print(f"Response: {response}")

                formatted_response = self.ensureJSONFormat(response)
                if formatted_response:
                    return formatted_response
                else:
                    print(f"Provider {provider.__name__} returned invalid JSON.")    
            
            except Exception as e:
                print(f"Provider {provider.__name__} failed: {e}")
        return None

    def openai_provider(self, prompt:str) -> str:
        # Make API call
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role" : "user", "content" : prompt}],
            temperature=0.4  # Low temperature for consistent output
        )
        # Parse the response as JSON
        result = response.choices[0].message.content.strip()
        print("OpenAI response successful: ")
        return result

    def anthropic_provider(self, prompt: str) -> str:
        response = self.anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            temperature=0.4,
            max_tokens=8192,
            messages=[
                {"role" : "user", "content" : prompt}
            ]
        )
        result = response.content[0].text.strip()
        print("Anthropic response successful: ")
        return result

    def gemini_provider(self, prompt: str) -> str:
        model = self.gemini_client.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt, generation_config={"temperature": 0.4})
        result = response.text
        print("Gemini response successful: ")
        return result


