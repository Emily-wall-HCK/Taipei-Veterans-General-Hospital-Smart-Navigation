import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("GEMINI_API_KEY is not set. Gemini features will run in simulations.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

// 1. API: AI Chat Assistant with grounding / VGH hospital prompt
app.post("/api/help", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  if (!ai) {
    // Graceful fallback for simulation if API key is missing
    const tempText = `您好！我是榮總智慧導流 AI 助理。關於「${message}」，建議首選前往「中正樓一樓」服務台。您也可以立刻在 App 首頁輸入該地點，開啟 AR 實境導航，或者在看診行程中一鍵規劃。希望這有幫助到您！`;
    return res.json({ text: tempText });
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `你是「榮總智慧導航（VGH Smart Guide）」App 內建的「榮總健檢與導醫 AI 客服助理」。你的任務是協助病患、家屬和長輩在龐大複雜的台北榮總院區中順利找到看診科別、抽血櫃台、藥局與停車場。

台北榮總主要院區包括：
- 第一門診大樓：主要是一般科別門診、繳費櫃台、藥局和部分抽血。
- 第二門診大樓：主要是牙科、中醫、部分抽血、第二門診藥局。
- 中正樓：住院大樓、主要手術室、急診部、重症中心、高階放射檢查（MRI/CT、超音波等）、中正樓1樓大廳內有中央抽血櫃台、住院登記處、常溫藥局、便利商店。
- 急診部：位於中正樓後側或急診專用通道，24小時開放。
- 檢驗部與抽血：中正樓1樓中央抽血區（最常去）以及第一、第二門診部分樓層皆有抽血。
- 藥局：中正樓1樓藥局（24小時開）及各門診大樓。
- 癌症醫學中心、重粒子中心：最新高科技精準醫療院區，位於石牌路二段另一側，有配合之無障礙接駁專車。
- 智慧醫療展示區：位於中正樓大廳大面壁畫旁的2樓空橋區。
- 停車場：包括 立體停車場、第二門診地下停車場 與 中正樓地下停車場，大約剩餘車位都可以在系統即時查詢。

請遵守以下規則：
1. 以繁體中文(台灣)回答，口氣必須極度溫和、親切、敬業、同理，對長輩要說「您」。
2. 簡短回覆，多層級條列，關鍵字體加粗，方便視力不太好的長輩在手機上輕鬆閱讀，每句不宜太長。
3. 提醒使用者可以直接在 App 設定「預估到達時間、擁擠避開、無障礙與輪椅優先模式」。
4. 告訴使用者如果累了或走累了，可隨時點擊「呼叫輪椅接駁」或前往最近的「志工服務台」。
5. 如果使用者提到「跌倒」、「胸口痛」、「呼吸困難」或「出血」等緊急醫療事件，請立刻在最前面回覆：「🚨 偵測到緊急狀況！請立刻點擊畫面的『緊急 SOS 一鍵求援』，我們已通報最近的醫護站與安全保全中心，並為您發送精準室內 Beacon 位置！請保持冷靜就地坐下休息！」
6. 回應時，如果使用者詢問具體如何去哪裡，請附帶加上導航引導詞，例如「您可以直接在 App 目的地點選：【心臟內科】來開啟 AR 航向引導唷！」`,
      },
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "Gemini processing failed" });
  }
});

// 2. API: Smart recommendation for queues / AI智慧推薦排程
app.post("/api/recommend", async (req, res) => {
  const { currentSchedules } = req.body;
  
  if (!ai) {
    const defaultRec = `### 【AI 最佳排程推薦】\n\n由於目前 **抽血櫃台（等待人數：45 人）** 人潮高度擁擠，系統為您重新規劃高效率就醫流程：\n\n1. 🚶 **第一站：X光檢查** (目前僅 3 人等待，預估 5 分鐘內完成)\n2. 🏥 **第二站：胸腔科門診** (目前 8 人排隊，預估 15~20 分鐘後叫號)\n3. 💉 **第三站：抽血檢驗** (此時近中午人潮已開始分流，預估等待時間縮短 50%)\n\n💡 *溫馨提示：系統已為您開啟「無障礙遮雨路線」，全程皆有電梯與連廊，請安心前行。*`;
    return res.json({ recommendation: defaultRec });
  }

  try {
    const prompt = `依據以下榮總病患當日的看診與檢查行程，以及目前各區即時人流與排隊等待情況，請利用您的 AI 智慧為病患重新安排一個最高效、最省時、最友善的就醫流程順序：
    
    看診與檢查項目與等待狀態：
    ${JSON.stringify(currentSchedules, null, 2)}
    
    請以繁體中文(台灣)回覆，並採用清晰精緻的 Markdown 格式：
    1. 【AI 最佳排程推薦列表】：推薦點對點的就醫先後順序及預估總用時。
    2. 【優化原因解釋】：為什麼這樣調整（例如先去沒人排隊的檢查、避開抽血巔峰時間）。
    3. 【貼心叮嚀】：高齡友善、無障礙走道、或者是防迷路和停車繳費建議。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ recommendation: response.text });
  } catch (err: any) {
    console.error("Gemini Recommendation Error:", err);
    res.status(500).json({ error: err.message || "Queue evaluation failed" });
  }
});

// Serve frontend with Vite in dev, static files in production
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server fully operational on port ${PORT}`);
});
