const express = require("express");
const request = require("supertest");

jest.mock("../middlewares/upload", () => ({
  upload: {
    array: jest.fn(() => (req, res, next) => next()),
  },
}));

jest.mock("../middlewares/auth", () => (req, res, next) => {
  req.user = { user_id: "test-user" };
  next();
});

jest.mock("../controllers/authController", () => ({
  signup: jest.fn((req, res) => res.status(201).json({ route: "signup" })),
  login: jest.fn((req, res) => res.status(200).json({ route: "login" })),
  loginWithGoogle: jest.fn((req, res) =>
    res.status(200).json({ route: "login/google" }),
  ),
  verifyLoginTwoFactor: jest.fn((req, res) =>
    res.status(200).json({ route: "login/2fa/verify" }),
  ),
  resendLoginTwoFactor: jest.fn((req, res) =>
    res.status(200).json({ route: "login/2fa/resend" }),
  ),
  logout: jest.fn((req, res) => res.status(200).json({ route: "logout" })),
  getSession: jest.fn((req, res) => res.status(200).json({ route: "session" })),
  sendEmailOtp: jest.fn((req, res) =>
    res.status(200).json({ route: "email-otp/send" }),
  ),
  verifyEmailOtp: jest.fn((req, res) =>
    res.status(200).json({ route: "email-otp/verify" }),
  ),
  resetPassword: jest.fn((req, res) =>
    res.status(200).json({ route: "reset-password" }),
  ),
  getTwoFactorStatus: jest.fn((req, res) =>
    res.status(200).json({ route: "2fa/status", method: "GET" }),
  ),
  updateTwoFactorStatus: jest.fn((req, res) =>
    res.status(200).json({ route: "2fa/status", method: "PUT" }),
  ),
}));

const authRoutes = require("../routes/authRoutes");
const authController = require("../controllers/authController");

describe("auth routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api", authRoutes);
  });

  it("handles POST /api/login", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: "user@example.com", password: "secret" });

    expect(response.status).toBe(200);
    expect(response.body.route).toBe("login");
    expect(authController.login).toHaveBeenCalledTimes(1);
  });

  it("handles GET /api/session", async () => {
    const response = await request(app).get("/api/session");

    expect(response.status).toBe(200);
    expect(response.body.route).toBe("session");
    expect(authController.getSession).toHaveBeenCalledTimes(1);
  });

  it("handles protected GET /api/2fa/status", async () => {
    const response = await request(app).get("/api/2fa/status");

    expect(response.status).toBe(200);
    expect(response.body.route).toBe("2fa/status");
    expect(response.body.method).toBe("GET");
    expect(authController.getTwoFactorStatus).toHaveBeenCalledTimes(1);
  });
});
