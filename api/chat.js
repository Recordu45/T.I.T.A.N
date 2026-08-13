export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "AI backend is not configured"
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are T.I.T.A.N., an advanced personal AI assistant. " +
          "Be helpful, intelligent, concise and natural. " +
          "You can communicate in English, Hindi and Hinglish. " +
          "Never claim that you performed an action unless the system actually performed it."
      },
      ...history
        .filter(
          item =>
            item &&
            (item.role === "user" ||
             item.role === "assistant") &&
            typeof item.content === "string"
        )
        .slice(-10),
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-5-mini",
          input: messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI request failed"
      });
    }

    const text =
      data.output_text ||
      data.output
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("") ||
      "I couldn't generate a response.";

    return res.status(200).json({
      reply: text
    });

  } catch (error) {

    console.error(
      "T.I.T.A.N. backend error:",
      error
    );

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
