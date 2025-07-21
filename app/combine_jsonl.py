import json
import sys
from pathlib import Path

def robust_load(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            if isinstance(data, dict):
                return [data]
            return data
        except json.JSONDecodeError:
            f.seek(0)
            return [json.loads(line) for line in f if line.strip()]

def extract_completion(obj):
    # Prefer 'completions' (first element if list), then 'completion', then ''
    if isinstance(obj, dict):
        if 'completions' in obj:
            val = obj['completions']
            if isinstance(val, list) and val:
                return val[0]
            elif isinstance(val, str):
                return val
        if 'completion' in obj:
            return obj['completion']
    return ''

def main():
    files = [
        "fim_prompts_from_codebase_iter1100_completions_new.json",
        "fim_prompts_from_codebase_iter1100_completions.json"
    ]
    # Allow override from command line
    if len(sys.argv) > 1:
        files = sys.argv[1:]
    all_data = [robust_load(f) for f in files]
    # Build a mapping from (prompt, output) to record for each file
    def key_fn(obj):
        return (obj.get('prompt', ''), obj.get('output', ''))
    maps = [ { key_fn(obj): obj for obj in data } for data in all_data ]
    # Use the intersection of all keys (prompt, output pairs)
    common_keys = set(maps[0].keys()) & set(maps[1].keys())
    combined = []
    for k in common_keys:
        prompt, output = k
        completions1 = extract_completion(maps[0][k])
        completions2 = extract_completion(maps[1][k])
        combined.append({
            'prompt': prompt,
            'output': output,
            'completions1': completions1,
            'completions2': completions2
        })
    out_path = "combined_results.jsonl"
    with open(out_path, "w", encoding="utf-8") as out:
        for entry in combined:
            out.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"Wrote {len(combined)} combined entries to {out_path}")

if __name__ == "__main__":
    main()
