import config from '../../../../keystatic.config.js';
import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import { parseString } from 'set-cookie-parser';

function tryOrUndefined(fn) {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

function makeHandler(_config) {
  return async function keystaticAPIRoute(context) {
    const envVarsForCf = context.locals?.runtime?.env;
    const handler = makeGenericAPIRouteHandler(
      {
        ..._config,
        clientId:
          _config.clientId ??
          envVarsForCf?.KEYSTATIC_GITHUB_CLIENT_ID ??
          tryOrUndefined(() => import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID),
        clientSecret:
          _config.clientSecret ??
          envVarsForCf?.KEYSTATIC_GITHUB_CLIENT_SECRET ??
          tryOrUndefined(() => import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET),
        secret:
          _config.secret ?? envVarsForCf?.KEYSTATIC_SECRET ?? tryOrUndefined(() => import.meta.env.KEYSTATIC_SECRET),
      },
      {
        slugEnvName: 'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
      }
    );

    const { body, headers, status } = await handler(context.request);
    const normalizedHeaders = new Map();

    if (headers) {
      if (Array.isArray(headers)) {
        for (const [key, value] of headers) {
          const lower = key.toLowerCase();
          if (!normalizedHeaders.has(lower)) normalizedHeaders.set(lower, []);
          normalizedHeaders.get(lower).push(value);
        }
      } else if (typeof headers.entries === 'function') {
        for (const [key, value] of headers.entries()) {
          normalizedHeaders.set(key.toLowerCase(), [value]);
        }
        if ('getSetCookie' in headers && typeof headers.getSetCookie === 'function') {
          const setCookieHeaders = headers.getSetCookie();
          if (setCookieHeaders?.length) {
            normalizedHeaders.set('set-cookie', setCookieHeaders);
          }
        }
      } else {
        for (const [key, value] of Object.entries(headers)) {
          normalizedHeaders.set(key.toLowerCase(), [value]);
        }
      }
    }

    const setCookieHeaders = normalizedHeaders.get('set-cookie');
    normalizedHeaders.delete('set-cookie');

    if (setCookieHeaders) {
      for (const setCookieValue of setCookieHeaders) {
        const { name, value, ...options } = parseString(setCookieValue);
        const sameSite = options.sameSite?.toLowerCase();
        context.cookies.set(name, value, {
          domain: options.domain,
          expires: options.expires,
          httpOnly: options.httpOnly,
          maxAge: options.maxAge,
          path: options.path,
          sameSite: sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none' ? sameSite : undefined,
        });
      }
    }

    return new Response(body, {
      status,
      headers: [...normalizedHeaders.entries()].flatMap(([key, values]) => values.map((value) => [key, value])),
    });
  };
}

export const all = makeHandler({ config });
export const ALL = all;
export const prerender = false;
