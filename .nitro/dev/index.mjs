globalThis.__nitro_main__ = import.meta.url; import { getRequestURL, defineHandler, HTTPError, defineLazyEventHandler, toEventHandler, H3Core, toRequest, H3 } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/h3/dist/_entries/node.mjs';
import { createHooks } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/nitro/dist/node_modules/hookable/dist/index.mjs';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import consola from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/consola/dist/index.mjs';
import { ErrorParser } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/nitro/dist/node_modules/youch-core/build/index.js';
import { Youch } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/nitro/dist/node_modules/youch/build/index.js';
import { SourceMapConsumer } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/nitro/dist/node_modules/source-map/source-map.js';
import { FastResponse, toNodeHandler } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/srvx/dist/adapters/node.mjs';
import { Server } from 'node:http';
import nodeCrypto from 'node:crypto';
import { parentPort, threadId } from 'node:worker_threads';
import { isSocketSupported, getSocketAddress } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/nitro/dist/node_modules/get-port-please/dist/index.mjs';
import { HttpClient, HttpClientRequest, FetchHttpClient } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/@effect/platform/dist/esm/index.js';
import { Effect, Layer, ConfigProvider, Config, Option, Redacted, Random, Array, Queue, Stream, Fiber, Chunk, flow, Schedule, ManagedRuntime, DateTime } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/effect/dist/esm/index.js';
import { defineHandler as defineHandler$1 } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/nitro/lib/deps/h3.mjs';
import { createStorage } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/unstorage/dist/index.mjs';
import unstorage_47drivers_47fs from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/unstorage/dist/drivers/fs.mjs';
import { decodePath, withLeadingSlash, withoutTrailingSlash, joinURL } from 'file:///Users/lenni/projects/effect-queue-streams/node_modules/nitro/dist/node_modules/ufo/dist/index.mjs';
import { promises } from 'node:fs';
import { fileURLToPath } from 'node:url';

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$0 = defineNitroErrorHandler(
  async function defaultNitroErrorHandler(error, event) {
    const res = await defaultHandler(error, event);
    return new FastResponse(
      typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2),
      res
    );
  }
);
async function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled;
  const status = error.status || 500;
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (status === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  await loadStackTrace(error).catch(consola.error);
  const youch = new Youch();
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]"].filter(Boolean).join(" ");
    const ansiError = await (await youch.toANSI(error)).replaceAll(process.cwd(), ".");
    consola.error(
      `[request error] ${tags} [${event.req.method}] ${url}

`,
      ansiError
    );
  }
  const useJSON = opts?.json || !event.req.headers.get("accept")?.includes("text/html");
  const headers = {
    "content-type": useJSON ? "application/json" : "text/html",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';"
  };
  if (status === 404 || !event.res.headers.has("cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = useJSON ? {
    error: true,
    url,
    status,
    statusText: error.statusText,
    message: error.message,
    data: error.data,
    stack: error.stack?.split("\n").map((line) => line.trim())
  } : await youch.toHTML(error, {
    request: {
      url: url.href,
      method: event.req.method,
      headers: Object.fromEntries(event.req.headers.entries())
    }
  });
  return {
    status,
    statusText: error.statusText,
    headers,
    body
  };
}
async function loadStackTrace(error) {
  if (!(error instanceof Error)) {
    return;
  }
  const parsed = await new ErrorParser().defineSourceLoader(sourceLoader).parse(error);
  const stack = error.message + "\n" + parsed.frames.map((frame) => fmtFrame(frame)).join("\n");
  Object.defineProperty(error, "stack", { value: stack });
  if (error.cause) {
    await loadStackTrace(error.cause).catch(consola.error);
  }
}
async function sourceLoader(frame) {
  if (!frame.fileName || frame.fileType !== "fs" || frame.type === "native") {
    return;
  }
  if (frame.type === "app") {
    const rawSourceMap = await readFile(`${frame.fileName}.map`, "utf8").catch(() => {
    });
    if (rawSourceMap) {
      const consumer = await new SourceMapConsumer(rawSourceMap);
      const originalPosition = consumer.originalPositionFor({ line: frame.lineNumber, column: frame.columnNumber });
      if (originalPosition.source && originalPosition.line) {
        frame.fileName = resolve(dirname(frame.fileName), originalPosition.source);
        frame.lineNumber = originalPosition.line;
        frame.columnNumber = originalPosition.column || 0;
      }
    }
  }
  const contents = await readFile(frame.fileName, "utf8").catch(() => {
  });
  return contents ? { contents } : void 0;
}
function fmtFrame(frame) {
  if (frame.type === "native") {
    return frame.raw;
  }
  const src = `${frame.fileName || ""}:${frame.lineNumber}:${frame.columnNumber})`;
  return frame.functionName ? `at ${frame.functionName} (${src}` : `at ${src}`;
}

