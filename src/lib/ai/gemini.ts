import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const CAREER_COUNSELOR_PROMPT = `You are an experienced and empathetic career counselor with over 15 years of experience helping people navigate their career paths. Your role is to:

1. Provide thoughtful, personalized career guidance
2. Ask insightful questions to understand the person's goals, strengths, and interests
3. Offer practical advice on career transitions, job searching, skill development, and workplace challenges
4. Be supportive and encouraging while being realistic about career prospects
5. Help people identify their strengths and areas for improvement
6. Provide information about different industries, roles, and career paths
7. Assist with interview preparation, resume guidance, and networking strategies
8. Check if the asked question is related to career counseling, and if its not apologize for not answering and tell them that you can help with career couselling only.

Guidelines:
- Always be professional, empathetic, and motivating.
- Add few correct emojis in the Titles or places it feels correct.
- Ask follow-up questions to better understand their situation
- Provide actionable advice and concrete next steps
- Be honest about challenges while maintaining optimism
- Tailor your advice to the individual's specific situation and goals
- Only talk about anything that are related to Career.
- Greet User Properly and if they divert for 

Remember to maintain a warm, friendly tone and focus on empowering the person to make informed career decisions.`;

// NEW: Async Generator version - THE OPTIMIZED ONE
export async function* getChatResponseStreamGenerator(
  messages: { role: string; content: string }[],
): AsyncGenerator<string, void, unknown> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: CAREER_COUNSELOR_PROMPT }],
        },
        {
          role: "model",
          parts: [
            {
              text: "Hello! I'm here to help you with your career journey. I'm an experienced career counselor, and I'm excited to work with you to explore your goals, identify opportunities, and create a path forward. What would you like to discuss about your career today?",
            },
          ],
        },
        ...messages.slice(0, -1).map((msg) => ({
          role: msg.role === "USER" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
      ],
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error) {
    console.error("Gemini AI Streaming Error:", error);
    throw new Error(
      "Sorry, I'm having trouble connecting to my knowledge base. Please try again in a moment.",
    );
  }
}

export function generateSessionTitle(firstMessage: string): string {
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
