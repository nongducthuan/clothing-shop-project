#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const routeControllerPaths = [
  'admin/admin.controller.ts',
  'customer/customer.controller.ts',
  'notification/notification.controller.ts',
];
const routeMethods = new Set(['Get', 'Post', 'Put', 'Patch', 'Delete']);
const errors = [];
const counts = { routes: 0, routeHandlersDelegatingToServices: 0, runtimeFiles: 0 };

function read(relativePath) {
  return fs.readFileSync(path.join(src, relativePath), 'utf8');
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'generated') return [];
      return walk(filePath);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [filePath] : [];
  });
}

function isRouteHandler(method) {
  const decorators = ts.canHaveDecorators(method) ? ts.getDecorators(method) || [] : [];
  return decorators.some((decorator) => {
    const expression = decorator.expression;
    return ts.isCallExpression(expression)
      && ts.isIdentifier(expression.expression)
      && routeMethods.has(expression.expression.text);
  });
}

const serviceFiles = [
  path.join(src, 'admin/services'),
  path.join(src, 'customer/services'),
  path.join(src, 'notification'),
].flatMap(walk);
const serviceMethods = new Map();
for (const file of serviceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isClassDeclaration(node) && node.name) {
      const methods = new Set(node.members
        .filter(ts.isMethodDeclaration)
        .map((method) => method.name && method.name.getText(ast))
        .filter(Boolean));
      serviceMethods.set(node.name.text, methods);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
}

for (const relativePath of routeControllerPaths) {
  const filePath = path.join(src, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const ast = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let serviceProperties = new Map();

  const visit = (node) => {
    if (ts.isConstructorDeclaration(node)) {
      for (const parameter of node.parameters) {
        const modifiers = ts.canHaveModifiers(parameter) ? ts.getModifiers(parameter) || [] : [];
        const isInjected = modifiers.some((modifier) => [
          ts.SyntaxKind.PrivateKeyword,
          ts.SyntaxKind.PublicKeyword,
          ts.SyntaxKind.ProtectedKeyword,
        ].includes(modifier.kind));
        if (isInjected && ts.isIdentifier(parameter.name) && parameter.type) {
          serviceProperties.set(parameter.name.text, parameter.type.getText(ast));
        }
      }
    }

    if (ts.isMethodDeclaration(node) && isRouteHandler(node)) {
      counts.routes += 1;
      let delegation = null;
      const findCall = (child) => {
        if (ts.isCallExpression(child)
          && ts.isPropertyAccessExpression(child.expression)
          && ts.isPropertyAccessExpression(child.expression.expression)
          && child.expression.expression.expression.kind === ts.SyntaxKind.ThisKeyword) {
          delegation = {
            property: child.expression.expression.name.text,
            method: child.expression.name.text,
          };
        }
        ts.forEachChild(child, findCall);
      };
      if (node.body) findCall(node.body);

      if (!delegation) {
        errors.push(`${relativePath}: ${node.name.getText(ast)} does not delegate to an injected service`);
      } else {
        const serviceType = serviceProperties.get(delegation.property);
        if (!serviceType || !serviceMethods.get(serviceType)?.has(delegation.method)) {
          errors.push(`${relativePath}: ${node.name.getText(ast)} refers to missing service method ${serviceType || delegation.property}.${delegation.method}`);
        } else {
          counts.routeHandlersDelegatingToServices += 1;
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
}

const runtimeFiles = walk(src);
counts.runtimeFiles = runtimeFiles.length;
const runtimeText = runtimeFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const controllerText = routeControllerPaths.map(read).join('\n');

if (counts.routes !== 99) errors.push(`Expected 99 decorated routes; found ${counts.routes}`);
if (counts.routeHandlersDelegatingToServices !== 99) errors.push(`Expected all 99 routes to delegate to injectable services; found ${counts.routeHandlersDelegatingToServices}`);
if (/\brun\s*\(|\bnext\s*\(|\bres\s*\(/.test(controllerText)) errors.push('Legacy Express forwarding patterns found in route controllers');
if (fs.existsSync(path.join(src, 'controllers'))) errors.push('Legacy src/controllers directory still exists');
if (fs.existsSync(path.join(root, 'test-fixtures'))) errors.push('Legacy test-fixtures directory still exists');
if (fs.existsSync(path.join(root, 'prisma', 'client.ts'))) errors.push('Legacy prisma/client.ts singleton still exists');
if (/from\s+['"]express(?:-serve-static-core)?['"]/.test(runtimeText)) errors.push('Direct Express imports found in application runtime');
if (/import\s+prisma\s+from\s+['"][^'"]*\/prisma\/client['"]/.test(runtimeText)) errors.push('Shared Prisma singleton import found in application runtime');
if (runtimeText.includes('$queryRawUnsafe')) errors.push('$queryRawUnsafe remains in application runtime');
if (runtimeText.includes('validateMiddleware')) errors.push('Legacy Express validation middleware remains in application runtime');
if (!read('main.ts').includes("from '@nestjs/platform-express'")) errors.push('NestJS Express adapter bootstrap is missing');
if (!read('common/filters/all-exceptions.filter.ts').includes('HttpAdapterHost')) errors.push('Exception filter is not adapter-agnostic');
if (!read('customer/customer.controller.ts').includes('FilesInterceptor') || !read('customer/customer.controller.ts').includes('PersistImagesInterceptor')) errors.push('NestJS upload interceptor integration is missing');
if (!runtimeText.includes('ZodValidationPipe')) errors.push('ZodValidationPipe is not used by runtime code');

console.log(JSON.stringify({ ...counts, passed: errors.length === 0, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
