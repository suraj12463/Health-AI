
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MedicalAnalysisResult, AnalysisSchema } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the exact JSON schema we want the AI to follow
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    confidenceScore: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High'],
      description: "Confidence in the analysis based on data quality (e.g. image clarity)."
    },
    confidenceReason: {
      type: Type.STRING,
      description: "Brief explanation for the confidence score."
    },
    riskLevel: {
      type: Type.STRING,
      enum: ['Low', 'Moderate', 'High', 'Critical'],
      description: "Overall health risk assessment."
    },
    riskFactors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category of risk (e.g. 'Lifestyle', 'Genetic', 'Acute Marker', 'Comorbidity')" },
          factor: { type: Type.STRING },
          explanation: { type: Type.STRING }
        }
      }
    },
    keyFindings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "The parameter name (e.g. 'Blood Pressure')" },
          value: { type: Type.STRING, description: "The observed value and status (e.g. '140/90 mmHg (Hypertensive)')" }
        }
      }
    },
    earlyWarningAlerts: {
      type: Type.STRING,
      description: "Critical warnings or 'None detected' if clear."
    },
    clinicalInterpretation: {
      type: Type.STRING,
      description: "Detailed medical analysis and differential diagnosis."
    },
    simplifiedExplanation: {
      type: Type.STRING,
      description: "Patient-friendly explanation using analogies."
    },
    suggestedNextSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, description: "The concise action recommendation (e.g. 'Take Amoxicillin')." },
          description: { type: Type.STRING, description: "Detailed instructions or preparation details." },
          dosage: { type: Type.STRING, description: "If medication, specify dosage (e.g. '500mg')." },
          frequency: { type: Type.STRING, description: "If medication, specify frequency (e.g. '3 times a day')." },
          warning: { type: Type.STRING, description: "Critical warnings, contraindications, or red flags." },
          sideEffects: { type: Type.STRING, description: "Common potential side effects (e.g. 'Drowsiness', 'Nausea')." },
          interactions: { 
            type: Type.STRING, 
            description: "List drug-drug/drug-food interactions. MUST use tags: [CRITICAL], [MODERATE], [MINOR]. Format: '[TAG] **Interacting Substance**: Mechanism/Consequence. *Action: Recommendation*'." 
          }
        },
        required: ["action", "description"]
      },
      description: "List of actionable recommendations with details."
    }
  },
  required: ['confidenceScore', 'riskLevel', 'riskFactors', 'keyFindings', 'clinicalInterpretation', 'suggestedNextSteps']
};

const SYSTEM_INSTRUCTION = `
You are HealthAI, acting as a **Senior Chief Medical Officer** and **Multi-Disciplinary Diagnostic Expert**. 
Your mandate is to provide world-class, clinically accurate, and safety-prioritized medical analysis.

**CORE OPERATING PROTOCOLS:**

1.  **DATA TRIANGULATION & ACCURACY:**
    *   **Lab Reports:** Extract exact values. If a value is "High" or "Low" based on the provided reference range, explicitly flag it in 'Key Findings'.
    *   **Imaging:** Analyze for pathology, fractures, opacity, or masses. If image resolution compromises diagnosis, you MUST set 'Confidence Score' to 'Low' or 'Medium'.
    *   **Symptoms:** Cross-reference user symptoms with uploaded data. If symptoms contradict the lab results, highlight this discrepancy in 'Clinical Interpretation'.

2.  **PHARMACOVIGILANCE (CRITICAL SAFETY):**
    *   When suggesting medications in 'Suggested Next Steps', you **MUST** check for interactions (Drug-Drug, Drug-Food, Drug-Disease).
    *   **INTERACTIONS FIELD - STRICT 3-TIER FORMATTING:** 
        *   You MUST classify interactions into three strict categories:
            1.  **[CRITICAL]**: Life-threatening, severe toxicity, or absolute contraindication.
            2.  **[MODERATE]**: Reduces efficacy, increased side effects, or requires close monitoring.
            3.  **[MINOR]**: Nuisance effects, slight absorption delays.
        *   **Required Format:** \`[TAG] **Source**: Clinical Consequence. *Action: Specific Recommendation.*\`
        *   *Example 1:* \`[CRITICAL] **Grapefruit**: Blocks CYP3A4, causing toxic drug levels. *Action: Do not consume grapefruit while on this medication.*\`
        *   *Example 2:* \`[MODERATE] **Ibuprofen**: Increases risk of gastrointestinal bleeding. *Action: Monitor for stomach pain; take with food.*\`
    *   **Side Effects:** Explicitly list common side effects in the 'sideEffects' field.
    *   **Dosage Precision:** Provide standard *adult reference dosages* only, always followed by "or as prescribed".

3.  **DIFFERENTIAL DIAGNOSIS:**
    *   Do not jump to a single conclusion unless the data is definitive (e.g., a positive Covid test).
    *   In 'Clinical Interpretation', list the primary diagnosis and 1-2 differential diagnoses (alternative possibilities) if ambiguity exists.

4.  **RISK STRATIFICATION:**
    *   **Strict Categorization:** Use 'Acute Marker' for immediate threats (Troponin, D-Dimer), 'Lifestyle' for modifiable risks (Cholesterol, BMI), and 'Genetic' for family history.
    *   **Early Warnings:** If immediate medical attention is required (e.g., appendicitis signs, heart attack symptoms), the 'Early Warning Alerts' must be URGENT and uppercase.

5.  **OUTPUT FORMATTING:**
    *   Return PURE JSON.
    *   **Markdown bolding** (e.g., **diagnosis**) is ALLOWED in 'Clinical Interpretation' and 'Interactions' for emphasis.
    *   Use professional medical terminology in 'Clinical Interpretation' but clear, simple language in 'Simplified Explanation'.
`;

