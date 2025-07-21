import React, { useState } from 'react';

const FIM_PREFIX = '<FIM_PREFIX>';
const FIM_SUFFIX = '<FIM_SUFFIX>';
const FIM_MIDDLE = '<FIM_MIDDLE>';

function extractParts(prompt: string, completions?: any) {
  let prefix = '', suffix = '', completion = '';
  if (prompt) {
    const prefixIdx = prompt.indexOf(FIM_PREFIX);
    const suffixIdx = prompt.indexOf(FIM_SUFFIX);
    const middleIdx = prompt.indexOf(FIM_MIDDLE);
    if (prefixIdx !== -1 && suffixIdx !== -1 && middleIdx !== -1) {
      prefix = prompt.substring(prefixIdx + FIM_PREFIX.length, suffixIdx);
      suffix = prompt.substring(suffixIdx + FIM_SUFFIX.length, middleIdx);
      // Extract completion as the part after <FIM_MIDDLE>
      completion = prompt.substring(middleIdx + FIM_MIDDLE.length);
    } else if (middleIdx !== -1) {
      // If only <FIM_MIDDLE> is present, take everything after it
      completion = prompt.substring(middleIdx + FIM_MIDDLE.length);
    }
  }
  // If completions is provided and is a string, extract after <FIM_MIDDLE>
  if (typeof completions === 'string') {
    const middleIdx = completions.indexOf(FIM_MIDDLE);
    if (middleIdx !== -1) {
      completion = completions.substring(middleIdx + FIM_MIDDLE.length);
    } else {
      completion = completions;
    }
  } else if (completions && Array.isArray(completions) && completions.length > 0) {
    if (typeof completions[0] === 'string') {
      const middleIdx = completions[0].indexOf(FIM_MIDDLE);
      if (middleIdx !== -1) {
        completion = completions[0].substring(middleIdx + FIM_MIDDLE.length);
      } else {
        completion = completions[0];
      }
    } else if (typeof completions[0] === 'object' && completions[0].text) {
      const text = completions[0].text;
      const middleIdx = text.indexOf(FIM_MIDDLE);
      if (middleIdx !== -1) {
        completion = text.substring(middleIdx + FIM_MIDDLE.length);
      } else {
        completion = text;
      }
    }
  }
  return { prefix, suffix, completion };
}

