import json

train10_path = 'parsed_prompt_nosuffix_train_10th.jsonl'
train13_path = 'parsed_prompt_nosuffix_train_13th.jsonl'
out_path = 'diff_predictions_train_10th_vs_13th.jsonl'

# Read both files into lists
def read_jsonl(path):
    with open(path, 'r', encoding='utf-8') as f:
        return [json.loads(line) for line in f if line.strip()]

train10 = read_jsonl(train10_path)
train13 = read_jsonl(train13_path)

# Build index for train13 by (content, output_after_fim_middle)
index13 = {}
for obj in train13:
    key = (obj.get('content', ''), obj.get('output_after_fim_middle', ''))
    index13[key] = obj

results = []
for obj10 in train10:
    key = (obj10.get('content', ''), obj10.get('output_after_fim_middle', ''))
    obj13 = index13.get(key)
    if not obj13:
        continue
    pred10 = obj10.get('prediction_after_fim_middle', '')
    pred13 = obj13.get('prediction_after_fim_middle', '')
    if pred10 != pred13:
        # Save both objects for context
        results.append({
            'content': obj10.get('content', ''),
            'output_after_fim_middle': obj10.get('output_after_fim_middle', ''),
            'prediction_after_fim_middle_10th': pred10,
            'prediction_after_fim_middle_13th': pred13
        })

with open(out_path, 'w', encoding='utf-8') as f:
    for entry in results:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')

print(f"Saved {len(results)} differing prediction entries to {out_path}")
