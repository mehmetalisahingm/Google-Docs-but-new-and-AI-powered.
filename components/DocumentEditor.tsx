import React, { useRef, useEffect } from 'react';

interface DocumentEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  className?: string;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ content, onChange, className }) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic
  useEffect(() => {
    const textarea = editorRef.current;
    if (textarea) {
      // Yüksekliği sıfırlayıp içeriğe göre yeniden hesapla
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className={`relative w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white paper-shadow flex flex-col transition-all duration-200 ${className}`}>
      {/* Kağıt dolgu boşlukları (Standart A4 kenar boşlukları gibi) */}
      <div className="flex-1 px-[25mm] py-[25mm]">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full resize-none outline-none border-none font-serif text-lg leading-relaxed text-gray-900 placeholder-gray-300 overflow-hidden bg-transparent"
          placeholder="Akademik çalışmanızı buraya yazın veya yapıştırın..."
          spellCheck={false}
          // Minimum yükseklik, boşken bile yazılabilir alan hissi verir
          style={{ minHeight: '600px' }}
        />
      </div>
    </div>
  );
};

export default DocumentEditor;