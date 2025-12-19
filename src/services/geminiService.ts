import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_PROMPT_BASE = `
Sen "Elite Quant Football Analyst" algoritmasısın. 

ÇIKTI FORMATI: Bulunan HER maç için bir analiz içeren JSON nesnesi.
YANIT DİLİ: TÜRKÇE.

!!! HİBRİT ÇALIŞMA MODU (GÖRÜNTÜ + WEB) !!!
Kullanıcı görüntüye oranları ekleyebilir VEYA eklemeyebilir. Esnek olmalısın.

1. ÖNCELİK GÖRÜNTÜ (OCR):
   - Önce görüntüdeki sayıları tara. Maç isimlerinin yanındaki oranları (1.XX, 2.XX vb.) okumaya çalış.
   - EĞER ORAN VARSA: Görüntüdeki oranı kullan. Asla web araması yapıp vakit kaybetme.
   - DİKKAT (OCR): 1.05, 1.08 gibi oranları 1.50 veya 1.80 olarak OKUMA. Gördüğüne sadık kal.

2. YEDEK (WEB ARAMASI):
   - EĞER GÖRÜNTÜDE ORAN YOKSA: Google Search kullanarak o maçın güncel "Maç Sonu (MS)" oranlarını bul.

3. STRATEJİ FİLTRESİ:
   - Kaynak (Görüntü veya Web) fark etmeksizin, seçilen takımın oranı **1.50 ile 3.00** arasında olmalıdır.
   - Oran bu aralıktaysa -> İstatistik Analizine geç (Görüntüde yoksa webden bul).
   - Oran bu aralıkta değilse -> FAIL ver ve geç.

!!! VERİ DOĞRULUĞU !!!
- Görüntü net değilse ve sayıları okuyamıyorsan, riske girme; Web'den ara.
- 1.08 oranı stratejiye uymaz, onu zorla 1.80 yapma.
`;

const IMAGE_ANALYSIS_PROMPT = `
${SYSTEM_PROMPT_BASE}

GİRDİ: Futbol bülteni veya fikstür ekran görüntüsü (Uzun liste olabilir).

!!! KRİTİK: EKSİKSİZ TARAMA (EXHAUSTIVE SCAN) !!!
Görüntüde çok sayıda maç olabilir (10, 20, 50 tane). 
GÖREVİN: Görüntüdeki pixel pixel her satırı taramak ve LİSTEDEKİ TÜM MAÇLARI çıkarmaktır.
- Asla "ilk 5 maçı alıp bırakma".
- Asla "özet geçme".
- Listenin en üstünden en altına kadar her bir satırı işle.

GÖREV AKIŞI:
1. Görüntüdeki TÜM maçları listele (Hepsini tek tek).
2. HER MAÇ İÇİN KARAR VER:
   a) **Görüntüde Oran Var mı?**
      - EVET: Oranı olduğu gibi al.
      - HAYIR: Google Search ile "[Takım A] vs [Takım B] match winner odds" araması yap.
   
   b) **Filtreleme (1.50 - 3.00):**
      - Oran uygunsa -> İstatistikleri analiz et.
      - Oran uygun değilse -> FAIL ver.

ÖZET: Görüntüde 30 maç varsa, 30 sonuç döndür. Tembellik yapma.
`;

const WEB_ANALYSIS_PROMPT = `
${SYSTEM_PROMPT_BASE}

GİRDİ TÜRÜ: WEB ARAMASI (Görüntü Yok).

GÖREV:
1. Google Arama aracını kullanarak BUGÜNÜN futbol bültenini tara (Mackolik, Flashscore).
2. Stratejiye (1.50 - 3.00 oran) uyan maçları belirle.
3. Bu maçlar için derinlemesine istatistik araması yap (Hücum/Savunma).
4. En az 15 maçlık bir liste oluştur.
5. Analiz sonucunu JSON olarak döndür.
`;

