import assert from "node:assert/strict";
import { test } from "@jest/globals";
import SwaggerParser from "@apidevtools/swagger-parser";
import { openApiDocument } from "../src/openapi.js";

test("OpenAPI contract is valid and covers auth and CV handoff routes", async () => {
  await SwaggerParser.validate(JSON.parse(JSON.stringify(openApiDocument)));
  for (const path of ["/api/dashboard", "/api/auth/register", "/api/auth/verify-email", "/api/auth/login", "/api/auth/google/start", "/api/auth/google/callback", "/api/auth/google/link/start", "/api/auth/forgot-password", "/api/cvs", "/api/cvs/{id}/versions", "/api/cvs/{id}/download", "/api/jobs/sources", "/api/jobs/search", "/api/jobs/save"]) {
    assert.ok(path in openApiDocument.paths, path);
  }
});

test("every JSON success and error documents a concrete body and example", () => {
  const spec = JSON.parse(JSON.stringify(openApiDocument)) as { paths: Record<string, Record<string, { operationId?: string; responses: Record<string, { content?: Record<string, { schema?: object; example?: object }> }> }>> };
  const operationIds = new Set<string>();
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      assert.ok(operation.operationId, `${method} ${path} needs an operationId`);
      assert.ok(!operationIds.has(operation.operationId), `duplicate operationId ${operation.operationId}`);
      operationIds.add(operation.operationId);
      for (const [status, response] of Object.entries(operation.responses)) {
        if (["204", "302", "303"].includes(status)) continue;
        const json = response.content?.["application/json"];
        assert.ok(json?.schema, `${method} ${path} ${status} needs a JSON schema`);
        assert.ok(json?.example, `${method} ${path} ${status} needs a JSON example`);
      }
    }
  }
  const login = spec.paths["/api/auth/login"].post;
  assert.deepEqual(login.responses["401"].content?.["application/json"]?.example, { error: "invalid_credentials" });
  const upload = spec.paths["/api/cvs"].post as typeof login & { requestBody?: { content?: Record<string, unknown> } };
  assert.ok(upload.requestBody?.content?.["multipart/form-data"]);
});
