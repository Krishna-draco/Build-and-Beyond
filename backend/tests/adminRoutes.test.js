const express = require("express");
const request = require("supertest");

const okHandler = (name) => jest.fn((req, res) => res.status(200).json({ route: name }));

jest.mock("../middlewares/authadmin", () => (req, res, next) => {
  req.admin = { role: "admin" };
  next();
});

jest.mock("../middlewares/redisResponseCache", () => () => (req, res, next) => next());

jest.mock("../controllers/adminanalyticsController", () => ({
  getAdminAnalytics: okHandler("admin/analytics"),
}));

jest.mock("../controllers/adminSettingsController", () => ({
  getSettings: okHandler("admin/settings:get"),
  updateSettings: okHandler("admin/settings:update"),
}));

jest.mock("../controllers/adminController", () => ({
  getAdminDashboard: okHandler("admindashboard"),
  deleteCustomer: okHandler("delete-customer"),
  deleteCompany: okHandler("delete-company"),
  deleteWorker: okHandler("delete-worker"),
  deleteArchitectHiring: okHandler("delete-architect-hiring"),
  deleteConstructionProject: okHandler("delete-construction-project"),
  deleteDesignRequest: okHandler("delete-design-request"),
  deleteBid: okHandler("delete-bid"),
  deleteJobApplication: okHandler("delete-job-application"),
  getCustomerDetail: okHandler("customer-detail"),
  getCustomerFullDetail: okHandler("customer-full-detail"),
  getCompanyDetail: okHandler("company-detail"),
  getCompanyFullDetail: okHandler("company-full-detail"),
  getWorkerDetail: okHandler("worker-detail"),
  getWorkerFullDetail: okHandler("worker-full-detail"),
  getArchitectHiringDetail: okHandler("architect-hiring-detail"),
  getArchitectHiringFullDetail: okHandler("architect-hiring-full-detail"),
  getConstructionProjectDetail: okHandler("construction-project-detail"),
  getConstructionProjectFullDetail: okHandler("construction-project-full-detail"),
  getDesignRequestDetail: okHandler("design-request-detail"),
  getDesignRequestFullDetail: okHandler("design-request-full-detail"),
  getBidDetail: okHandler("bid-detail"),
  getJobApplicationDetail: okHandler("job-application-detail"),
  getAdminRevenue: okHandler("admin/revenue"),
  getPlatformRevenueIntelligence: okHandler("admin/revenue/platform-intelligence"),
  getRedisCacheStatsAdmin: okHandler("admin/cache/redis-stats"),
  resetRedisCacheStatsAdmin: okHandler("admin/cache/redis-stats/reset"),
}));

const adminRoutes = require("../routes/adminRoutes");
const adminController = require("../controllers/adminController");

describe("admin routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api", adminRoutes);
  });

  it("handles GET /api/admin/verify-session", async () => {
    const response = await request(app).get("/api/admin/verify-session");

    expect(response.status).toBe(200);
    expect(response.body.authenticated).toBe(true);
    expect(response.body.role).toBe("admin");
  });

  it("handles GET /api/admin/revenue", async () => {
    const response = await request(app).get("/api/admin/revenue");

    expect(response.status).toBe(200);
    expect(response.body.route).toBe("admin/revenue");
    expect(adminController.getAdminRevenue).toHaveBeenCalledTimes(1);
  });
});