const errorHandlers = [errorHandler$0];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const plugins = [
    
  ];

const serverAssets = [{"baseName":"server","dir":"/Users/lenni/projects/effect-queue-streams/assets"}];

const assets$1 = createStorage();

for (const asset of serverAssets) {
  assets$1.mount(asset.baseName, unstorage_47drivers_47fs({ base: asset.dir, ignore: (asset?.ignore || []) }));
}

const assets = {};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _8d_YKt = defineHandler((event) => {
  if (event.req.method && !METHODS.has(event.req.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(event.url.pathname))
  );
  let asset;
  const encodingHeader = event.req.headers.get("accept-encoding") || "";
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    event.res.headers.append("Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      event.res.headers.delete("Cache-Control");
      throw new HTTPError({ status: 404 });
    }
    return;
  }
  const ifNotMatch = event.req.headers.get("if-none-match") === asset.etag;
  if (ifNotMatch) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  const ifModifiedSinceH = event.req.headers.get("if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  if (asset.type) {
    event.res.headers.set("Content-Type", asset.type);
  }
  if (asset.etag && !event.res.headers.has("ETag")) {
    event.res.headers.set("ETag", asset.etag);
  }
  if (asset.mtime && !event.res.headers.has("Last-Modified")) {
    event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !event.res.headers.has("Content-Encoding")) {
    event.res.headers.set("Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !event.res.headers.has("Content-Length")) {
    event.res.headers.set("Content-Length", asset.size.toString());
  }
  return readAsset(id);
});

const findRouteRules = (m,p)=>{return [];};

const _lazy_sAPd0N = defineLazyEventHandler(() => Promise.resolve().then(function () { return cron_get$1; }));
const _lazy_c56xaJ = defineLazyEventHandler(() => Promise.resolve().then(function () { return _id__get$1; }));
const _lazy_nOxxis = defineLazyEventHandler(() => Promise.resolve().then(function () { return devTasks$1; }));

const findRoute = (m,p)=>{if(p[p.length-1]==='/')p=p.slice(0,-1)||'/';if(p==="/cron"){if(m==='GET')return {data:{route:"/cron",method:"get",handler:_lazy_sAPd0N}};}let s=p.split('/'),l=s.length-1;if(s[1]==="process-user"){if(l===2||l===1){if(m==='GET')if(l>=2)return {data:{route:"/process-user/:id",method:"get",handler:_lazy_c56xaJ},params:{"id":s[2],}};}}if(s[1]==="_nitro"){if(s[2]==="tasks"){return {data:{route:"/_nitro/tasks/**",handler:_lazy_nOxxis},params:{"_":s.slice(3).join('/'),}};}}};

const findRoutedMiddleware = (m,p)=>{return [];};

const globalMiddleware = [toEventHandler(_8d_YKt)];

