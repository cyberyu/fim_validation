import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles || [];
  let files = [];
  try {
    files = fs.readdirSync(dirPath);
  } catch (e) {
    return arrayOfFiles || [];
  }
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (fs.existsSync(fullPath)) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

app.get('/api/json-files', (req, res) => {
  const folder = req.query.folder || '.';
  if (!fs.existsSync(folder)) {
    return res.json({ files: [] });
  }
  const files = getAllFiles(folder).filter(f => f.endsWith('.json') || f.endsWith('.jsonl'));
  res.json({ files });
});

app.get('/api/json-content', (req, res) => {
  const file = req.query.file;
  if (!file || !fs.existsSync(file)) {
    return res.status(404).json({ error: 'File not found', json: [] });
  }
  try {
    const text = fs.readFileSync(file, 'utf8');
    let json;
    if (file.endsWith('.jsonl')) {
      json = text.split('\n').filter(Boolean).map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
    } else {
      json = JSON.parse(text);
    }
    res.json({ json });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read or parse file', json: [] });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
