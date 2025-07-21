import json

INPUT_FILE = "prompts_origin.json"
OUTPUT_FILE = "prompts_origin_starcoder2_format.json"

REPLACEMENTS = {
    "<FIM_PREFIX>": "<fim-prefix>",
    "<FIM_SUFFIX>": "<fim-suffix>",
    "<FIM_MIDDLE>": "<fim-middle>"
}

END_OF_TEXT = "<|end_of_text|>"

def remove_comments_from_string(s):
    # Remove lines starting with //
    return '\n'.join(line for line in s.splitlines() if not line.strip().startswith('//'))

def process_prompt(prompt):
    if isinstance(prompt, str):
        # Remove comment lines
        prompt = remove_comments_from_string(prompt)
        # Replace all tags, even if they are inside a string
        for old, new in REPLACEMENTS.items():
            prompt = prompt.replace(old, new)
        return prompt + END_OF_TEXT
    elif isinstance(prompt, dict):
        # Recursively process all string values in the dict
        for k, v in prompt.items():
            if isinstance(v, str):
                v_no_comments = remove_comments_from_string(v)
                for old, new in REPLACEMENTS.items():
                    v_no_comments = v_no_comments.replace(old, new)
                prompt[k] = v_no_comments + END_OF_TEXT if k == 'text' else v_no_comments
            elif isinstance(v, dict) or isinstance(v, list):
                prompt[k] = process_prompt(v)
        return prompt
    elif isinstance(prompt, list):
        return [process_prompt(item) for item in prompt]
    else:
        return prompt

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # If the file is a list of prompts
    if isinstance(data, list):
        processed = [process_prompt(p) for p in data]
    # If the file is a dict with a 'prompts' key
    elif isinstance(data, dict) and 'prompts' in data:
        processed = {**data, 'prompts': [process_prompt(p) for p in data['prompts']]}
    else:
        raise ValueError("Unknown JSON structure in prompts_origin.json")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(processed, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
