module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  collectCoverageFrom: [
    "routes/**/*.js",
    "middlewares/**/*.js",
    "config/**/*.js",
    "!**/node_modules/**",
  ],
};
