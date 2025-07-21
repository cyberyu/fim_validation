import { useEffect, useState } from 'react';
import './App.css';
import PromptJsonlViewer from './PromptJsonlViewer';

function App() {
  const [page, setPage] = useState<'main' | 'viewer'>('main');
  const [files, setFiles] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Pagination state for JSONL lines
  const [jsonPage, setJsonPage] = useState(0);
  const linesPerPage = 5;

  // Removed user file states
  useEffect(() => {
    fetch('http://localhost:3001/api/json-files?folder=public/fim_results')
      .then(res => res.json())
      .then(data => {
        setFiles(data.files || []);
        setCurrentIndex(0);
      });
  }, []);

  useEffect(() => {
    if (files.length > 0) {
      fetch(`http://localhost:3001/api/json-content?file=${encodeURIComponent(files[currentIndex])}`)
        .then(res => res.json())
        .then(data => {
          setJsonContent(data.json);
          setError(null);
        })
        .catch(() => setError('Failed to load JSON content'));
    }
  }, [files, currentIndex]);

  useEffect(() => {
    setJsonPage(0); // Reset page when file changes
  }, [currentIndex]);

  const handlePrev = () => setCurrentIndex(i => Math.max(i - 1, 0));
  const handleNext = () => setCurrentIndex(i => Math.min(i + 1, files.length - 1));

  // Helper to fetch all JSONL files and their content
  const fetchAllJsonlFiles = async () => {
    const res = await fetch('http://localhost:3001/api/json-files?folder=public/fim_results');
    const data = await res.json();
    return data.files || [];
  };

  const fetchJsonlContent = async (file: string) => {
    const res = await fetch(`http://localhost:3001/api/json-content?file=${encodeURIComponent(file)}`);
    const data = await res.json();
    return data.json || [];
  };

  // Prompt generation logic
  const FIM_PREFIX = '<FIM_PREFIX>';
  const FIM_SUFFIX = '<FIM_SUFFIX>';
  const FIM_MIDDLE = '<FIM_MIDDLE>';

  const handleGeneratePrompts = async () => {
    setGenerating(true);
    setDownloadUrl(null);
    const files = await fetchAllJsonlFiles();
    setProgress({ current: 0, total: files.length });
    let allPrompts: any[] = [];
    for (let i = 0; i < files.length; ++i) {
      const file = files[i];
      const lines = await fetchJsonlContent(file);
      for (const line of lines) {
        const prefix = line.prefix || '';
        const suffix = line.suffix || '';
        const prompt = `${FIM_PREFIX}${prefix}${FIM_SUFFIX}${suffix}${FIM_MIDDLE}`;
        allPrompts.push({ prompt, output: line.original_code });
      }
      setProgress({ current: i + 1, total: files.length });
    }
    // Create download link
    const blob = new Blob([JSON.stringify(allPrompts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setGenerating(false);
  };

  if (page === 'viewer') {
    return <PromptJsonlViewer goHome={() => setPage('main')} />;
  }

  // Main page content (add a link to go to viewer)
  return (
    <div className="App">
      <h1>JSONL File Viewer</h1>
      <nav style={{ marginBottom: 16 }}>
        <a href="#" onClick={() => setPage('viewer')} style={{ color: '#1976d2', fontWeight: 'bold' }}>
          Go to Prompt JSONL Viewer
        </a>
      </nav>
      {/* Remove user file upload UI, restore default recursive loading */}
      <button onClick={handleGeneratePrompts} disabled={generating} style={{ marginBottom: '1em' }}>
        Generate Prompts and Labels
      </button>
      {generating && (
        <div style={{ margin: '1em 0' }}>
          <div>Generating prompts... {progress.current} / {progress.total} files finished</div>
          <progress value={progress.current} max={progress.total} style={{ width: '100%' }} />
        </div>
      )}
      {downloadUrl && (
        <div style={{ margin: '1em 0' }}>
          <a href={downloadUrl} download="prompts.json" style={{ fontWeight: 'bold', color: '#1976d2' }}>
            Download prompts.json
          </a>
        </div>
      )}
      {files.length === 0 && <p>No valid JSONL files found.</p>}
      {files.length > 0 && (
        <>
          <div>
            <button onClick={handlePrev} disabled={currentIndex === 0}>Previous</button>
            <span style={{ margin: '0 1em' }}>{currentIndex + 1} / {files.length}</span>
            <button onClick={handleNext} disabled={currentIndex === files.length - 1}>Next</button>
          </div>
          <div style={{ marginTop: '1em' }}>
            <strong>File:</strong> {files[currentIndex]}
          </div>
          <div style={{ marginTop: '1em' }}>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {Array.isArray(jsonContent) && (
              <>
                {/* Page navigation label */}
                <div style={{ marginBottom: '0.5em', fontWeight: 'bold' }}>Line/Page Navigation</div>
                {jsonContent
                  .slice(jsonPage * linesPerPage, (jsonPage + 1) * linesPerPage)
                  .map((obj, idx) => (
                    <div key={jsonPage * linesPerPage + idx} style={{ border: '1px solid #ccc', marginBottom: '1em', padding: '0.5em' }}>
                      <div><strong>Line {jsonPage * linesPerPage + idx + 1}</strong></div>
                      {Object.entries(obj).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: '0.5em' }}>
                          <label>{key}: </label>
                          <textarea
                            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                            readOnly
                            style={{
                              width: '80%',
                              minHeight: '6em',
                              fontFamily: 'monospace',
                              background: '#222',
                              color: '#eee',
                              border: '1px solid #444',
                              borderRadius: '4px',
                              padding: '0.5em',
                              whiteSpace: 'pre',
                              marginTop: '0.25em',
                              marginBottom: '0.25em',
                              resize: 'vertical',
                              overflowX: 'auto',
                              display: 'block',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1em', marginTop: '1em' }}>
                  <button onClick={() => setJsonPage(p => Math.max(p - 1, 0))} disabled={jsonPage === 0}>Previous</button>
                  <span>Page {jsonPage + 1} / {Math.ceil(jsonContent.length / linesPerPage)}</span>
                  <button onClick={() => setJsonPage(p => p + 1)} disabled={(jsonPage + 1) * linesPerPage >= jsonContent.length}>Next</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
