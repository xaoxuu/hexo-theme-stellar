// // 引入Express框架，用于创建Web服务器
// const express = require("express");

// // 引入http-proxy-middleware包中的createProxyMiddleware函数，用于创建代理中间件
// const { createProxyMiddleware } = require("http-proxy-middleware");

// // 初始化Express应用实例
// const app = express();

// // 定义一个中间件函数，用于处理所有请求的跨域问题
// app.all("*", function (req, res, next) {
//     // 设置响应头，允许来自任意域名的跨域请求
//     res.header("Access-Control-Allow-Origin", "*");

//     // 设置响应头，允许跨域请求包含content-type头部
//     res.header("Access-Control-Allow-Headers", "content-type");

//     // 设置响应头，允许跨域的HTTP请求方法，包括DELETE、PUT、POST、GET、OPTIONS
//     res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");

//     // 如果是OPTIONS请求（预检请求），则直接返回200状态码结束请求
//     if (req.method.toLowerCase() === "options") {
//         res.send(200);
//     } else {
//         // 对于其他类型的请求，调用next()函数，将请求传递给下一个中间件处理
//         next();
//     }
// });

// // 使用代理中间件，将路径为"/tianqi"的请求代理到目标URL
// // 这里的"/tianqi"是本地服务器上的路径，而"https://api.szfx.top/tianqi/"是目标服务器上的路径
// app.use(
//     "/tianqi", // 设置本地服务器上的代理路径为"/tianqi"
//     createProxyMiddleware({
//         // 设置代理的目标URL，即请求将被转发到的服务器地址
//         target: "https://api.szfx.top/tianqi/",

//         // 设置为true，以改变请求头中的Origin和Host，使其看起来像是从代理服务器发出的
//         changeOrigin: true,

//         // 路径重写规则，将请求路径中的"/tianqi"替换为"/"
//         // 这样，请求就会被转发到目标服务器上的"/tianqi"路径，同时保持原始路径的其余部分不变
//         pathRewrite: { "^/tianqi": "/" }
//     })
// );

// // 监听3000端口，当服务器启动成功时，在控制台输出提示信息
// app.listen(4002, () => {
//     console.log("Server is running on port 4002");
// });