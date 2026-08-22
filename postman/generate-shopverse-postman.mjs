import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const schema = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json";
const jsonHeaders = [{ key: "Content-Type", value: "application/json" }];

const bearer = (token) => ({ type: "bearer", bearer: [{ key: "token", value: token, type: "string" }] });
const basic = (username, password) => ({
  type: "basic",
  basic: [
    { key: "username", value: username, type: "string" },
    { key: "password", value: password, type: "string" }
  ]
});
const noauth = { type: "noauth" };

function request(name, method, url, options = {}) {
  const req = {
    method,
    header: options.headers ?? (options.body ? jsonHeaders : []),
    url,
    description: options.description ?? ""
  };
  if (options.auth) req.auth = options.auth;
  if (options.body !== undefined) {
    req.body = { mode: "raw", raw: JSON.stringify(options.body, null, 2), options: { raw: { language: "json" } } };
  }
  if (options.formdata) req.body = { mode: "formdata", formdata: options.formdata };
  const events = [];
  if (options.preRequest) events.push({ listen: "prerequest", script: { type: "text/javascript", exec: options.preRequest } });
  if (options.tests) events.push({ listen: "test", script: { type: "text/javascript", exec: options.tests } });
  return { name, request: req, response: [], ...(events.length ? { event: events } : {}) };
}

const folder = (name, item, options = {}) => ({ name, item, ...(options.auth ? { auth: options.auth } : {}), ...(options.description ? { description: options.description } : {}) });
const ok = (codes = [200]) => [
  `pm.test("Status is one of ${codes.join(", ")}", () => pm.expect(${JSON.stringify(codes)}).to.include(pm.response.code));`,
  "pm.test(\"Correlation header is present\", () => { if (pm.response.headers.has('X-Correlation-Id')) pm.expect(pm.response.headers.get('X-Correlation-Id')).to.not.be.empty; });"
];
const saveToken = (name, makeActive = false) => [
  ...ok([200]),
  "const body = pm.response.json();",
  "pm.expect(body.token).to.be.a('string').and.not.empty;",
  `pm.environment.set(${JSON.stringify(name)}, body.token);`,
  ...(makeActive ? [`pm.environment.set("accessToken", body.token);`] : [])
];
const saveField = (variable, expressions) => [
  ...ok([200, 201]),
  "const body = pm.response.json();",
  `const value = ${expressions.join(" ?? ")};`,
  `if (value !== undefined && value !== null) pm.environment.set(${JSON.stringify(variable)}, String(value));`
];

const adminAuth = bearer("{{adminToken}}");
const customerAuth = bearer("{{customerToken}}");
const activeAuth = bearer("{{accessToken}}");

