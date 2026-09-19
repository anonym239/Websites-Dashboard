const serverless = require("serverless-http");
const appModule = require("../../artifacts/api-server/src/app");

const app = appModule.default ?? appModule;

exports.handler = serverless(app);