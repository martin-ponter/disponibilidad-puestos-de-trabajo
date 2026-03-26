export const config = {
  runtime: "edge",
};

const ALLOWED_METHODS = new Set(["GET", "POST"]);

function appendEntries(target, entries) {
  for (const [key, value] of entries) {
    target.append(key, value);
  }
}

function appendJsonValue(params, key, value) {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    params.append(key, "");
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendJsonValue(params, key, item);
    }
    return;
  }

  if (typeof value === "object") {
    params.append(key, JSON.stringify(value));
    return;
  }

  params.append(key, String(value));
}

async function readBodyParams(request) {
  const params = new URLSearchParams();
  const contentType = request.headers.get("content-type") ?? "";

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();

    for (const [key, value] of formData.entries()) {
      params.append(key, typeof value === "string" ? value : value.name);
    }

    return params;
  }

  if (contentType.includes("application/json")) {
    const json = await request.json();

    if (json && typeof json === "object" && !Array.isArray(json)) {
      for (const [key, value] of Object.entries(json)) {
        appendJsonValue(params, key, value);
      }
    }
  }

  return params;
}

function redirectToApp(request, bodyParams = new URLSearchParams()) {
  const currentUrl = new URL(request.url);
  const targetUrl = new URL("/", currentUrl);
  const mergedParams = new URLSearchParams();

  appendEntries(mergedParams, currentUrl.searchParams.entries());
  appendEntries(mergedParams, bodyParams.entries());

  targetUrl.search = mergedParams.toString();

  return Response.redirect(targetUrl, request.method === "POST" ? 303 : 302);
}

export default async function handler(request) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: "GET, POST",
      },
    });
  }

  const bodyParams =
    request.method === "POST"
      ? await readBodyParams(request)
      : new URLSearchParams();

  return redirectToApp(request, bodyParams);
}
