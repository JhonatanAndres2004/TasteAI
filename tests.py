import json
def ensureJSONFormat(response: str) -> object:
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
        print("Parsing response as JSON:")
        print(response)
        return json.loads(response)
    except json.JSONDecodeError:
        print("Response is not valid JSON.")
        return None
    
ensureJSONFormat("""{
"id": "6",
"allergies": [
    {
    "coherence_score": 3,
    "suggested_version": "Shrimp",
    "original_version": "Shrimp"
    }
],
"sportive_description": [
    {
    "coherence_score": 3,
    "suggested_version": "Running two times per week",
    "original_version": "Running two times per week"
    }
],
"medical_conditions": [
    {
    "coherence_score": 3,
    "suggested_version": "I have had 2 heart attacks",
    "original_version": "I have had 2 heart attacks"
    }
],
"ready_to_go": 1
}""")