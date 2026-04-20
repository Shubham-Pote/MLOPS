import Editor from '@monaco-editor/react';

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
}

export default function MonacoCodeEditor({
  value,
  onChange,
  language = 'python',
  height = '450px',
}: MonacoCodeEditorProps) {
  return (
    <div className="monaco-container">
      <Editor
        height={height}
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val ?? '')}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbersMinChars: 3,
          renderLineHighlight: 'gutter',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
          wordWrap: 'on',
          tabSize: 4,
        }}
      />
    </div>
  );
}
