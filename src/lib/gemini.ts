import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('AQ') && apiKey.length < 30) {
    // If it's a default/placeholder or not set
    return null;
  }
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.error('Failed to initialize GoogleGenerativeAI:', e);
    return null;
  }
};

const genAI = getGeminiClient();

// Helper to correct character offsets from Gemini response
export function findExactOffsets(
  body: string,
  mentionText: string,
  suggestedStart: number
): { startOffset: number; endOffset: number } | null {
  if (!mentionText) return null;
  
  // Clean mention text (trim spaces)
  const query = mentionText.trim();
  
  // Try around the suggested start offset
  let index = body.indexOf(query, Math.max(0, suggestedStart - 15));
  if (index !== -1) {
    return { startOffset: index, endOffset: index + query.length };
  }
  
  // Try from the beginning of the text
  index = body.indexOf(query);
  if (index !== -1) {
    return { startOffset: index, endOffset: index + query.length };
  }
  
  return null;
}

export interface ExtractedEntity {
  name: string;
  mentions: Array<{
    text: string;
    startOffset: number;
    endOffset: number;
  }>;
}

export async function extractEntities(headline: string, body: string): Promise<ExtractedEntity[]> {
  if (!genAI) {
    console.warn('Gemini client not initialized. Falling back to local mock extraction.');
    return getMockExtraction(body);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
    const prompt = `You are an expert geopolitical intelligence analyst.
Analyze the following article:
Headline: "${headline}"
Body: "${body}"

Extract all load-bearing entities (organizations, treaties, agreements, geographic flashpoints, technical/political terms that a general reader might not know).
For each entity, you MUST find its EXACT text mentions, and their start and end character offsets inside the article body.
The offsets must be 0-indexed, and the substring \`body.substring(startOffset, endOffset)\` MUST EXACTLY match the mention text.

Return your response strictly as a JSON array of objects with this structure:
[
  {
    "name": "canonical name of the entity (e.g. NATO)",
    "mentions": [
      {
        "text": "exact text from the body",
        "startOffset": 12,
        "endOffset": 16
      }
    ]
  }
]`;

    const response = await model.generateContent(prompt);

    const text = response.response.text();
    const result = JSON.parse(text) as ExtractedEntity[];

    // Correct offsets
    const correctedResult: ExtractedEntity[] = [];
    for (const ent of result) {
      const correctedMentions = [];
      for (const m of ent.mentions) {
        const offset = findExactOffsets(body, m.text, m.startOffset);
        if (offset) {
          correctedMentions.push({
            text: m.text,
            startOffset: offset.startOffset,
            endOffset: offset.endOffset,
          });
        }
      }
      if (correctedMentions.length > 0) {
        correctedResult.push({
          name: ent.name,
          mentions: correctedMentions,
        });
      }
    }

    return correctedResult;
  } catch (error) {
    console.error('Error during Gemini entity extraction:', error);
    return getMockExtraction(body);
  }
}

export interface EntityContext {
  oneLiner: string;
  certainty: string;
  whyNow: string[];
  stakeholders: Array<{ name: string; wants: string }>;
}

export async function generateEntityContext(entityName: string, articleContext: string): Promise<EntityContext> {
  if (!genAI) {
    console.warn('Gemini client not initialized. Falling back to local mock context generation.');
    return getMockContext(entityName);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
    const prompt = `You are an expert geopolitical intelligence analyst.
Provide detailed context for the entity "${entityName}" based on the following article snippet where it is mentioned:
"${articleContext}"

Return your response strictly as a JSON object with this structure:
{
  "oneLiner": "A single-sentence clear definition of the entity (max 20 words).",
  "certainty": "confirmed | official statement | analyst reading | unconfirmed",
  "whyNow": [
    "Prior event/context explanation 1 (ordered, chronological causal chain, 3-5 bullets total)",
    "Prior event/context explanation 2",
    "Prior event/context explanation 3"
  ],
  "stakeholders": [
    {
      "name": "Stakeholder Name",
      "wants": "What they want / their motivation in this context (max 15 words)"
    }
  ]
}`;

    const response = await model.generateContent(prompt);

    const text = response.response.text();
    return JSON.parse(text) as EntityContext;
  } catch (error) {
    console.error(`Error during Gemini context generation for ${entityName}:`, error);
    return getMockContext(entityName);
  }
}

// Fallback Mock Generators
function getMockExtraction(body: string): ExtractedEntity[] {
  const result: ExtractedEntity[] = [];
  const lowercaseBody = body.toLowerCase();

  const standardEntities = [
    { name: 'NATO', keywords: ['nato', 'alliance'] },
    { name: 'Antalya', keywords: ['antalya'] },
    { name: 'Mediterranean', keywords: ['mediterranean'] },
    { name: 'Arctic Council', keywords: ['arctic council', 'council'] },
    { name: 'Tromsø', keywords: ['tromsø', 'tromso'] },
    { name: 'Norway', keywords: ['norway', 'norwegian'] },
    { name: 'Singapore', keywords: ['singapore'] },
    { name: 'Strait of Malacca', keywords: ['strait of malacca', 'channel'] }
  ];

  standardEntities.forEach(ent => {
    const mentions: Array<{ text: string; startOffset: number; endOffset: number }> = [];
    
    ent.keywords.forEach(keyword => {
      let pos = lowercaseBody.indexOf(keyword);
      while (pos !== -1) {
        const text = body.substring(pos, pos + keyword.length);
        // Avoid duplicate/overlapping positions
        if (!mentions.some(m => m.startOffset === pos)) {
          mentions.push({
            text,
            startOffset: pos,
            endOffset: pos + keyword.length
          });
        }
        pos = lowercaseBody.indexOf(keyword, pos + 1);
      }
    });

    if (mentions.length > 0) {
      result.push({
        name: ent.name,
        mentions
      });
    }
  });

  return result;
}

function getMockContext(name: string): EntityContext {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('nato')) {
    return {
      oneLiner: 'North Atlantic Treaty Organization, a political and military alliance of 32 European and North American countries.',
      certainty: 'confirmed',
      whyNow: [
        'Tensions in the Eastern Mediterranean require unified command presence.',
        'Maritime border disputes between Greece and Turkey need mediation.',
        'Reinforcing Eastern flank defense posture ahead of winter exercises.'
      ],
      stakeholders: [
        { name: 'United States', wants: 'Maintenance of Alliance unity and collective deterrence' },
        { name: 'Turkey', wants: 'Recognition of its maritime jurisdiction and regional security role' }
      ]
    };
  }
  
  return {
    oneLiner: `Geopolitical entity representing ${name}, playing a key role in the current regional landscape.`,
    certainty: 'analyst reading',
    whyNow: [
      `Recent diplomatic maneuvers shift the focus of regional security to ${name}.`,
      `Opening of negotiations regarding maritime/border lines in close proximity.`,
      `Heightened media scrutiny regarding resource extraction and supply line defense.`
    ],
    stakeholders: [
      { name: 'Regional Actors', wants: `Securing access to economic resources related to ${name}` },
      { name: 'International Community', wants: 'Maintaining open lines of communication and stable border treaties' }
    ]
  };
}
