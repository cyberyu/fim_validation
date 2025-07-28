import json
import re

def find_fim_tag(text, tag):
    """Finds the first occurrence of a FIM tag (hyphen or underscore). Returns (match, tag_used)."""
    if not isinstance(text, str):
        return None, None
    # Try hyphen first
    match = re.search(rf'<{tag}>', text, re.IGNORECASE)
    if match:
        return match, tag
    # Try underscore
    tag_underscore = tag.replace('-', '_')
    match = re.search(rf'<{tag_underscore}>', text, re.IGNORECASE)
    if match:
        return match, tag_underscore
    return None, None

def extract_after_fim_middle(text):
    """Extracts the string after the first <fim-middle> or <fim_middle> marker (case-insensitive)."""
    if not isinstance(text, str):
        return ''
    match, tag_used = find_fim_tag(text, 'fim-middle')
    if not match:
        return text
    return text[match.end():]

def extract_lines_after_fim_middle(text, num_lines=2):
    """Extracts one or two non-empty lines after <fim-middle> or <fim_middle> tag."""
    if not isinstance(text, str):
        return ''
    # Try hyphen, then underscore
    idx = text.lower().find('<fim-middle>')
    tag_len = len('<fim-middle>')
    if idx == -1:
        idx = text.lower().find('<fim_middle>')
        tag_len = len('<fim_middle>')
    if idx != -1:
        after = text[idx + tag_len:]
        lines = [line for line in after.splitlines() if line.strip()]
        return '\n'.join(lines[:num_lines])
    return ''

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--extract-output', action='store_true', help='Extract output directly from "output" field')
    args = parser.parse_args()
    input_path = 'prompt_nosuffix_test_19th.jsonl'
    output_path = 'parsed_prompt_nosuffix_test_19th.jsonl'
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
            completion = obj.get('completion', '')
            completions = obj.get('completions', '')
            output = obj.get('output', '')
            # If output is missing or empty, extract lines after <fim-middle> or <fim_middle> from content
            if not output:
                obj['output_after_fim_middle'] = extract_lines_after_fim_middle(content, num_lines=2)
            else:
                obj['output_after_fim_middle'] = output
            # If 'completions' exists, check for FIM tags (hyphen or underscore)
            if completions:
                if not (re.search(r'<fim[-_]prefix>', completions, re.IGNORECASE) or
                        re.search(r'<fim[-_]suffix>', completions, re.IGNORECASE) or
                        re.search(r'<fim[-_]middle>', completions, re.IGNORECASE)):
                    obj['prediction_after_fim_middle'] = completions
                else:
                    obj['prediction_after_fim_middle'] = extract_lines_after_fim_middle(completions, num_lines=2)
            # Otherwise, use completion as before
            elif isinstance(completion, str) and (re.search(r'<fim[-_]middle>', completion, re.IGNORECASE)):
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