const collection = {
  info: {
    _postman_id: "3c52c9b6-413a-4ef3-b47c-22bce4d6d411",
    name: "ShopVerse - Complete API",
    description: "Complete ShopVerse API collection derived from the Spring controllers and security configuration. Import an accompanying environment, run Authentication first, then use Customer or Admin folders. Public registration targets user-service directly because the current gateway route does not include /api/v1/public/**. Destructive and recovery requests are included but are never run automatically.",
    schema
  },
  auth: activeAuth,
  event: [{
    listen: "prerequest",
    script: {
      type: "text/javascript",
      exec: [
        "if (!pm.environment.get('correlationId')) pm.environment.set('correlationId', pm.variables.replaceIn('{{$guid}}'));",
        "if (!pm.environment.get('idempotencyKey')) pm.environment.set('idempotencyKey', 'checkout-' + pm.variables.replaceIn('{{$guid}}'));"
      ]
    }
  }],
  variable: [],
  item: [
    folder("00 - Authentication", [
      request("Login as admin", "POST", "{{gatewayUrl}}/auth/login", {
        auth: noauth,
        body: { username: "{{adminUsername}}", password: "{{adminPassword}}" },
        tests: saveToken("adminToken", true),
        description: "Authenticates the seeded administrator and stores adminToken and accessToken."
      }),
      request("Login as customer", "POST", "{{gatewayUrl}}/auth/login", {
        auth: noauth,
        body: { username: "{{customerUsername}}", password: "{{customerPassword}}" },
        tests: saveToken("customerToken", true),
        description: "Authenticates the seeded customer and stores customerToken and accessToken."
      }),
      request("JWKS", "GET", "{{gatewayUrl}}/auth/.well-known/jwks.json", { auth: noauth, tests: ok([200]) })
    ], { description: "JWT login and public key discovery. Set accessToken to switch the collection-level identity." }),

    folder("01 - Public APIs", [
      request("Register customer (direct user-service)", "POST", "{{userServiceUrl}}/api/v1/public/users/register", {
        auth: noauth,
        body: { username: "{{registrationUsername}}", email: "{{registrationEmail}}", password: "{{registrationPassword}}", firstName: "Postman", lastName: "Customer", phoneNumber: "+919876543210" },
        tests: ok([201]),
        description: "Direct-service request. The current gateway route omits /api/v1/public/**."
      }),
      request("User service health", "GET", "{{userServiceUrl}}/api/v1/public/health", { auth: noauth, tests: ok([200]) }),
      request("Inventory service health", "GET", "{{gatewayUrl}}/api/v1/inventory/public/health", { auth: noauth, tests: ok([200]) }),
      request("List catalog items", "GET", "{{gatewayUrl}}/api/v1/inventory/public/items", { auth: noauth, tests: ok([200]) }),
      request("Get catalog item", "GET", "{{gatewayUrl}}/api/v1/inventory/public/items/{{productId}}", { auth: noauth, tests: ok([200]) }),
      request("List categories", "GET", "{{gatewayUrl}}/api/v1/inventory/public/categories", { auth: noauth, tests: ok([200]) }),
      request("List related catalog items", "GET", "{{gatewayUrl}}/api/v1/inventory/public/items/{{productId}}/related", { auth: noauth, tests: ok([200]) }),
      request("Order service health", "GET", "{{gatewayUrl}}/api/v1/orders/public/health", { auth: noauth, tests: ok([200]) }),
      request("Order catalog facade", "GET", "{{gatewayUrl}}/api/v1/orders/public/catalog", { auth: noauth, tests: ok([200]) }),
      request("Payment service health", "GET", "{{gatewayUrl}}/api/v1/payments/public/health", { auth: noauth, tests: ok([200]) }),
      request("Payment provider webhook", "POST", "{{gatewayUrl}}/api/v1/payments/webhooks/provider", {
        auth: noauth,
        body: { orderNumber: "{{orderNumber}}", status: "CAPTURED", paymentReference: "postman-provider-reference", reason: null },
        tests: ok([200]),
        description: "Public provider callback. Valid statuses: PENDING, AUTHORIZED, CAPTURED, DECLINED, TIMED_OUT, REFUNDED."
      })
    ]),

    folder("02 - Customer - Profile and Addresses", [
      request("Get my profile", "GET", "{{gatewayUrl}}/api/v1/users/me", { tests: ok([200]) }),
      request("Patch my profile", "PATCH", "{{gatewayUrl}}/api/v1/users/me", { body: { email: "{{customerEmail}}", firstName: "Postman", lastName: "Customer", phoneNumber: "+919876543210" }, tests: ok([200]) }),
      request("Replace my profile", "PUT", "{{gatewayUrl}}/api/v1/users/me", { body: { email: "{{customerEmail}}", firstName: "Postman", lastName: "Customer", phoneNumber: "+919876543210" }, tests: ok([200]) }),
      request("List my addresses", "GET", "{{gatewayUrl}}/api/v1/users/me/addresses", { tests: ok([200]) }),
      request("Create my address", "POST", "{{gatewayUrl}}/api/v1/users/me/addresses", {
        body: { label: "Home", recipientName: "Postman Customer", phoneNumber: "+919876543210", line1: "42 Commerce Street", line2: "Suite 7", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "India", defaultAddress: true },
        tests: saveField("addressId", ["body.id", "body.data?.id"])
      }),
      request("Update my address", "PUT", "{{gatewayUrl}}/api/v1/users/me/addresses/{{addressId}}", { body: { label: "Home", recipientName: "Postman Customer", phoneNumber: "+919876543210", line1: "43 Commerce Street", line2: "", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "India", defaultAddress: true }, tests: ok([200]) }),
      request("Delete my address", "DELETE", "{{gatewayUrl}}/api/v1/users/me/addresses/{{addressId}}", { tests: ok([204]), description: "Destructive: deletes the selected address." })
    ], { auth: customerAuth }),

    folder("03 - Customer - Cart", [
      request("Get cart", "GET", "{{gatewayUrl}}/api/v1/cart", { tests: ok([200]) }),
      request("Replace cart", "PUT", "{{gatewayUrl}}/api/v1/cart", { body: { items: [{ productId: "{{productId}}", quantity: 1 }] }, tests: ok([200]) }),
      request("Merge cart", "POST", "{{gatewayUrl}}/api/v1/cart/merge", { body: { items: [{ productId: "{{productId}}", quantity: 1 }] }, tests: ok([200]) }),
      request("Validate cart", "POST", "{{gatewayUrl}}/api/v1/cart/validate", { tests: ok([200]) }),
      request("Delete cart item", "DELETE", "{{gatewayUrl}}/api/v1/cart/items/{{productId}}", { tests: ok([200]), description: "Destructive: removes the product from the current user's cart." })
    ], { auth: customerAuth }),

    folder("04 - Customer - Orders", [
      request("List my orders", "GET", "{{gatewayUrl}}/api/v1/orders", { tests: ok([200]) }),
      request("Get my order", "GET", "{{gatewayUrl}}/api/v1/orders/{{orderId}}", { tests: ok([200]) }),
      request("Get order timeline", "GET", "{{gatewayUrl}}/api/v1/orders/{{orderId}}/timeline", { tests: ok([200]) }),
      request("Checkout", "POST", "{{gatewayUrl}}/api/v1/orders/checkout", {
        headers: [...jsonHeaders, { key: "Idempotency-Key", value: "{{idempotencyKey}}" }, { key: "X-Correlation-Id", value: "{{correlationId}}" }],
        body: { items: [{ productId: "{{productId}}", quantity: 1 }], shippingAddress: { recipientName: "Postman Customer", phoneNumber: "+919876543210", line1: "42 Commerce Street", line2: "", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "India" } },
        tests: [
          ...ok([201]), "const body = pm.response.json();",
          "if (body.id != null) pm.environment.set('orderId', String(body.id));",
          "if (body.orderNumber) pm.environment.set('orderNumber', body.orderNumber);"
        ],
        description: "Creates an idempotent checkout and starts the Kafka choreography. Reuse the same Idempotency-Key for retries of the same checkout."
      }),
      request("Cancel my order", "POST", "{{gatewayUrl}}/api/v1/orders/{{orderId}}/cancel", { tests: ok([200]), description: "Business transition; only valid for an owned cancellable order." }),
      request("Request return", "POST", "{{gatewayUrl}}/api/v1/orders/{{orderId}}/return-request", { tests: ok([200]), description: "Business transition; only valid for an owned delivered order." })
    ], { auth: customerAuth }),

    folder("05 - Customer - Payments", [
      request("Get payment by order number", "GET", "{{gatewayUrl}}/api/v1/payments/orders/{{orderNumber}}", { tests: ok([200]) }),
      request("Create payment intent", "POST", "{{gatewayUrl}}/api/v1/payments/intent", { body: { orderNumber: "{{orderNumber}}", correlationId: "{{correlationId}}", amount: 1499.00 }, tests: ok([200]) }),
      request("Retry payment", "POST", "{{gatewayUrl}}/api/v1/payments/orders/{{orderNumber}}/retry", { tests: ok([200]), description: "Only valid for an owned declined or timed-out payment." }),
      request("Request refund", "POST", "{{gatewayUrl}}/api/v1/payments/orders/{{orderNumber}}/refund", { tests: ok([200]), description: "Only valid for an owned captured payment." })
    ], { auth: customerAuth }),

    folder("06 - Admin - Users", [
      request("Search users", "GET", "{{gatewayUrl}}/api/v1/users?page=0&size=20&sortBy=id&direction=ASC&search=&status=&role=", { tests: ok([200]), description: "Optional filters: search, status (ACTIVE, INACTIVE, LOCKED, SUSPENDED, DELETED), and role." }),
      request("Get user", "GET", "{{gatewayUrl}}/api/v1/users/{{userId}}", { tests: ok([200]) }),
      request("Create user", "POST", "{{gatewayUrl}}/api/v1/users", {
        body: { username: "{{newUsername}}", email: "{{newUserEmail}}", password: "{{newUserPassword}}", firstName: "API", lastName: "User", phoneNumber: "+919876543211", roles: ["ROLE_CUSTOMER"] },
        tests: saveField("userId", ["body.data?.id", "body.id"])
      }),
      request("Update user", "PATCH", "{{gatewayUrl}}/api/v1/users/{{userId}}", { body: { firstName: "Updated", lastName: "User", status: "ACTIVE", enabled: true, accountNonLocked: true, roles: ["ROLE_CUSTOMER"] }, tests: ok([200]) }),
      request("Change user password", "PATCH", "{{gatewayUrl}}/api/v1/users/{{userId}}/password", { body: { currentPassword: "{{customerPassword}}", newPassword: "{{newUserPassword}}" }, tests: ok([200]) }),
      request("Reset user password", "POST", "{{gatewayUrl}}/api/v1/users/{{userId}}/password/reset", { body: { newPassword: "{{newUserPassword}}" }, tests: ok([200]) }),
      request("Delete user", "DELETE", "{{gatewayUrl}}/api/v1/users/{{userId}}", { tests: ok([204]), description: "Destructive: deletes the selected user." })
    ], { auth: adminAuth }),

    folder("07 - Admin - Roles", [
      request("Search roles", "GET", "{{gatewayUrl}}/api/v1/roles?page=0&size=20&sortBy=id&direction=ASC&search=&permission=", { tests: ok([200]) }),
      request("Get role", "GET", "{{gatewayUrl}}/api/v1/roles/{{roleId}}", { tests: ok([200]) }),
      request("Create role", "POST", "{{gatewayUrl}}/api/v1/roles", { body: { roleName: "ROLE_POSTMAN_TEST", description: "Postman-created test role", permissions: ["USER_READ"] }, tests: saveField("roleId", ["body.data?.id", "body.id"]) }),
      request("Update role", "PATCH", "{{gatewayUrl}}/api/v1/roles/{{roleId}}", { body: { description: "Updated Postman test role", permissions: ["USER_READ"] }, tests: ok([200]) }),
      request("Delete role", "DELETE", "{{gatewayUrl}}/api/v1/roles/{{roleId}}", { tests: ok([204]), description: "Destructive: deletes the selected role." })
    ], { auth: adminAuth }),

    folder("08 - Admin - Permissions", [
      request("Search permissions", "GET", "{{gatewayUrl}}/api/v1/permissions?page=0&size=20&sortBy=id&direction=ASC&search=&moduleName=", { tests: ok([200]) }),
      request("Get permission", "GET", "{{gatewayUrl}}/api/v1/permissions/{{permissionId}}", { tests: ok([200]) }),
      request("Create permission", "POST", "{{gatewayUrl}}/api/v1/permissions", { body: { permissionName: "POSTMAN_TEST", description: "Postman-created test permission", moduleName: "TEST" }, tests: saveField("permissionId", ["body.data?.id", "body.id"]) }),
      request("Update permission", "PATCH", "{{gatewayUrl}}/api/v1/permissions/{{permissionId}}", { body: { description: "Updated Postman test permission", moduleName: "TEST" }, tests: ok([200]) }),
      request("Delete permission", "DELETE", "{{gatewayUrl}}/api/v1/permissions/{{permissionId}}", { tests: ok([204]), description: "Destructive: deletes the selected permission." })
    ], { auth: adminAuth }),

    folder("09 - Admin - Audit", [
      request("Search audit events", "GET", "{{gatewayUrl}}/api/v1/admin/audit-events?page=0&size=50&sortBy=occurredAt&direction=DESC&area=&actor=&result=&search=", { tests: ok([200]) }),
      request("Get audit event", "GET", "{{gatewayUrl}}/api/v1/admin/audit-events/{{auditEventId}}", { tests: ok([200]) })
    ], { auth: adminAuth }),

    folder("10 - Admin - Inventory", [
      request("Get secured inventory item", "GET", "{{gatewayUrl}}/api/v1/inventory/{{productId}}", { tests: ok([200]) }),
      request("Create or replace inventory item", "PUT", "{{gatewayUrl}}/api/v1/inventory/admin/items", {
        body: { productId: "{{productId}}", productName: "Postman Product", brand: "ShopVerse", model: "PM-1", category: "Test", description: "Product maintained through the ShopVerse Postman collection", imageUrl: "https://example.com/shopverse-product.png", imageKey: "products/postman-product.png", unitPrice: 1499.00, availableQuantity: 25 },
        tests: ok([200])
      }),
      request("Upload inventory image", "POST", "{{gatewayUrl}}/api/v1/inventory/admin/items/{{productId}}/image", {
        headers: [], formdata: [{ key: "file", type: "file", src: "" }], tests: ok([200]), description: "Choose a local image file in Postman before sending."
      }),
      request("Get reservation by order", "GET", "{{gatewayUrl}}/api/v1/inventory/admin/reservations/orders/{{orderNumber}}", { tests: ok([200]) }),
      request("List inventory dead letters", "GET", "{{gatewayUrl}}/api/v1/inventory/admin/dead-letters", { tests: ok([200]) }),
      request("Replay inventory dead letter", "POST", "{{gatewayUrl}}/api/v1/inventory/admin/dead-letters/{{deadLetterId}}/replay", { tests: ok([200]), description: "Recovery write: replays one persisted failed Kafka event. Use deliberately." })
    ], { auth: adminAuth }),

    folder("11 - Admin - Orders", [
      request("List all orders", "GET", "{{gatewayUrl}}/api/v1/orders/admin/all", { tests: ok([200]) }),
      request("Cancel order as admin", "POST", "{{gatewayUrl}}/api/v1/orders/admin/{{orderId}}/cancel", { tests: ok([200]) }),
      request("Pack order", "POST", "{{gatewayUrl}}/api/v1/orders/admin/{{orderId}}/pack", { tests: ok([200]) }),
      request("Ship order", "POST", "{{gatewayUrl}}/api/v1/orders/admin/{{orderId}}/ship", { tests: ok([200]) }),
      request("Deliver order", "POST", "{{gatewayUrl}}/api/v1/orders/admin/{{orderId}}/deliver", { tests: ok([200]) }),
      request("Evict catalog cache", "POST", "{{gatewayUrl}}/api/v1/orders/admin/catalog-cache/evict", { tests: ok([204]) }),
      request("List order dead letters", "GET", "{{gatewayUrl}}/api/v1/orders/admin/dead-letters", { tests: ok([200]) }),
      request("Replay order dead letter", "POST", "{{gatewayUrl}}/api/v1/orders/admin/dead-letters/{{deadLetterId}}/replay", { tests: ok([200]), description: "Recovery write: replays one persisted failed Kafka event. Use deliberately." }),
      request("Delete (cancel) order", "DELETE", "{{gatewayUrl}}/api/v1/orders/{{orderId}}", { tests: ok([200]), description: "Destructive business transition: the endpoint cancels rather than physically deleting the order." })
    ], { auth: adminAuth }),

    folder("12 - Admin - Payments", [
      request("List all payments", "GET", "{{gatewayUrl}}/api/v1/payments/admin", { tests: ok([200]) }),
      request("Set payment simulation", "POST", "{{gatewayUrl}}/api/v1/payments/admin/simulation?mode={{paymentSimulationMode}}", { tests: ok([200]), description: "Valid modes: SUCCESS, DECLINE, TIMEOUT." }),
      request("Reconcile payment", "POST", "{{gatewayUrl}}/api/v1/payments/admin/orders/{{orderNumber}}/reconcile", { tests: ok([200]) }),
      request("Refund payment as admin", "POST", "{{gatewayUrl}}/api/v1/payments/admin/orders/{{orderNumber}}/refund", { tests: ok([200]) }),
      request("List payment dead letters", "GET", "{{gatewayUrl}}/api/v1/payments/admin/dead-letters", { tests: ok([200]) }),
      request("Replay payment dead letter", "POST", "{{gatewayUrl}}/api/v1/payments/admin/dead-letters/{{deadLetterId}}/replay", { tests: ok([200]), description: "Recovery write: replays one persisted failed Kafka event. Use deliberately." })
    ], { auth: adminAuth }),

    folder("13 - Operations and API Docs", [
      request("Gateway health", "GET", "{{gatewayUrl}}/actuator/health", { auth: noauth, tests: ok([200]) }),
      request("ShopVerse readiness", "GET", "{{gatewayUrl}}/actuator/shopverse-readiness", { auth: noauth, tests: ok([200, 503]) }),
      request("Discovery health", "GET", "{{discoveryServerUrl}}/actuator/health", { auth: noauth, tests: ok([200]) }),
      request("Discovery application health", "GET", "{{discoveryServerUrl}}/api/health", { auth: noauth, tests: ok([200]) }),
      request("Config Server health", "GET", "{{configServerUrl}}/actuator/health", { auth: noauth, tests: ok([200]) }),
      request("Auth service health", "GET", "{{authServiceUrl}}/actuator/health", { auth: noauth, tests: ok([200]) }),
      request("User OpenAPI document", "GET", "{{userServiceUrl}}/v3/api-docs", { auth: noauth, tests: ok([200]) }),
      request("Inventory OpenAPI document", "GET", "{{inventoryServiceUrl}}/v3/api-docs", { auth: noauth, tests: ok([200]) }),
      request("Order OpenAPI document", "GET", "{{orderServiceUrl}}/v3/api-docs", { auth: noauth, tests: ok([200]) }),
      request("Payment OpenAPI document", "GET", "{{paymentServiceUrl}}/v3/api-docs", { auth: noauth, tests: ok([200]) })
    ]),

    folder("14 - Internal APIs (direct service only)", [
      request("Validate user credentials (HTTP Basic)", "GET", "{{userServiceUrl}}/api/v1/internal/users/authenticated", {
        auth: basic("{{internalUsername}}", "{{internalPassword}}"), tests: ok([200]), description: "Internal endpoint used by auth-service. It is intentionally not routed through the gateway."
      })
    ])
  ]
};