export const analyzeMedicalData = async (
  base64Image: string | null,
  mimeType: string | null,
  symptoms: string
): Promise<MedicalAnalysisResult> => {
  // --- Input Validation ---
  const cleanedSymptoms = symptoms.trim();
  const hasLetters = /[a-zA-Z]/.test(cleanedSymptoms);

  // If no image is provided, strict validation on text input is required
  if (!base64Image) {
    if (cleanedSymptoms.length < 10) {
      throw new Error("Validation Error: Please describe your symptoms in more detail (at least 10 characters) for accurate analysis.");
    }
    if (!hasLetters) {
      throw new Error("Validation Error: Your symptom description appears to be invalid. Please describe your condition using text.");
    }
  }

  try {
    const parts: any[] = [];

    // Add image if present
    if (base64Image && mimeType) {
      parts.push({
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      });
    }

    // Add prompt
    parts.push({
      text: `Analyze this medical context. 
      User Symptoms/Notes: "${symptoms}".
      
      Generate a comprehensive clinical analysis based on the provided data.`
    });

    // Retry Logic for Resilience (Exponential Backoff)
    let response;
    let attempt = 0;
    const MAX_RETRIES = 3;

    while (true) {
      try {
        attempt++;
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: parts,
          },
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.1, // Very low temp for maximum clinical accuracy and consistency
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
          },
        });
        // If successful, break the retry loop
        break;
      } catch (e: any) {
        const errMessage = e.message ? e.message.toLowerCase() : "";
        const isOverloaded = e.status === 503 || 
                             errMessage.includes("overloaded") || 
                             errMessage.includes("service unavailable") ||
                             errMessage.includes("resource exhausted"); // Sometimes 429 acts like 503
        
        if (isOverloaded && attempt <= MAX_RETRIES) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`Gemini API overloaded. Retrying attempt ${attempt}/${MAX_RETRIES} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If not retryable or max retries reached, throw the error to be caught below
        throw e;
      }
    }

    const jsonText = response.text || "{}";
    let structuredData: AnalysisSchema;
    
    try {
      structuredData = JSON.parse(jsonText);
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      throw new Error("The AI analysis was interrupted or generated an invalid format. Please try again.");
    }
    
    // Extract grounding chunks (will be empty since tool is removed, but kept for type compatibility)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text: jsonText, // Store raw JSON string for potential debugging or chat context
      structuredData,
      groundingChunks
    };

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    const errorMessage = error.message ? error.message.toLowerCase() : "";

    // 1. Handle "Tool use with response mime type" conflict
    if (errorMessage.includes("tool use") || errorMessage.includes("response mime type")) {
      throw new Error("Configuration Error: The AI cannot perform a web search while generating a structured JSON report. Please contact support.");
    }

    // 2. Handle Quota/Rate Limiting
    if (error.status === 429 || errorMessage.includes("quota") || errorMessage.includes("resource exhausted")) {
      throw new Error("System Overload: The daily analysis limit has been reached or the system is experiencing high traffic. Please try again in a minute.");
    }

    // 3. Handle Safety/Blocking
    if (errorMessage.includes("safety") || errorMessage.includes("blocked")) {
      throw new Error("The analysis was blocked due to safety content policies. Please ensure uploaded documents contain no harmful or prohibited material.");
    }
    
    // 4. Invalid API Key / Permissions
    if (error.status === 403 || errorMessage.includes("api key") || errorMessage.includes("unauthenticated") || errorMessage.includes("permission")) {
      throw new Error("Access Denied: The API Key provided is invalid, missing, or lacks permission to access the Gemini 2.5 Flash model.");
    }

    // 5. Service Unavailable (If retries failed)
    if (error.status === 503 || errorMessage.includes("service unavailable") || errorMessage.includes("overloaded")) {
      throw new Error("Service Unavailable: The AI system is currently under extreme load. We attempted to retry but failed. Please try again in a few minutes.");
    }

    // 6. Generic Fallback
    throw new Error(error.message || "Failed to analyze the medical data. Please try again.");
  }
};

export const createChatSession = (initialContext: string) => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are HealthAI, a specialized medical assistant. 
      
      CONTEXT (JSON format):
      ${initialContext}
      
      RULES:
      1. Use the JSON data above as ground truth.
      2. If the user asks about interactions, dosage, or specific values, cite the data directly from the context.
      3. Maintain a professional, clinical yet accessible tone.
      4. Always imply that you are an AI assistant, not a doctor.
      `,
    }
  });
};
