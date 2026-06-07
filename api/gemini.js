const DEFAULT_MODELS = ['gemini-3.5-flash', 'gemini-3.1-pro', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'];

// 서버 인메모리 캐싱 및 쿨다운 상태 관리
let cachedModels = [];
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간 캐싱

const cooldowns = {};

function parseModelMeta(name) {
  const cleanName = name.replace(/^models\//, '');
  const match = cleanName.match(/^gemini-(\d+(?:\.\d+)?)-([a-z0-9\-]+)/);
  if (!match) return { version: 0, tier: 'other', cleanName };
  
  const version = parseFloat(match[1]);
  const tier = match[2];
  return { version, tier, cleanName };
}

function sortModels(modelNames) {
  const filtered = modelNames
    .map(name => parseModelMeta(name))
    .filter(m => m.cleanName.startsWith('gemini-') && 
                 !m.cleanName.includes('image') && 
                 !m.cleanName.includes('embedding') && 
                 !m.cleanName.includes('experimental') &&
                 !m.cleanName.includes('thinking')); // 불필요한 모델 제외
  
  const tierPriority = {
    'flash-lite-preview': 1,
    'flash-lite': 2,
    'flash': 3,
    'pro': 4
  };

  filtered.sort((a, b) => {
    if (b.version !== a.version) {
      return b.version - a.version;
    }
    const priorityA = tierPriority[a.tier] || 99;
    const priorityB = tierPriority[b.tier] || 99;
    return priorityA - priorityB;
  });

  return filtered.map(m => m.cleanName);
}

async function fetchLatestModels(apiKey) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.models) return null;
    
    const modelNames = data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
    
    return sortModels(modelNames);
  } catch (e) {
    console.error('[Auto Model Update] Failed to fetch models from Google:', e);
    return null;
  }
}

async function getOrderedModels(apiKey) {
  const now = Date.now();
  const currentDate = new Date(now);
  const lastDate = new Date(lastFetchTime);

  const isFirstOfMonth = currentDate.getDate() === 1;
  const isNewMonth = currentDate.getMonth() !== lastDate.getMonth() || currentDate.getFullYear() !== lastDate.getFullYear();
  const needsRefresh = cachedModels.length === 0 || 
                         (now - lastFetchTime > CACHE_DURATION) || 
                         (isFirstOfMonth && isNewMonth);

  if (needsRefresh && apiKey) {
    const fetched = await fetchLatestModels(apiKey);
    if (fetched && fetched.length > 0) {
      cachedModels = fetched;
      lastFetchTime = now;
      console.log('[Auto Model Update] Successfully updated models list:', cachedModels);
    }
  }

  const baseModels = cachedModels.length > 0 ? cachedModels : DEFAULT_MODELS;
  const active = [];
  const cooling = [];

  for (const model of baseModels) {
    if (cooldowns[model] && cooldowns[model] > now) {
      cooling.push(model);
    } else {
      active.push(model);
    }
  }
  return [...active, ...cooling];
}

function setCooldown(model) {
  cooldowns[model] = Date.now() + 5 * 60 * 1000; // 5분간 쿨다운
  console.warn(`[Smart Fallback] ${model} enters 5-minute cooldown due to API failure.`);
}

function clearCooldown(model) {
  if (cooldowns[model]) {
    delete cooldowns[model];
    console.log(`[Smart Fallback] ${model} cooldown cleared.`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
  }

  try {
    const { promptContext, docInstruction, fileDataList = [], customSysInstruction, systemInstruction } = req.body || {};
    const parts = [];

    for (const fd of fileDataList) {
      parts.push({
        inlineData: {
          data: String(fd.base64 || '').split(',')[1] || fd.base64,
          mimeType: fd.mimeType
        }
      });
    }

    parts.push({
      text: `${docInstruction}\n\n[입력 정보 및 요청사항]:\n${promptContext}`
    });

    let lastError = '';
    const orderedModels = await getOrderedModels(apiKey);
    
    for (const model of orderedModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: customSysInstruction || systemInstruction || '' }] },
            contents: [{ role: 'user', parts }],
            generationConfig: { temperature: 0.3 }
          })
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          lastError = errorBody.error?.message || `API Error ${response.status}`;
          
          // 429 Too Many Requests 등 장애 발생 시 쿨다운 설정
          if (response.status === 429 || response.status >= 500) {
            setCooldown(model);
          }
          console.warn(`[Smart Fallback] Model ${model} failed with status ${response.status}:`, lastError);
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.map(part => part.text).join('') || '';
        if (text) {
          clearCooldown(model); // 성공한 모델은 쿨다운 해제
          return res.status(200).json({ text, model });
        }
      } catch (e) {
        lastError = e.message;
        setCooldown(model); // 네트워크 오류 또는 시간초과 시 쿨다운 설정
        console.warn(`[Smart Fallback] Model ${model} network/unexpected error:`, e);
      }
    }

    return res.status(502).json({ error: lastError || 'Gemini response was empty.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