function useNitroApp() {
  return useNitroApp.__instance__ ??= initNitroApp();
}
function initNitroApp() {
  const nitroApp = createNitroApp();
  for (const plugin of plugins) {
    try {
      plugin(nitroApp);
    } catch (error) {
      nitroApp.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
  return nitroApp;
}
function createNitroApp() {
  const hooks = createHooks();
  const captureError = (error, errorCtx) => {
    const promise = hooks.callHookParallel("error", error, errorCtx).catch((hookError) => {
      console.error("Error while capturing another error", hookError);
    });
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({ error, context: errorCtx });
      }
      if (typeof errorCtx.event.req.waitUntil === "function") {
        errorCtx.event.req.waitUntil(promise);
      }
    }
  };
  const h3App = createH3App(captureError);
  let fetchHandler = async (req) => {
    req.context ??= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    const event = { req };
    const nitroApp = useNitroApp();
    await nitroApp.hooks.callHook("request", event).catch((error) => {
      captureError(error, { event, tags: ["request"] });
    });
    const response = await h3App.request(req, void 0, req.context);
    await nitroApp.hooks.callHook("response", response, event).catch((error) => {
      captureError(error, { event, tags: ["request", "response"] });
    });
    return response;
  };
  const requestHandler = (input, init, context) => {
    const req = toRequest(input, init);
    req.context = { ...req.context, ...context };
    return Promise.resolve(fetchHandler(req));
  };
  const originalFetch = globalThis.fetch;
  const nitroFetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("/")) {
      return requestHandler(input, init);
    }
    if (input instanceof Request && "_request" in input) {
      input = input._request;
    }
    return originalFetch(input, init);
  };
  globalThis.fetch = nitroFetch;
  const app = {
    _h3: h3App,
    hooks,
    fetch: requestHandler,
    captureError
  };
  return app;
}
function createH3App(captureError) {
  const DEBUG_MODE = ["1", "true", "TRUE"].includes(true + "");
  const h3App = new H3Core({
    debug: DEBUG_MODE,
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    }
  });
  h3App._findRoute = (event) => findRoute(event.req.method, event.url.pathname);
  h3App._getMiddleware = (event, route) => {
    event.url.pathname;
    event.req.method;
    const { routeRules, routeRuleMiddleware } = getRouteRules();
    event.context.routeRules = routeRules;
    return [
      ...routeRuleMiddleware,
      ...globalMiddleware,
      ...findRoutedMiddleware().map((r) => r.data),
      ...route?.data?.middleware || []
    ].filter(Boolean);
  };
  return h3App;
}
function getRouteRules(method, pathname) {
  const m = findRouteRules();
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = { ...currentRule.options, ...rule.options };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = { ...currentRule.params, ...layer.params };
      } else if (rule.options !== false) {
        routeRules[rule.name] = { ...rule, params: layer.params };
      }
    }
  }
  const middleware = [];
  for (const rule of Object.values(routeRules)) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}

const scheduledTasks = false;

const tasks = {
  
};

const __runningTasks__ = {};
async function runTask(name, {
  payload = {},
  context = {}
} = {}) {
  if (__runningTasks__[name]) {
    return __runningTasks__[name];
  }
  if (!(name in tasks)) {
    throw new HTTPError({
      message: `Task \`${name}\` is not available!`,
      status: 404
    });
  }
  if (!tasks[name].resolve) {
    throw new HTTPError({
      message: `Task \`${name}\` is not implemented!`,
      status: 501
    });
  }
  const handler = await tasks[name].resolve();
  const taskEvent = { name, payload, context };
  __runningTasks__[name] = handler.run(taskEvent);
  try {
    const res = await __runningTasks__[name];
    return res;
  } finally {
    delete __runningTasks__[name];
  }
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}

