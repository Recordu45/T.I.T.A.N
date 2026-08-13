export default async function handler(req, res) {

  /* ==========================================
     CORS
  ========================================== */

  const allowedOrigin =
    "https://recordu45.github.io";

  res.setHeader(
    "Access-Control-Allow-Origin",
    allowedOrigin
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  /* ==========================================
     PREFLIGHT
  ========================================== */

  if (req.method === "OPTIONS") {

    return res.status(204).end();
  }


  /* ==========================================
     METHOD CHECK
  ========================================== */

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });
  }


  try {

    /* ========================================
       REQUEST DATA
    ======================================== */

    const {
      message,
      history = []
    } = req.body || {};


    if (
      !message ||
      typeof message !== "string"
    ) {

      return res.status(400).json({
        error: "Message is required"
      });
    }


    /* ========================================
       API KEY
    ======================================== */

    const apiKey =
      process.env.OPENAI_API_KEY;


    if (!apiKey) {

      console.error(
        "OPENAI_API_KEY is missing"
      );

      return res.status(500).json({
        error:
          "OPENAI_API_KEY is not configured in Vercel."
      });
    }


    /* ========================================
       MESSAGE HISTORY
    ======================================== */

    const safeHistory =
      Array.isArray(history)
        ? history
            .filter(item =>
              item &&
              (
                item.role === "user" ||
                item.role === "assistant"
              ) &&
              typeof item.content === "string"
            )
            .slice(-10)
        : [];


    const input = [

      {
        role: "system",

        content:
          "You are T.I.T.A.N., an advanced personal AI assistant. " +
          "You communicate naturally and intelligently. " +
          "You understand English, Hindi and Hinglish. " +
          "Be helpful, concise and honest. " +
          "Never claim to have performed an action unless the system actually performed it."
      },

      ...safeHistory,

      {
        role: "user",
        content: message
      }

    ];


    /* ========================================
       OPENAI REQUEST
    ======================================== */

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${apiKey}`
          },

          body: JSON.stringify({
            model: "gpt-5-mini",
            input
          })
        }
      );


    const data =
      await response.json();


    /* ========================================
       OPENAI ERROR
    ======================================== */

    if (!response.ok) {

      console.error(
        "OpenAI API error:",
        data
      );

      return res.status(
        response.status
      ).json({
        error:
          data?.error?.message ||
          "OpenAI request failed."
      });
    }


    /* ========================================
       EXTRACT RESPONSE
    ======================================== */

    let reply =
      data.output_text || "";


    if (!reply && Array.isArray(data.output)) {

      reply =
        data.output
          .flatMap(
            item =>
              Array.isArray(item.content)
                ? item.content
                : []
          )
          .filter(
            item =>
              item.type === "output_text"
          )
          .map(
            item =>
              item.text
          )
          .join("");
    }


    if (!reply) {

      reply =
        "I couldn't generate a response.";
    }


    /* ========================================
       RESPONSE
    ======================================== */

    return res.status(200).json({
      reply
    });


  } catch (error) {

    console.error(
      "T.I.T.A.N. backend error:",
      error
    );

    return res.status(500).json({
      error:
        "Internal server error."
    });
  }
}