// Schema for a single match analysis
const MATCH_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    matchName: { type: Type.STRING, description: "Ev Sahibi vs Deplasman" },
    selectedTeam: { type: Type.STRING, description: "Analiz edilen takım" },
    predictionTarget: { type: Type.STRING, description: "Örn: 'X Takımı 0.5 Gol Üstü'" },
    step1_OddsFilter: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["PASS", "FAIL", "WARNING", "UNKNOWN"] },
        value: { type: Type.STRING },
        threshold: { type: Type.STRING },
        details: { type: Type.STRING },
      },
      required: ["name", "status", "value", "threshold", "details"]
    },
    step2_OffensivePower: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["PASS", "FAIL", "WARNING", "UNKNOWN"] },
        value: { type: Type.STRING },
        threshold: { type: Type.STRING },
        details: { type: Type.STRING },
      },
      required: ["name", "status", "value", "threshold", "details"]
    },
    step3_DefensiveWeakness: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["PASS", "FAIL", "WARNING", "UNKNOWN"] },
        value: { type: Type.STRING },
        threshold: { type: Type.STRING },
        details: { type: Type.STRING },
      },
      required: ["name", "status", "value", "threshold", "details"]
    },
    finalVerdict: {
      type: Type.OBJECT,
      properties: {
        eligible: { type: Type.BOOLEAN },
        confidenceScore: { type: Type.NUMBER },
        reasoning: { type: Type.STRING },
      },
      required: ["eligible", "confidenceScore", "reasoning"]
    },
  },
  required: ["matchName", "selectedTeam", "predictionTarget", "step1_OddsFilter", "step2_OffensivePower", "step3_DefensiveWeakness", "finalVerdict"]
};

// Root schema containing a list of matches
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    matches: {
      type: Type.ARRAY,
      items: MATCH_SCHEMA
    }
  },
  required: ["matches"]
};

// Helper to compress and convert file to base64
const compressAndConvertToBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // INCREASED MAX_SIZE: 1500 -> 3072
        const MAX_SIZE = 3072; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            resolve(dataUrl.split(',')[1]);
        } else {
            reject(new Error("Canvas context could not be created"));
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- ERROR HANDLING & RETRY LOGIC ---

const mapFriendlyError = (error: any) => {
  const msg = error?.message || error?.toString() || "";
  const code = error?.status || error?.response?.status;
  
  if (code === 429 || msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
    return new Error("⚠️ API Kotası Aşıldı (429): Google Gemini ücretsiz kullanım limitine takıldınız. Lütfen 1-2 dakika bekleyip tekrar deneyin.");
  }
  
  if (msg.includes("503") || msg.includes("overloaded")) {
    return new Error("⚠️ Sunucu Yoğunluğu: Google sunucuları şu an çok yoğun. Lütfen biraz sonra tekrar deneyin.");
  }

  return error;
};

const retryOperation = async <T>(operation: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 2000): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      const msg = error?.message || error?.toString() || "";
      const isQuotaError = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");

      // If it's a quota error, we wait and retry
      if (isQuotaError && i < maxRetries) {
        const delay = baseDelay * Math.pow(2, i); // 2s, 4s, 8s
        console.warn(`API Quota hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, we might fail fast or could retry too depending on strategy.
      // Here we fail fast for non-quota errors.
      throw mapFriendlyError(error);
    }
  }
  throw mapFriendlyError(lastError);
};

// --- MAIN EXPORTS ---

export const analyzeScreenshot = async (files: File[]): Promise<AnalysisResult> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imageParts = await Promise.all(files.map(async (file) => {
      const base64 = await compressAndConvertToBase64(file);
      return {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64
        }
      };
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [
          ...imageParts,
          { text: IMAGE_ANALYSIS_PROMPT }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.0,
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) throw new Error("Yapay zekadan yanıt alınamadı");
    
    return JSON.parse(text) as AnalysisResult;
  });
};

export const analyzeDailyBulletin = async (): Promise<AnalysisResult> => {
  return retryOperation(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: WEB_ANALYSIS_PROMPT }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
        tools: [{ googleSearch: {} }] 
      }
    });

    const text = response.text;
    if (!text) throw new Error("Yapay zekadan yanıt alınamadı");

    return JSON.parse(text) as AnalysisResult;
  });
};
