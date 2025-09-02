import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available in the environment variables.
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CAREER_COUNSELOR_PROMPT = `You are an experienced and empathetic career counselor with over 15 years of experience helping people navigate their career paths. Your role is to:

1. Provide thoughtful, personalized career guidance
2. Ask insightful questions to understand the person's goals, strengths, and interests
3. Offer practical advice on career transitions, job searching, skill development, and workplace challenges
4. Be supportive and encouraging while being realistic about career prospects
5. Help people identify their strengths and areas for improvement
6. Provide information about different industries, roles, and career paths
7. Assist with interview preparation, resume guidance, and networking strategies
8. Check if the asked question is related to career counseling, and if its only then answer otherwise come back to career counseling.

Guidelines:
- Always be professional, empathetic, and supportive
- Ask follow-up questions to better understand their situation
- Provide actionable advice and concrete next steps
- Be honest about challenges while maintaining optimism
- Respect confidentiality and create a safe space for discussion
- Tailor your advice to the individual's specific situation and goals
- Only talk about anything that are related to Career Counseling. 

Remember to maintain a warm, professional tone and focus on empowering the person to make informed career decisions.`;

export async function getChatResponse(
  messages: { role: string; content: string }[],
) {
  try {
    // With the new SDK, the system prompt is passed during model initialization.
    const response = genAI.chats.create({
      model: "gemini-2.0-flash",
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: CAREER_COUNSELOR_PROMPT,
      },
      systemInstruction: CAREER_COUNSELOR_PROMPT,
    });

    // The new `generateContent` method is stateless and takes the entire conversation history.
    // We map the incoming messages to the format expected by the new SDK.
    const history = [
      // We manually add the initial model greeting to set the context, as in the original code.
      {
        role: "model",
        parts: [
          {
            text: "Hello! I'm here to help you with your career journey. I'm an experienced career counselor, and I'm excited to work with you to explore your goals, identify opportunities, and create a path forward. What would you like to discuss about your career today?",
          },
        ],
      },
      // Map the rest of the conversation history.
      ...messages.map((msg) => ({
        role: msg.role === "USER" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    ];

    // The `generateContent` function takes the full history.
    const result = await model.generateContent({ contents: history });
    // const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error(
      "Sorry, I'm having trouble connecting to my knowledge base. Please try again in a moment.",
    );
  }
}

/**
 * Generates a short title for the chat session based on the first user message.
 * @param {string} firstMessage - The content of the first message from the user.
 * @returns {string} A formatted title.
 */
export function generateSessionTitle(firstMessage: string): string {
  // This function does not use the SDK, so it remains unchanged.
  const words = firstMessage.split(" ").slice(0, 6);
  let title = words.join(" ");

  if (title.length > 50) {
    title = title.substring(0, 47) + "...";
  }

  if (title.length < 10) {
    title = "Career Discussion";
  }

  return title;
}
