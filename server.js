// 引入依赖
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

// 检查必要的环境变量
const requiredVars = [
  "OPENAI_API_KEY",
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_DEPLOYMENT",
  "AZURE_OPENAI_API_VERSION"
];
const missing = requiredVars.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error("缺少环境变量:", missing.join(", "));
  process.exit(1);
}

// 初始化 Express
const app = express();
app.use(cors());
app.use(express.json());

// 初始化 Azure OpenAI 客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // 拼接完整路径：endpoint + /openai/deployments/<部署名>
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
  // 默认带上 api-version
  defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION }
});

// 根路由测试
app.get("/", (req, res) => {
  res.send("后端服务已启动成功！");
});

// 聊天接口
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ reply: "缺少用户消息" });
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT, // 部署名
      messages: [{ role: "user", content: userMessage }],
      // 可选参数：temperature, max_tokens 等
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("调用 Azure OpenAI 出错:", error);
    res.status(500).json({
      reply: "调用 Azure OpenAI 接口失败，请检查配置。",
      error: error.message,
    });
  }
});

// 端口监听（Azure 必须用 process.env.PORT）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`后端服务已启动：http://localhost:${PORT}`);
});