if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto;
}
trapUnhandledNodeErrors();
parentPort?.on("message", (msg) => {
  if (msg && msg.event === "shutdown") {
    shutdown();
  }
});
const nitroApp = useNitroApp();
const server = new Server(toNodeHandler(nitroApp.fetch));
let listener;
listen().catch((error) => {
  console.error("Dev worker failed to listen:", error);
  return shutdown();
});
async function listen() {
  const listenAddr = await isSocketSupported() ? getSocketAddress({
    name: `nitro-dev-${threadId}`,
    pid: true,
    random: true
  }) : { port: 0, host: "localhost" };
  return new Promise((resolve, reject) => {
    try {
      listener = server.listen(listenAddr, () => {
        const address = server.address();
        parentPort?.postMessage({
          event: "listen",
          address: typeof address === "string" ? { socketPath: address } : { host: "localhost", port: address?.port }
        });
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
async function shutdown() {
  server.closeAllConnections?.();
  await Promise.all([
    new Promise((resolve) => listener?.close(resolve)),
    nitroApp.hooks.callHook("close").catch(console.error)
  ]);
  parentPort?.postMessage({ event: "exit" });
}

class AppConfig extends Effect.Service()(
  "effect-queue-streams/domain/config/app-config/AppConfig",
  {
    effect: Effect.gen(function* () {
      const BASE_URL = yield* Config.string("VERCEL_URL").pipe(
        Config.map((url) => `https://${url}`),
        Config.withDefault("http://localhost:3000")
      );
      const VERCEL_AUTOMATION_BYPASS_SECRET = yield* Config.redacted(
        "VERCEL_AUTOMATION_BYPASS_SECRET"
      ).pipe(Config.option);
      return { BASE_URL, VERCEL_AUTOMATION_BYPASS_SECRET };
    }),
    dependencies: [Layer.setConfigProvider(ConfigProvider.fromEnv())]
  }
) {
}

const withHeaders = (headers) => (self) => self.pipe(
  HttpClient.mapRequest((req) => ({
    ...req,
    headers: { ...req.headers, ...headers }
  }))
);
class CronClient extends Effect.Service()(
  "effect-queue-streams/domain/cron/cron-client/CronClient",
  {
    effect: Effect.gen(function* () {
      const appConfig = yield* AppConfig;
      const client = yield* HttpClient.HttpClient;
      const defaultHeaders = yield* Option.match(
        appConfig.VERCEL_AUTOMATION_BYPASS_SECRET,
        {
          onNone: () => Effect.logWarning(
            "Vercel Automation Bypass Secret not set, requests may fail"
          ).pipe(() => Effect.succeed({})),
          onSome: (secret) => Effect.succeed({
            "x-vercel-protection-bypass": Redacted.value(secret)
          })
        }
      );
      return client.pipe(
        HttpClient.filterStatusOk,
        withHeaders(defaultHeaders)
      );
    })
  }
) {
}

class UserRepository extends Effect.Service()(
  "effect-queue-streams/domain/user/user.repository/UserRepository",
  {
    sync: () => ({
      getAll: Effect.fn("user-repository.getAll")(
        () => Random.nextIntBetween(100, 1e3).pipe(
          Effect.andThen((ms) => Effect.sleep(`${ms} millis`)),
          Effect.map(() => Array.range(0, 5))
        )
      ),
      getUserById: Effect.fn("user-repository.getUserById")(
        (id) => Random.nextIntBetween(100, 1e3).pipe(
          Effect.andThen((ms) => Effect.sleep(`${ms} millis`)),
          Effect.map(() => id)
        )
      )
    })
  }
) {
}

class UserService extends Effect.Service()(
  "effect-queue-streams/domain/user/user/UserService",
  {
    effect: Effect.gen(function* () {
      const userRepo = yield* UserRepository;
      const END = Symbol.for("END");
      const getUsersQueue = Effect.fn("user-service.getUsersQueue")(
        function* () {
          const userQueue = yield* Queue.unbounded();
          const users = yield* userRepo.getAll();
          yield* Queue.offerAll(userQueue, users);
          yield* Queue.offer(userQueue, END);
          return { queue: userQueue, endToken: END };
        }
      );
      const processUser = Effect.fn("user-service.processUser")(function* (id) {
        const user = yield* userRepo.getUserById(id);
        const wait = yield* Random.nextIntBetween(1e3, 5e3);
        yield* Effect.sleep(`${wait} millis`);
        return { user };
      });
      return { getUsersQueue, processUser };
    })
  }
) {
}

class CronService extends Effect.Service()(
  "effect-queue-streams/domain/cron/cron-service/CronService",
  {
    effect: Effect.gen(function* () {
      const appConfig = yield* AppConfig;
      const userService = yield* UserService;
      const client = yield* CronClient;
      const users = yield* userService.getUsersQueue();
      const usersStream = Stream.fromQueue(users.queue);
      yield* Effect.log(`Queue size: ${yield* Queue.size(users.queue)}`);
      const processUser = Effect.fn("cron-service.processUser")(function* (id) {
        const request = HttpClientRequest.get(
          `${appConfig.BASE_URL}/process-user/${id}`
        );
        const res = yield* client.execute(request).pipe(Effect.fork);
        yield* Fiber.join(res);
        yield* Effect.log(`Processing user: ${id}`);
      });
      const processUsers = Effect.fn("cron-service.processUsers")(function* () {
        return yield* usersStream.pipe(
          Stream.groupedWithin(5, "2 seconds"),
          Stream.throttle({
            cost: () => 1,
            units: 1,
            duration: "2 seconds"
          }),
          Stream.takeUntil((c) => Chunk.contains(c, users.endToken)),
          Stream.map((c) => Chunk.filter(c, (id) => id !== users.endToken)),
          Stream.filter((c) => !Chunk.isEmpty(c)),
          Stream.mapEffect(
            flow(
              Stream.fromChunk,
              Stream.schedule(Schedule.spaced("200 millis")),
              Stream.tap(processUser),
              Stream.runDrain
            )
          ),
          Stream.runDrain
        );
      });
      return { processUsers };
    })
  }
) {
}

const CronServiceLive = CronService.Default.pipe(
  Layer.provide(CronClient.Default),
  Layer.provide(UserService.Default),
  Layer.provide(UserRepository.Default),
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(AppConfig.Default)
);
const CronRuntime = ManagedRuntime.make(CronServiceLive);
const main$1 = Effect.gen(function* () {
  const cronService = yield* CronService;
  yield* cronService.processUsers();
  return { started: true };
});
const cron_get = defineHandler$1(() => CronRuntime.runPromise(main$1));

const cron_get$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: cron_get
});

const main = (user) => Effect.gen(function* () {
  const userService = yield* UserService;
  const start = yield* DateTime.now;
  yield* userService.processUser(user);
  const end = yield* DateTime.now;
  yield* Effect.log(
    `Processed user ${user} in ${end.epochMillis - start.epochMillis}`
  );
  return {
    response: `User ${user} processed in ${end.epochMillis - start.epochMillis} ms`
  };
});
const UserServiceLive = UserService.Default.pipe(
  Layer.provide(UserRepository.Default)
);
const ProcessUserRuntime = ManagedRuntime.make(UserServiceLive);
const _id__get = defineHandler$1(
  (event) => ProcessUserRuntime.runPromise(main(Number(event.context.params?.id)))
);

const _id__get$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: _id__get
});

const devTasks = new H3().get("/_nitro/tasks", async () => {
  const _tasks = await Promise.all(
    Object.entries(tasks).map(async ([name, task]) => {
      const _task = await task.resolve?.();
      return [name, { description: _task?.meta?.description }];
    })
  );
  return {
    tasks: Object.fromEntries(_tasks),
    scheduledTasks
  };
}).get("/_nitro/tasks/:name", async (event) => {
  const name = event.context.params?.name;
  const body = await event.req.json().catch(() => ({}));
  const payload = {
    ...Object.fromEntries(event.url.searchParams.entries()),
    ...body
  };
  return await runTask(name, { payload });
});

const devTasks$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: devTasks
});
//# sourceMappingURL=index.mjs.map
