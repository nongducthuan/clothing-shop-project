import fs from 'fs';
import path from 'path';

const backendRoot = path.resolve(__dirname, '../../..');
const sourceRoot = path.join(backendRoot, 'src');

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(sourceRoot, relativePath), 'utf8');
}

function listTypeScriptFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'generated') return [];
      return listTypeScriptFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [entryPath] : [];
  });
}

describe('NestJS migration architecture guardrails', () => {
  const adminController = readSource('admin/admin.controller.ts');
  const customerController = readSource('customer/customer.controller.ts');
  const notificationController = readSource('notification/notification.controller.ts');
  const controllers = [adminController, customerController, notificationController];
  const runtimeFiles = listTypeScriptFiles(sourceRoot);
  const runtimeText = runtimeFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');

  it('keeps all 99 routes as native NestJS controller handlers', () => {
    const routeCount = controllers.reduce(
      (count, source) => count + (source.match(/^\s{2}@(Get|Post|Put|Patch|Delete)\(/gm) ?? []).length,
      0,
    );
    expect(routeCount).toBe(99);
    expect(adminController).toContain('@Controller(\'admin\')');
    expect(customerController).toContain('@Controller()');
    expect(notificationController).toContain('@Controller(\'notifications\')');
  });

  it('does not forward HTTP requests to old Express controller handlers', () => {
    expect(controllers.join('\n')).not.toMatch(/\brun\s*\(/);
    expect(controllers.join('\n')).not.toMatch(/\b(next|res)\s*\(/);
    expect(fs.existsSync(path.join(sourceRoot, 'controllers'))).toBe(false);
    expect(fs.existsSync(path.join(backendRoot, 'test-fixtures'))).toBe(false);
    expect(fs.existsSync(path.join(backendRoot, 'prisma', 'client.ts'))).toBe(false);
  });

  it('keeps Express only as the NestJS HTTP adapter, not as a runtime application import', () => {
    expect(readSource('main.ts')).toContain("from '@nestjs/platform-express'");
    expect(runtimeText).not.toMatch(/from\s+['"]express['"]/);
    expect(runtimeText).not.toMatch(/from\s+['"]express-serve-static-core['"]/);
  });

  it('uses injected PrismaService instead of importing the shared Prisma singleton', () => {
    const singletonImports = runtimeFiles.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return [...source.matchAll(/import\s+prisma\s+from\s+['"]([^'"]*\/prisma\/client)['"]/g)]
        .filter((match) => !match[1].includes('/generated/'))
        .map(() => path.relative(sourceRoot, file));
    });
    expect(singletonImports).toEqual([]);
    expect(readSource('prisma/prisma.module.ts')).toContain('exports: [PrismaService]');
  });

  it('contains no unsafe raw query calls in application source', () => {
    expect(runtimeText).not.toContain('$queryRawUnsafe');
  });

  it('uses Nest pipes and interceptors for validation and uploaded images', () => {
    expect(runtimeText).toContain('ZodValidationPipe');
    expect(customerController).toContain('FilesInterceptor');
    expect(customerController).toContain('PersistImagesInterceptor');
    expect(runtimeText).not.toMatch(/validateMiddleware/);
  });

  it('uses the adapter abstraction for global exception responses', () => {
    const exceptionFilter = readSource('common/filters/all-exceptions.filter.ts');
    expect(exceptionFilter).toContain('HttpAdapterHost');
    expect(exceptionFilter).toContain('adapter.reply(');
    expect(exceptionFilter).not.toMatch(/\.status\([^)]*\)\.json\(/);
  });
});
