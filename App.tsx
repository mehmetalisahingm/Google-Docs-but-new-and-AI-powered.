import React, { useState, useEffect } from 'react';
import AgentSidebar from './components/AgentSidebar';
import DocumentEditor from './components/DocumentEditor';
import { ChatMessage, Role, FileData, RiskAnalysis } from './types';
import { sendMessageToGemini, checkAPAPValues, analyzeRisk } from './services/geminiService';
import { Icons } from './utils/icons';

const App = () => {
  // Başlangıçta boş belge ile başla ki karışıklık olmasın
  const [documentContent, setDocumentContent] = useState<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // İlk yüklemede PROJE MANİFESTOSU (Karşılama Mesajı)
  useEffect(() => {
    setMessages([
        {
            id: 'welcome',
            role: Role.MODEL,
            text: `**Araştırmacı Ajanlar Projesi**
Bu çalışma