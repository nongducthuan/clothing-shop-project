# NestJS migration status

## Target architecture

The application intentionally keeps **NestJS + `@nestjs/platform-express`**. Express remains the HTTP adapter only; it is not used as the application/controller programming model. The backend does not use Fastify.

The target is native NestJS controllers and providers/services, dependency-injected Prisma access, guards, pipes, interceptors and adapter-agnostic exception handling, while preserving the existing API route surface and business rules.

## Migration result

### Route layer

- **99/99 route handlers** are declared by NestJS decorators across `AdminController` (54), `CustomerController` (42) and `NotificationController` (3).
- All 99 handlers delegate to injected NestJS services. No route calls `run(req, res, next)` or forwards to the former Express controllers.
- The old runtime `src/controllers` directory has been removed.
- Fourteen source snapshots of former controllers are retained under `test-fixtures/controllers` for legacy regression-test support only. They are outside the production TypeScript build and are not imported by application runtime modules.

### Application services and dependency injection

- Admin domain services: `AdminStatsService`, `AdminCatalogService`, `AdminPromotionService`, `AdminProductService`, `AdminUserService`, `AdminSaleService`, `AdminVoucherService`, `AdminOrderService` and `AdminReturnService`.
- Customer domain services: `CustomerAuthService`, `CustomerCatalogService`, `CustomerChatService`, `CustomerOrderLookupService`, `CustomerOrderService`, `CustomerPaymentService`, `CustomerProductService`, `CustomerPromotionService` and `CustomerVoucherService`, plus `CustomerReturnService`.
- Notification routes use `NotificationService`.
- `PrismaService` is provided by the global `PrismaModule` and injected into runtime services. Runtime code does not import the old shared Prisma singleton. The legacy `prisma/client.ts` file is retained only for the test fixtures/older regression tests and is not used by the runtime application.
- Socket notifications use the injected `SocketService`; the service persists notifications through injected `PrismaService`.
- `AiService` and `AutoCancelService` are Nest providers managed by the application lifecycle.

### NestJS HTTP/application features

- Authentication and role/guest access checks are implemented through NestJS Guards and custom parameter decorators.
- Request validation is performed using Zod-backed `ZodValidationPipe`; the former Express validation middleware is not used by runtime code.
- Return-image upload uses `FilesInterceptor` from `@nestjs/platform-express` and `PersistImagesInterceptor` for content verification and file persistence.
- The global exception filter uses `HttpAdapterHost`/`httpAdapter.reply`, not Express `Response` methods.
- The HTTP bootstrap remains `NestFactory.create<NestExpressApplication>(AppModule)` and continues to configure Express-compatible HTTP settings.

### SQL safety

- The eight admin statistics raw queries have been converted to `$queryRaw` with `Prisma.sql` fragments.
- No `$queryRawUnsafe` calls remain in backend TypeScript source, including the retained fixture source.

### HTTP behavior

- Existing route prefixes and HTTP methods are represented by the same controller-level route decorators.
- POST endpoints that historically returned HTTP 200 explicitly use `@HttpCode(200)`; create endpoints retain Nest's 201 default where the previous API returned 201; the MoMo callback retains HTTP 204.
- Existing DTO/response mapping and domain rules were carried into the corresponding services. Full behavioral equivalence still requires the project test suite and database-backed integration tests to run.

## Static verification performed

- Admin/customer/notification route decorator counts: **54 + 42 + 3 = 99**.
- No `run(req, res, next)` forwarding remains in the runtime controllers.
- No direct runtime `express` or `express-serve-static-core` imports remain; `@nestjs/platform-express` is intentionally retained.
- No runtime imports of the old Prisma singleton remain; imports from the generated Prisma client are type/enum/query-helper imports, not singleton imports.
- No `$queryRawUnsafe` calls remain in backend TypeScript source.
- Relative source import paths were checked for missing modules (generated Prisma client is produced by `prisma generate`).
- A TypeScript parser/transpile syntax check was run over the TypeScript files and reported no syntax errors. This check is not a substitute for type-checking or executing the tests.
- Static architecture guardrail tests have been added at `src/__tests__/migration/nestjs-architecture.test.ts`.
- A reproducible source-level checker is available as `npm run check:nestjs-migration`; it parses the controller AST and confirms all 99 route handlers delegate to existing injected service methods. The checker passed in this workspace.

## Verification still required before production

The dependency installation attempt (`npm ci --no-audit --no-fund`) timed out, leaving no usable local Nest CLI/Jest dependencies and no generated Prisma client. The observed results were: `npm run build` stopped with `nest: not found`; `npm run typecheck` stopped because required `@types/*` packages were missing from the incomplete dependency tree; and `npm test -- --runInBand` stopped with `jest: not found`. A TypeScript parser/transpile syntax check passed for 126 TypeScript files, and the AST migration checker passed for all 99 routes. These checks do **not** establish strict type correctness, test success or runtime behavior. Do not treat this source migration as production-verified.

In an environment with npm registry access and the configured database, run:

```bash
npm ci
npm run check:nestjs-migration
npm run build
npm run typecheck
npm test -- --runInBand
```

Then run the database-backed tests against a non-production database and verify payment-provider webhook signatures/callbacks in the provider sandbox before deployment.
