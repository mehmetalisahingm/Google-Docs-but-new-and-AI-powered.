import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Role, FileData, RiskAnalysis } from '../types';
import { Icons } from '../utils/icons';

interface AgentSidebarProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, files: FileData[]) => void;
  onApplySuggestion: (suggestion: string) => void;
  isLoading: boolean;
  onRunCheck: (type: 'apa' | 'risk') => void;
}

const LoadingIndicator = () => {
    const [text, setText] = useState("Analiz ediliyor...");
    
    useEffect(() => {
        const texts = ["Literatür taranıyor...", "Veriler işleniyor...", "Hipotezler kontrol ediliyor...", "Yanıt oluşturuluyor..."];
        let i = 0;
        const interval = setInterval(() => {
            setText(texts[i]);
            i = (i + 1) % texts.length;
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex justify-start animate-pulse">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-academic-100 shadow-sm flex items-center gap-3">
               <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </div>
               <span className="text-xs text-academic-500 font-medium tracking-wide">{text}</span>
            </div>
        </div>
    );
};

const RiskCard = ({ analysis }: { analysis: RiskAnalysis }) => {
    const getColor = (score: number) => {
        if (score >= 8) return 'bg-green-500';
        if (score >= 5) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getVerdictColor = (verdict: string) => {
        if (verdict.includes('Yüksek')) return 'text-red-600 bg-red-50 border-red-200';
        if (verdict.includes('Orta')) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-green-600 bg-green-50 border-green-200';
    };

    return (
        <div className="bg-white rounded-xl border border-academic-200 overflow-hidden shadow-sm mt-2">
            <div className="p-4 border-b border-academic-100 bg-academic-50/50 flex justify-between items-center">
                <span className="font-bold text-academic-700 text-sm">Editör Analiz Raporu</span>
                <span className={`text-xs px-2 py-1 rounded-full font-bold border ${getVerdictColor(analysis.verdict)}`}>
                    {analysis.verdict}
                </span>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-academic-500 font-semibold uppercase tracking-wider">Yayınlanabilirlik Skoru</span>
                    <span className="text-2xl font-bold text-academic-800">{analysis.overallScore}<span className="text-sm text-academic-400 font-normal">/100</span></span>
                </div>
                
                {/* Progress Bar for Overall Score */}
                <div className="w-full bg-academic-100 rounded-full h-2 mb-4">
                    <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${getColor(analysis.overallScore / 10)}`} 
                        style={{ width: `${analysis.overallScore}%` }}
                    ></div>
                </div>

                <div className="space-y-3">
                    {analysis.details.map((detail, idx) => (
                        <div key={idx} className="group">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-semibold text-academic-700">{detail.criterion}</span>
                                <span className="text-academic-500">{detail.score}/10</span>
                            </div>
                            <div className="w-full bg-academic-100 rounded-full h-1.5 mb-1.5">
                                <div 
                                    className={`h-1.5 rounded-full transition-all duration-700 ${getColor(detail.score)}`} 
                                    style={{ width: `${detail.score * 10}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-academic-400 italic leading-tight">{detail.feedback}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AgentSidebar: React.FC<AgentSidebarProps> = ({ 
  messages, 
  onSendMessage, 
  onApplySuggestion, 
  isLoading,
  onRunCheck 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;
    onSendMessage(inputValue, attachedFiles);
    setInputValue('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64String = (event.target.result as string).split(',')[1];
          setAttachedFiles(prev => [...prev, {
            name: file.name,
            mimeType: file.type,
            data: base64String
          }]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-academic-50 border-r border-academic-200 w-full md:w-96 lg:w-[480px] flex-shrink-0 shadow-2xl z-20">
      
      {/* Header */}
      <div className="p-5 border-b border-academic-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold text-academic-900 flex items-center gap-2 font-serif tracking-tight">
                <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-sm">
                    <Icons.Bot className="w-5 h-5" />
                </div>
                Araştırmacı Ajan
                </h2>
                <div className="flex items-center gap-1 mt-1.5 ml-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[10px] uppercase font-bold text-academic-400 tracking-wider">Sistem Aktif & İzleniyor</p>
                </div>
            </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => onRunCheck('apa')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-academic-600 text-xs font-semibold rounded-lg hover:bg-blue-50 hover:text-blue-700 transition whitespace-nowrap border border-academic-200 shadow-sm"
          >
            <Icons.CheckCircle className="w-3.5 h-3.5" />
            APA Formatı
          </button>
          <button 
            onClick={() => onRunCheck('risk')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-academic-600 text-xs font-semibold rounded-lg hover:bg-amber-50 hover:text-amber-700 transition whitespace-nowrap border border-academic-200 shadow-sm"
          >
            <Icons.AlertTriangle className="w-3.5 h-3.5" />
            Red Riski
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-academic-50 to-white">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-academic-400 p-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-academic-100">
                <Icons.Wand2 className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
            <h3 className="text-lg font-bold text-academic-700 mb-2">Asistanınız Hazır</h3>
            <p className="text-sm max-w-[250px]">Makalenizi yükleyin veya yazmaya başlayın. APA, analiz ve düzenleme için buradayım.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div 
              className={`max-w-[90%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                msg.role === Role.USER 
                  ? 'bg-academic-800 text-white rounded-br-none shadow-md' 
                  : 'bg-white text-academic-800 border border-academic-100 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.role === Role.MODEL && !msg.riskAnalysis && (
                  <div className="mb-2 flex items-center gap-2 opacity-50">
                      <Icons.Bot className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Ajan Yanıtı</span>
                  </div>
              )}
              
              <div className="whitespace-pre-wrap">{msg.text}</div>
              
              {/* Risk Analysis Card Visualization */}
              {msg.riskAnalysis && <RiskCard analysis={msg.riskAnalysis} />}

              {msg.suggestedContent && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 uppercase tracking-wide">
                       <Icons.Wand2 className="w-3 h-3" /> Düzenleme Önerisi
                    </span>
                    <button 
                       onClick={() => onApplySuggestion(msg.suggestedContent!)}
                       className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition flex items-center gap-1.5 font-medium shadow-sm active:transform active:scale-95"
                    >
                      Belgeye Aktar (Word) <Icons.ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="bg-academic-50/80 p-3 rounded-lg text-xs text-academic-700 font-serif border border-academic-200 max-h-40 overflow-y-auto italic">
                    {msg.suggestedContent.substring(0, 200)}...
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-academic-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((f, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1.5 rounded-md flex items-center gap-2 font-medium">
                <Icons.FileText className="w-3.5 h-3.5" /> {f.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-3 items-end">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-academic-500 hover:bg-academic-50 hover:text-academic-700 rounded-xl transition border border-transparent hover:border-academic-200"
                title="Dosya Ekle (PDF/Görsel)"
            >
                <Icons.Paperclip className="w-5 h-5" />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf,image/*"
                onChange={handleFileChange}
            />
            <div className="flex-1 relative">
                <textarea
                    className="w-full bg-academic-50 border border-academic-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-3 text-sm transition outline-none resize-none min-h-[50px] max-h-[120px]"
                    placeholder="Bir komut verin (örn: 'Yazımı akademik dille güçlendir')..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    disabled={isLoading}
                    rows={1}
                />
            </div>
            <button 
            onClick={handleSend}
            disabled={isLoading || (!inputValue && attachedFiles.length === 0)}
            className="p-3 bg-academic-900 text-white rounded-xl hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-academic-900/20 active:transform active:scale-95"
            >
            <Icons.Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AgentSidebar;