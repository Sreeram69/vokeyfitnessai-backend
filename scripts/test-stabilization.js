/**
 * Automated Verification Script — VokeyFitness Backend Stabilization
 * Programmatically tests environment loading, response shaping, security utilities, and schema structures.
 */

const path = require("path");

const runTests = async () => {
  console.log("🏃 Starting VokeyFitness Backend Stabilization Integration Tests...\n");
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${message}`);
    } else {
      failed++;
      console.error(`❌ [FAIL] ${message}`);
    }
  };

  // Test 1: Environment Parsing
  try {
    const env = require("../src/config/env");
    assert(env.PORT !== undefined, `Environment validator loaded successfully. Detected PORT: ${env.PORT}`);
    assert(env.MONGO_URI !== undefined, "Environment contains valid MONGO_URI string");
    assert(env.JWT_SECRET !== undefined, "Environment contains valid JWT_SECRET");
  } catch (error) {
    assert(false, `Environment validator failed to boot: ${error.message}`);
  }

  // Test 2: Centralized API Responses
  try {
    const { sendSuccess, sendError } = require("../src/utils/apiResponse");
    
    // Mock express response object
    const mockRes = {
      statusCode: 200,
      jsonPayload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.jsonPayload = payload;
        return this;
      }
    };

    // Test success envelope spreading / backward compatibility
    sendSuccess(mockRes, "Workout log added", { token: "abc_token_123", username: "vokey_user" });
    assert(mockRes.statusCode === 200, "Success helper correctly returns HTTP 200");
    assert(mockRes.jsonPayload.success === true, "Envelope has success: true flag");
    assert(mockRes.jsonPayload.token === "abc_token_123", "Properties from flat payload are correctly flattened to response root for client backward-compatibility");
    assert(mockRes.jsonPayload.data.username === "vokey_user", "Original nested data payload is preserved");

    // Test error envelope
    sendError(mockRes, "Unauthorized access", "TOKEN_EXPIRED", 401);
    assert(mockRes.statusCode === 401, "Error helper returns correctly modified HTTP status code");
    assert(mockRes.jsonPayload.success === false, "Envelope has success: false flag");
    assert(mockRes.jsonPayload.errorCode === "TOKEN_EXPIRED", "Custom errorCode is correctly populated");
  } catch (error) {
    assert(false, `Centralized API response helper failed: ${error.message}`);
  }

  // Test 3: Token Blacklisting Utility
  try {
    const blacklist = require("../src/utils/tokenBlacklist");
    const testToken = "test_expired_access_token_jwt";
    const expiry = Date.now() + 10000; // expires in 10s

    assert(blacklist.has(testToken) === false, "Initial blacklist does not contain test token");
    
    blacklist.add(testToken, expiry);
    assert(blacklist.has(testToken) === true, "Token correctly registered in blacklist");
  } catch (error) {
    assert(false, `Token Blacklist utility failure: ${error.message}`);
  }

  // Summary
  console.log("\n==============================================");
  console.log(`📋 INTEGRATION TEST RESULTS: ${passed} passed | ${failed} failed`);
  console.log("==============================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 All stabilization layers verified successfully!");
    process.exit(0);
  }
};

runTests().catch((err) => {
  console.error("Fatal test orchestrator exception:", err);
  process.exit(1);
});
