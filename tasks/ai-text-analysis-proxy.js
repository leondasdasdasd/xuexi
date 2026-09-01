#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const port = Number(process.env.PORT || 8766);
const htmlPath = path.join(__dirname, "ai-text-analysis-debug.html");
const targetUrl =
  "https://ai.yungu.org/center/api/file-services/textAnalysis";

function send(response, statusCode, headers, body) {
  response.writeHead(statusCode, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    ...headers,
  });
  response.end(body);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function proxyTextAnalysis(payload) {
  const body = JSON.stringify(payload.body || {});
  const headers = {
    accept: "application/json",
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    origin: "https://ai.yungu.org",
    referer: "https://ai.yungu.org/exam",
  };

  if (payload.cookie) {
    headers.cookie = payload.cookie;
  }
  if (payload.authorization) {
    headers.authorization = payload.authorization;
  }

  return new Promise((resolve, reject) => {
    const upstreamRequest = https.request(
      targetUrl,
      {
        method: "POST",
        headers,
      },
      (upstreamResponse) => {
        const chunks = [];
        upstreamResponse.on("data", (chunk) => chunks.push(chunk));
        upstreamResponse.on("end", () => {
          resolve({
            statusCode: upstreamResponse.statusCode || 502,
            contentType:
              upstreamResponse.headers["content-type"] ||
              "application/json; charset=utf-8",
            body: Buffer.concat(chunks),
          });
        });
      },
    );

    upstreamRequest.on("error", reject);
    upstreamRequest.write(body);
    upstreamRequest.end();
  });
}

async function handleProxy(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    const payload = JSON.parse(rawBody || "{}");
    const result = await proxyTextAnalysis(payload);
    send(
      response,
      result.statusCode,
      { "content-type": result.contentType },
      result.body,
    );
  } catch (error) {
    send(
      response,
      500,
      { "content-type": "application/json; charset=utf-8" },
      JSON.stringify({
        success: false,
        message: error.message || "Proxy request failed",
      }),
    );
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    send(response, 204, {}, "");
    return;
  }

  if (request.method === "POST" && request.url === "/proxy/textAnalysis") {
    await handleProxy(request, response);
    return;
  }

  if (
    (request.method === "GET" || request.method === "HEAD") &&
    (request.url === "/" || request.url === "/index.html")
  ) {
    if (request.method === "HEAD") {
      send(response, 200, { "content-type": "text/html; charset=utf-8" }, "");
      return;
    }
    send(
      response,
      200,
      { "content-type": "text/html; charset=utf-8" },
      fs.readFileSync(htmlPath),
    );
    return;
  }

  send(response, 404, { "content-type": "text/plain; charset=utf-8" }, "Not found");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`AI text analysis debug page: http://127.0.0.1:${port}/`);
});