const PromptJsonlViewer: React.FC<{ goHome?: () => void }> = ({ goHome }) => {
  const [lines, setLines] = useState<any[]>([]);
  const [otherCompletions, setOtherCompletions] = useState<any[]>([]);
  const [thirdCompletions, setThirdCompletions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [mainFile, setMainFile] = useState<File|null>(null);
  const [otherFile, setOtherFile] = useState<File|null>(null);
  const [thirdFile, setThirdFile] = useState<File|null>(null);
  const [mainFileName, setMainFileName] = useState('');
  const [otherFileName, setOtherFileName] = useState('');
  const [thirdFileName, setThirdFileName] = useState('');
  const [ready, setReady] = useState(false);

  const handleMainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainFile(file);
    setMainFileName(file.name);
  };

  const handleOtherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOtherFile(file);
    setOtherFileName(file.name);
  };

  const handleThirdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThirdFile(file);
    setThirdFileName(file.name);
  };

  const handleCompare = () => {
    if (!mainFile || !otherFile || !thirdFile) return;
    // Read main file
    const mainReader = new FileReader();
    mainReader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        let loadedLines: any[] = [];
        if (mainFile.name.endsWith('.json')) {
          loadedLines = JSON.parse(text);
        } else {
          loadedLines = text
            .split('\n')
            .filter(Boolean)
            .map(line => {
              try {
                return JSON.parse(line);
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean);
        }
        setLines(loadedLines);
        setCurrent(0);
        setReady(false); // Wait for all files
        // Now read other file
        const otherReader = new FileReader();
        otherReader.onload = (evt2) => {
          try {
            const text2 = evt2.target?.result as string;
            let loaded: any[] = [];
            if (otherFile.name.endsWith('.json')) {
              loaded = JSON.parse(text2);
            } else {
              loaded = text2
                .split('\n')
                .filter(Boolean)
                .map(line => {
                  try {
                    return JSON.parse(line);
                  } catch (e) {
                    return null;
                  }
                })
                .filter(Boolean);
            }
            setOtherCompletions(loaded);
            // Now read third file
            const thirdReader = new FileReader();
            thirdReader.onload = (evt3) => {
              try {
                const text3 = evt3.target?.result as string;
                let loaded3: any[] = [];
                if (thirdFile.name.endsWith('.json')) {
                  loaded3 = JSON.parse(text3);
                } else {
                  loaded3 = text3
                    .split('\n')
                    .filter(Boolean)
                    .map(line => {
                      try {
                        return JSON.parse(line);
                      } catch (e) {
                        return null;
                      }
                    })
                    .filter(Boolean);
                }
                setThirdCompletions(loaded3);
                setReady(true);
              } catch (e) {
                setThirdCompletions([]);
                setReady(true);
              }
            };
            if (thirdFile) {
              thirdReader.readAsText(thirdFile);
            }
          } catch (e) {
            setOtherCompletions([]);
            setThirdCompletions([]);
            setReady(true);
          }
        };
        if (otherFile) {
          otherReader.readAsText(otherFile);
        }
      } catch (e) {
        setLines([]);
        setOtherCompletions([]);
        setThirdCompletions([]);
        setReady(true);
      }
    };
    mainReader.readAsText(mainFile);
  };

  if (!ready) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Prompt JSONL/JSON Viewer</h2>
        <nav style={{ marginBottom: 16 }}>
          <a href="#" onClick={goHome} style={{ color: '#1976d2', fontWeight: 'bold' }}>Go to Main Page</a>
        </nav>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 600 }}>Main File:</span>
          <input type="file" accept=".json,.jsonl" onChange={handleMainUpload} />
          {mainFileName && <span style={{ marginLeft: 8, color: '#1976d2' }}>{mainFileName}</span>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 600 }}>Other Completions File:</span>
          <input type="file" accept=".json,.jsonl" onChange={handleOtherUpload} />
          {otherFileName && <span style={{ marginLeft: 8, color: '#1976d2' }}>{otherFileName}</span>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 600 }}>Third Completions File:</span>
          <input type="file" accept=".json,.jsonl" onChange={handleThirdUpload} />
          {thirdFileName && <span style={{ marginLeft: 8, color: '#1976d2' }}>{thirdFileName}</span>}
        </div>
        <button onClick={handleCompare} disabled={!(mainFile && otherFile && thirdFile)} style={{ fontWeight: 700, fontSize: '1.1em', padding: '8px 24px' }}>Compare</button>
      </div>
    );
  }

  const { prompt, output, completions } = lines[current];
  const { prefix, suffix, completion } = extractParts(prompt, completions);

  return (
    <div style={{ padding: 24, width: '50vw', maxWidth: '50vw', boxSizing: 'border-box' }}>
      <h2>Prompt JSONL/JSON Viewer</h2>
      <nav style={{ marginBottom: 16 }}>
        <a href="#" onClick={goHome} style={{ color: '#1976d2', fontWeight: 'bold' }}>Go to Main Page</a>
      </nav>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setCurrent(c => Math.max(c - 1, 0))} disabled={current === 0}>Previous</button>
        <span style={{ margin: '0 12px' }}>{current + 1} / {lines.length}</span>
        <button onClick={() => setCurrent(c => Math.min(c + 1, lines.length - 1))} disabled={current === lines.length - 1}>Next</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ width: '100%', minWidth: 325, alignSelf: 'flex-start' }}>
          <label><b>Prefix</b></label>
          <textarea
            value={prefix ? `\n${prefix}\n` : ''}
            readOnly
            style={{
              width: '100%',
              minHeight: 240, // 160 * 1.5
              fontFamily: 'monospace',
              background: '#222',
              color: '#fff',
              whiteSpace: 'pre-wrap',
              resize: 'vertical',
              marginBottom: 16
            }}
          />
        </div>
        <div style={{ width: '100%', minWidth: 325, alignSelf: 'flex-start' }}>
          <label><b>Suffix</b></label>
          <textarea
            value={suffix ? `\n${suffix}\n` : ''}
            readOnly
            style={{
              width: '100%',
              minHeight: 240, // 160 * 1.5
              fontFamily: 'monospace',
              background: '#222',
              color: '#fff',
              whiteSpace: 'pre-wrap',
              resize: 'vertical',
              marginBottom: 16
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 32, width: '100%' }}>
          <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <label><b>GroundTruth Output</b></label>
            <textarea
              value={output}
              readOnly
              style={{
                width: '100%',
                minHeight: 480, // 320 * 1.5
                fontFamily: 'monospace',
                background: '#222',
                color: '#fff',
                whiteSpace: 'pre-wrap',
                resize: 'vertical',
                marginBottom: 16
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <label style={{ textAlign: 'center', width: '100%' }}><b>Starcoder2 Predictions</b></label>
            <textarea
              value={completion}
              readOnly
              style={{
                width: '100%',
                minHeight: 480, // 320 * 1.5
                fontFamily: 'monospace',
                background: '#222',
                color: '#fff',
                whiteSpace: 'pre-wrap',
                resize: 'vertical',
                marginBottom: 16
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <label style={{ textAlign: 'center', width: '100%' }}><b>Other Completions</b></label>
            <textarea
              value={otherCompletions.length > current ? (typeof otherCompletions[current]?.completions === 'string' ? otherCompletions[current].completions : JSON.stringify(otherCompletions[current]?.completions, null, 2)) : ''}
              readOnly
              style={{
                width: '100%',
                minHeight: 480,
                fontFamily: 'monospace',
                background: '#222',
                color: '#fff',
                whiteSpace: 'pre-wrap',
                resize: 'vertical',
                marginBottom: 16
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <label style={{ textAlign: 'center', width: '100%' }}><b>Third Completions</b></label>
            <textarea
              value={thirdCompletions.length > current ? (typeof thirdCompletions[current]?.completions === 'string' ? thirdCompletions[current].completions : JSON.stringify(thirdCompletions[current]?.completions, null, 2)) : ''}
              readOnly
              style={{
                width: '100%',
                minHeight: 480,
                fontFamily: 'monospace',
                background: '#222',
                color: '#fff',
                whiteSpace: 'pre-wrap',
                resize: 'vertical',
                marginBottom: 16
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptJsonlViewer;