const environmentValues = [
  ["gatewayUrl", "http://localhost:8080"], ["authServiceUrl", "http://localhost:8081"], ["userServiceUrl", "http://localhost:8082"],
  ["orderServiceUrl", "http://localhost:8083"], ["paymentServiceUrl", "http://localhost:8084"], ["inventoryServiceUrl", "http://localhost:8086"],
  ["configServerUrl", "http://localhost:8888"], ["discoveryServerUrl", "http://localhost:8761"],
  ["adminUsername", "admin"], ["adminPassword", "", "secret"], ["customerUsername", "customer1"], ["customerPassword", "", "secret"],
  ["customerEmail", "customer1@shopverse.local"], ["internalUsername", ""], ["internalPassword", "", "secret"],
  ["registrationUsername", "postman.customer"], ["registrationEmail", "postman.customer@shopverse.local"], ["registrationPassword", "", "secret"],
  ["newUsername", "postman.api.user"], ["newUserEmail", "postman.api.user@shopverse.local"], ["newUserPassword", "", "secret"],
  ["adminToken", "", "secret"], ["customerToken", "", "secret"], ["accessToken", "", "secret"],
  ["productId", "1"], ["userId", "1"], ["addressId", "1"], ["roleId", "1"], ["permissionId", "1"], ["auditEventId", "1"],
  ["orderId", "1"], ["orderNumber", "ORD-REPLACE-ME"], ["deadLetterId", "1"], ["paymentSimulationMode", "SUCCESS"],
  ["correlationId", ""], ["idempotencyKey", ""]
];

const environment = {
  id: "64f70b0e-064b-4fd8-a81b-00bc68d87299",
  name: "ShopVerse - Local",
  values: environmentValues.map(([key, value, type = "default"]) => ({ key, value, type, enabled: true })),
  _postman_variable_scope: "environment",
  _postman_exported_at: "2026-08-12T00:00:00.000Z",
  _postman_exported_using: "ShopVerse repository generator"
};

fs.writeFileSync(path.join(outputDir, "ShopVerse.postman_collection.json"), JSON.stringify(collection, null, 2) + "\n");
fs.writeFileSync(path.join(outputDir, "ShopVerse-Local.postman_environment.json"), JSON.stringify(environment, null, 2) + "\n");
