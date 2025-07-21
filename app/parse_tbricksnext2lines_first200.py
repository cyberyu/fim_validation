import json
import re

def extract_after_fim_middle(text):
    """Extracts the string after the first <fim-middle> marker (case-insensitive)."""
    if not isinstance(text, str):
        return ''
    match = re.search(r'<fim-middle>', text, re.IGNORECASE)
    if match:
        return text[match.end():]
    return text

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--extract-output', action='store_true', help='Extract output directly from "output" field')
    args = parser.parse_args()
    input_path = 'prompts_with_starcoder_nosuffix_iter4k_completions_6thtry_4bit.jsonl'
    output_path = 'parsed_prompts_with_starcoder_nosuffix_iter4k_completions_6thtry_4bit.jsonl'
    results = []
    with open(input_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if i >= 200:
                break
            try:
                obj = json.loads(line)
            except Exception:
                continue
            if not isinstance(obj, dict):
                continue
            content = obj.get('content', '')
            completion = obj.get('completions', '') if args.extract_output else obj.get('completion', '')
            if args.extract_output:
                obj['output_after_fim_middle'] = obj.get('output', '')
            else:
                obj['output_after_fim_middle'] = extract_after_fim_middle(content)
            # If <fim-middle> is present, extract only the part after the tag
            if isinstance(completion, str) and re.search(r'<fim-middle>', completion, re.IGNORECASE):
                obj['prediction_after_fim_middle'] = extract_after_fim_middle(completion)
            else:
                obj['prediction_after_fim_middle'] = completion
            results.append(obj)
    with open(output_path, 'w', encoding='utf-8') as out:
        for entry in results:
            out.write(json.dumps(entry, ensure_ascii=False) + '\n')
    print(f"Parsed {len(results)} entries to {output_path}")

if __name__ == '__main__':
    main()
