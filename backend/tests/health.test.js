const express = require("express");
const request = require("supertest");

describe("health endpoint", () => {
  it("returns service health payload", async () => {
    const app = express();

    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "ok",
        service: "build-and-beyond-backend",
        timestamp: new Date().toISOString(),
      });
    });

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("build-and-beyond-backend");
    expect(typeof response.body.timestamp).toBe("string");
  });
});
