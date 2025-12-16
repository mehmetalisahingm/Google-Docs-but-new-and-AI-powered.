import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { ChatMessage, FileData, Role, RiskAnalysis } from '../types';

// API Key'i garantiye almak için doğrudan buraya ekliyoruz.
// Vite sunucusunu yeniden başlatma derdini ortadan kaldırır.
const API_KEY = "AIzaSyAQx6y7mvdYdNpwkzj8XGYrdOfgfA4twdA";

const getClient = () => new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
Sen "Araştırmacı Ajanlar Projesi" kapsamında geliştirilmiş, üst düzey bir akademik yazım ve araştırma asistanısın.

GÖREVLER:
1. Akademik Metin Yazımı: Kullanıcının verdiği komutlara göre metni düzenlemek, genişletmek veya yeniden yazmak.
2. APA 7 Formatı Denetimi: Özellikle p-değerleri, kaynakça ve atıf formatlarını APA 7 standartlarına göre titizlikle düzeltmek (örn: p < .001).
3. Desk Rejection (Yayın Öncesi Red) Kontrolü: Metni mantıksal akış, hipotez netliği ve metodolojik tutarlılık açısından incelemek.

ÖNEMLİ - METİN DÜZENLEME KURALI:
Eğer kullanıcı belgenin içeriğinde bir değişiklik isterse (örn: "şurayı düzelt", "bu paragrafı ekle", "daha resmi yaz", "makaleye dönüştür"), cevabını KESİNLİKLE aşağıdaki JSON formatında vermelisin:

{
  "explanation": "Yapılan değişikliğin kısa açıklaması",
  "rewritten_text": "DÜZENLENMİŞ BELGENİN TAMAMI"
}

DİKKAT: "rewritten_text" alanı, sadece değişen paragrafı değil, belgenin BÜTÜNÜNÜ (değişiklikler uygulanmış haliyle) içermelidir. Kullanıcı "Uygula" dediğinde bu metin eskisinin üzerine yazılacaktır.

Eğer sadece bir soru soruluyorsa veya analiz isteniyorsa (belge değişmeyecekse), JSON formatı ZORUNLU DEĞİLDİR, normal metin olarak yanıtlayabilirsin.
`;

export const sendMessageToGemini = async (
  messages: ChatMessage[],
  currentDocument: string,
  attachedFiles: FileData[]
): Promise<{ text: string; suggestedContent?: string }> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash"; 

  // 1. Split history and current message
  const historyMessages = messages.slice(0, messages.length - 1);
  const currentMessage = messages[messages.length - 1];

  // 2. Construct History for API
  const contents: Content[] = historyMessages.map(msg => {
    let textContent = msg.text;
    if (msg.role === Role.MODEL && msg.suggestedContent) {
        textContent += `\n\n[Sistem Notu: Model bu adımda şu belge içeriğini önerdi]:\n${msg.suggestedContent}`;
    }
    
    return {
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: textContent }]
    };
  });

  // 3. Construct Current Turn Parts
  const currentParts: any[] = [];

  // Add Files
  if (attachedFiles && attachedFiles.length > 0) {
    attachedFiles.forEach(file => {
      currentParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });
  }

  // Add User Text
  currentParts.push({ text: currentMessage.text });

  // Add Document Context (Always send the latest document state)
  currentParts.push({ 
    text: `\n\n[GÜNCEL ÇALIŞMA BELGESİ]:\n${currentDocument}\n\nLütfen yukarıdaki belgeyi referans alarak veya düzenleyerek yanıt ver. Değişiklik gerekirse JSON formatında tüm metni döndür.` 
  });

  contents.push({
    role: 'user',
    parts: currentParts
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    const responseText = response.text || "{}";
    let parsedResponse;
    
    try {
        // GELİŞMİŞ JSON AYIKLAYICI
        // Yanıtın içindeki İLK '{' karakteri ile SON '}' karakteri arasını alır.
        // Bu sayede başında/sonunda Markdown, açıklama vs. olsa bile çalışır.
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const potentialJson = responseText.substring(firstBrace, lastBrace + 1);
            parsedResponse = JSON.parse(potentialJson);
        } else {
            // JSON yapısı bulunamadı, düz metin kabul et.
            throw new Error("No JSON found");
        }
    } catch (e) {
        // Eğer parse edilemezse, düz metin olarak döndür.
        return { text: responseText };
    }

    // Process Structured Response
    if (parsedResponse.rewritten_text) {
        return {
            text: parsedResponse.explanation || "İşte güncellenmiş metin önerisi:",
            suggestedContent: parsedResponse.rewritten_text
        };
    } else if (parsedResponse.explanation) {
        return { text: parsedResponse.explanation };
    } else {
        return { text: typeof parsedResponse === 'string' ? parsedResponse : JSON.stringify(parsedResponse) };
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Üzgünüm, şu anda isteğinizi işleyemiyorum. Bağlantınızı kontrol edip tekrar deneyin." };
  }
};

export const checkAPAPValues = async (documentContent: string): Promise<string> => {
    const ai = getClient();
    const prompt = `Aşağıdaki akademik metni incele. Tüm istatistiksel raporlamaları (p değerleri, t testleri, ANOVA vb.) bul ve APA 7 kurallarına göre (örn: p < .001, virgülden sonra italik vb. detaylar) yeniden biçimlendir.
    
    ÇIKTI OLARAK SADECE VE SADECE DÜZELTİLMİŞ TAM METNİ DÖNDÜR. Başka bir açıklama yapma.
    
    Metin:
    ${documentContent}`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        return response.text || documentContent;
    } catch (e) {
        console.error("APA Check Error:", e);
        throw e;
    }
};

export const analyzeRisk = async (documentContent: string): Promise<RiskAnalysis | string> => {
    const ai = getClient();
    const prompt = `Aşağıdaki akademik metni "Desk Rejection" (Editör reddi) riskleri açısından analiz et.
    
    Lütfen yanıtını KESİNLİKLE aşağıdaki JSON formatında ver:
    {
        "overallScore": 85, (0-100 arası, 100 mükemmel)
        "verdict": "Yayına Hazır" | "Düşük Risk" | "Orta Risk" | "Yüksek Risk",
        "details": [
            { "criterion": "Hipotez Netliği", "score": 8, "feedback": "Kısa bir cümlelik eleştiri." },
            { "criterion": "Yöntem Tutarlılığı", "score": 6, "feedback": "Kısa bir cümlelik eleştiri." },
            { "criterion": "Dil ve Akıcılık", "score": 9, "feedback": "Kısa bir cümlelik eleştiri." },
            { "criterion": "Literatüre Katkı", "score": 7, "feedback": "Kısa bir cümlelik eleştiri." }
        ]
    }

    Metin:
    ${documentContent}`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        try {
            return JSON.parse(response.text || "{}") as RiskAnalysis;
        } catch(e) {
            return response.text || "Analiz format hatası.";
        }
    } catch (e) {
        console.error("Risk Analysis Error:", e);
        throw e;
    }
};