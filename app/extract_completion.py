import json
import sys

# Usage: python extract_completion.py prompts_with_em.json

def extract_completion_from_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for i, entry in enumerate(data[:10]):  # Only process the first 10 entries
        completions = entry.get('completions')
        if completions:
            # Handle string completions (not a list)
            if isinstance(completions, str):
                print(f'Entry {i} completion:')
                print(completions.lstrip('\n\r '))
                print('-' * 40)
            # Handle list of completions (legacy)
            elif isinstance(completions, list):
                if isinstance(completions[0], str):
                    print(f'Entry {i} completion:')
                    print(completions[0].lstrip('\n\r '))
                    print('-' * 40)
                elif isinstance(completions[0], dict) and 'text' in completions[0]:
                    print(f'Entry {i} completion:')
                    print(completions[0]['text'].lstrip('\n\r '))
                    print('-' * 40)
        else:
            print(f'Entry {i} has no completions')
            print('-' * 40)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Usage: python extract_completion.py <json_file>')
        sys.exit(1)
    extract_completion_from_file(sys.argv[1])
