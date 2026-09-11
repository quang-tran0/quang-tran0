#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const API_VERSION = "2022-11-28";
const USER_AGENT = "quang-tran0-profile-metrics";

const PILL_SPECS = {
  followers: {
    label: "Followers",
    title: "GitHub followers",
    color: "#188BD2",
    labelWidth: 60,
    iconPath:
      "M16 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 1c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4ZM8 14c-3.11 0-8 1.56-8 4v2h6v-3c0-1.13.44-2.1 1.18-2.9A7.66 7.66 0 0 1 8 14Z",
  },
  stars: {
    label: "Stars",
    title: "Stars earned across public repositories",
    color: "#0A2E97",
    labelWidth: 32,
    iconPath:
      "m12 1.7 3.1 6.28 6.93 1.01-5.02 4.89 1.19 6.9L12 17.52l-6.2 3.26 1.19-6.9-5.02-4.89 6.93-1.01L12 1.7Z",
  },
};

const THEMES = {
  light: {
    background: "#FFFFFF",
    border: "#D0D7DE",
    primary: "#1F2328",
    secondary: "#59636E",
    accent: "#188BD2",
  },
  dark: {
    background: "#0D1117",
    border: "#30363D",
    primary: "#F0F6FC",
    secondary: "#8B949E",
    accent: "#58A6FF",
  },
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function requireNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function formatCompact(value) {
  requireNonNegativeInteger(value, "Metric value");
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function sumStars(repositories, owner) {
  const normalizedOwner = owner.toLowerCase();
  return repositories
    .filter(
      (repository) =>
        !repository.fork &&
        repository.owner?.login?.toLowerCase() === normalizedOwner,
    )
    .reduce(
      (total, repository) =>
        total +
        requireNonNegativeInteger(
          repository.stargazers_count,
          `${repository.name ?? "Repository"} stars`,
        ),
      0,
    );
}

function metricPillSvg(kind, value) {
  const spec = PILL_SPECS[kind];
  if (!spec) throw new Error(`Unknown pill kind: ${kind}`);

  const displayValue = formatCompact(value);
  const capsuleWidth = Math.max(30, displayValue.length * 7 + 12);
  const capsuleX = 39 + spec.labelWidth + 8;
  const width = capsuleX + capsuleWidth + 9;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="40" viewBox="0 0 ${width} 40" role="img" aria-labelledby="title">
  <title id="title">${escapeXml(spec.title)}: ${escapeXml(value)}</title>
  <rect width="${width}" height="40" rx="20" fill="${spec.color}" />
  <path fill="#FFFFFF" transform="translate(14 11) scale(.75)" d="${spec.iconPath}" />
  <text x="39" y="20" fill="#FFFFFF" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="14" font-weight="600">${escapeXml(spec.label)}</text>
  <rect x="${capsuleX}" y="7" width="${capsuleWidth}" height="26" rx="13" fill="#000000" fill-opacity=".16" />
  <text x="${capsuleX + capsuleWidth / 2}" y="20" fill="#FFFFFF" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="600">${escapeXml(displayValue)}</text>
</svg>
`;
}

function statsCardSvg(data, themeName) {
  const theme = THEMES[themeName];
  if (!theme) throw new Error(`Unknown theme: ${themeName}`);

  const metrics = [
    [`Contributions ${data.year}`, data.contributions],
    [`Commits ${data.year}`, data.commits],
    [`Pull Requests ${data.year}`, data.pullRequests],
    ["Stars Earned", data.stars],
  ];
  const positions = [
    [24, 77],
    [252, 77],
    [24, 134],
    [252, 134],
  ];
  const metricMarkup = metrics
    .map(([label, value], index) => {
      const [x, y] = positions[index];
      return `  <g transform="translate(${x} ${y})">
    <rect width="4" height="40" rx="2" fill="${theme.accent}" />
    <text x="14" y="13" fill="${theme.secondary}" font-family="Arial, sans-serif" font-size="12">${escapeXml(label)}</text>
    <text x="14" y="37" fill="${theme.primary}" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeXml(Number(value).toLocaleString("en-US"))}</text>
  </g>`;
    })
    .join("\n");

  const description = metrics
    .map(([label, value]) => `${label}: ${value}`)
    .join(", ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="195" viewBox="0 0 480 195" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(data.displayName)}&apos;s GitHub Stats</title>
  <desc id="desc">${escapeXml(description)}</desc>
  <rect x=".5" y=".5" width="479" height="194" rx="12" fill="${theme.background}" stroke="${theme.border}" />
  <text x="24" y="37" fill="${theme.accent}" font-family="Arial, sans-serif" font-size="20" font-weight="700">${escapeXml(data.displayName)}&apos;s GitHub Stats</text>
  <text x="24" y="57" fill="${theme.secondary}" font-family="Arial, sans-serif" font-size="12">@${escapeXml(data.login)}</text>
  <g fill="none" stroke="${theme.accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".42">
    <path d="M358 27h28v15h28V31h28" />
    <circle cx="358" cy="27" r="2.5" fill="${theme.accent}" />
    <circle cx="386" cy="42" r="2.5" fill="${theme.accent}" />
    <circle cx="414" cy="31" r="2.5" fill="${theme.accent}" />
    <circle cx="442" cy="31" r="2.5" fill="${theme.accent}" />
  </g>
  <line x1="24" y1="66.5" x2="456" y2="66.5" stroke="${theme.border}" />
${metricMarkup}
</svg>
`;
}

async function requestJson(url, token, label, options = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": USER_AGENT,
    "X-GitHub-Api-Version": API_VERSION,
    ...options.headers,
  };

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let retryDelay = 500 * 2 ** (attempt - 1);
    try {
      const response = await fetch(url, { ...options, headers });
      if (response.ok) return await response.json();

      const retryAfterHeader = response.headers.get("retry-after");
      const rateLimitResetHeader = response.headers.get("x-ratelimit-reset");
      const retryAfter =
        retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader);
      const rateLimitReset =
        rateLimitResetHeader === null
          ? Number.NaN
          : Number(rateLimitResetHeader);
      const isRateLimited =
        response.status === 429 ||
        (response.status === 403 &&
          (response.headers.get("x-ratelimit-remaining") === "0" ||
            Number.isFinite(retryAfter)));

      if (isRateLimited && Number.isFinite(retryAfter)) {
        retryDelay = Math.min(Math.max(retryAfter * 1000, 0), 60_000);
      } else if (isRateLimited && Number.isFinite(rateLimitReset)) {
        retryDelay = Math.min(
          Math.max(rateLimitReset * 1000 - Date.now() + 1000, 0),
          60_000,
        );
      }

      if (response.status < 500 && !isRateLimited) {
        throw new Error(`${label} returned HTTP ${response.status}`);
      }
      if (attempt === 3) {
        throw new Error(`${label} returned HTTP ${response.status} after 3 attempts`);
      }
    } catch (error) {
      if (attempt === 3 || /returned HTTP 4\d\d/.test(error.message)) {
        throw error;
      }
    }
    await delay(retryDelay);
  }

  throw new Error(`${label} request failed`);
}

async function fetchOwnedRepositories(owner, token) {
  const repositories = [];
  for (let page = 1; page <= 20; page += 1) {
    const url = `https://api.github.com/users/${encodeURIComponent(owner)}/repos?type=owner&sort=updated&per_page=100&page=${page}`;
    const currentPage = await requestJson(url, token, "Repositories");
    if (!Array.isArray(currentPage)) {
      throw new Error("Repositories response was not an array");
    }
    repositories.push(...currentPage);
    if (currentPage.length < 100) return repositories;
  }
  throw new Error("Repository pagination exceeded 2,000 repositories");
}

async function fetchContributionData(owner, token, from, to) {
  const query = `
    query ProfileMetrics($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        login
        name
        followers { totalCount }
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar { totalContributions }
          totalCommitContributions
          totalPullRequestContributions
        }
      }
    }
  `;
  const response = await requestJson(
    "https://api.github.com/graphql",
    token,
    "Contribution data",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { login: owner, from, to } }),
    },
  );
  if (response.errors?.length) {
    throw new Error("Contribution data returned GraphQL errors");
  }
  if (!response.data?.user) throw new Error(`GitHub user ${owner} was not found`);
  return response.data.user;
}

async function generate(outputDirectory) {
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPOSITORY_OWNER;

  if (!githubToken) throw new Error("GITHUB_TOKEN is required");
  if (!owner) throw new Error("GITHUB_REPOSITORY_OWNER is required");

  const now = new Date();
  const year = now.getUTCFullYear();
  const from = new Date(Date.UTC(year, 0, 1)).toISOString();
  const to = now.toISOString();

  const [profile, repositories] = await Promise.all([
    fetchContributionData(owner, githubToken, from, to),
    fetchOwnedRepositories(owner, githubToken),
  ]);

  const contributions = profile.contributionsCollection;
  const data = {
    login: profile.login,
    displayName: profile.name || profile.login,
    year,
    contributions: requireNonNegativeInteger(
      contributions.contributionCalendar.totalContributions,
      "Contributions",
    ),
    commits: requireNonNegativeInteger(
      contributions.totalCommitContributions,
      "Commits",
    ),
    pullRequests: requireNonNegativeInteger(
      contributions.totalPullRequestContributions,
      "Pull requests",
    ),
    followers: requireNonNegativeInteger(
      profile.followers.totalCount,
      "Followers",
    ),
    stars: sumStars(repositories, owner),
  };

  const outputPath = resolve(outputDirectory);
  await mkdir(outputPath, { recursive: true });
  const assets = {
    "github-stats-light.svg": statsCardSvg(data, "light"),
    "github-stats-dark.svg": statsCardSvg(data, "dark"),
    "followers-pill.svg": metricPillSvg("followers", data.followers),
    "stars-pill.svg": metricPillSvg("stars", data.stars),
  };
  await Promise.all(
    Object.entries(assets).map(([name, contents]) =>
      writeFile(resolve(outputPath, name), contents, "utf8"),
    ),
  );

  console.log(
    `Generated metrics for ${data.login}: ${data.contributions} contributions, ${data.stars} stars, ${data.followers} followers`,
  );
}

async function selfTest() {
  const repositories = [
    { name: "one", fork: false, stargazers_count: 3, owner: { login: "Quang-Tran0" } },
    { name: "fork", fork: true, stargazers_count: 99, owner: { login: "quang-tran0" } },
    { name: "two", fork: false, stargazers_count: 4, owner: { login: "quang-tran0" } },
    { name: "other", fork: false, stargazers_count: 8, owner: { login: "someone-else" } },
  ];
  assert.equal(sumStars(repositories, "quang-tran0"), 7);
  assert.equal(escapeXml(`RTL & <verification> "lab"`), "RTL &amp; &lt;verification&gt; &quot;lab&quot;");
  assert.equal(formatCompact(1234), "1.2K");
  assert.equal(formatCompact(999_999), "1M");

  const fixture = {
    login: "quang-tran0",
    displayName: "Quang & Tran",
    year: 2026,
    contributions: 320,
    commits: 280,
    pullRequests: 12,
    stars: 19,
  };
  const stats = statsCardSvg(fixture, "light");
  assert.match(stats, /width="480" height="195"/);
  assert.match(stats, /Quang &amp; Tran/);

  const pill = metricPillSvg("followers", 42);
  assert.match(pill, /height="40"/);
  assert.match(pill, /Followers/);
  assert.match(pill, /GitHub followers: 42/);

  const originalFetch = globalThis.fetch;
  let attempts = 0;
  try {
    globalThis.fetch = async () => {
      attempts += 1;
      if (attempts === 1) {
        return new Response("rate limited", {
          status: 403,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000)),
          },
        });
      }
      return Response.json({ ok: true });
    };
    assert.deepEqual(
      await requestJson("https://api.github.test", "token", "Test request"),
      { ok: true },
    );
    assert.equal(attempts, 2);

  } finally {
    globalThis.fetch = originalFetch;
  }
  console.log("Self-test passed");
}

const args = process.argv.slice(2);
if (args.includes("--self-test")) {
  await selfTest();
} else {
  const outputIndex = args.indexOf("--output-dir");
  if (outputIndex === -1 || !args[outputIndex + 1]) {
    throw new Error("Usage: generate-profile-metrics.mjs --output-dir <directory>");
  }
  await generate(args[outputIndex + 1]);
}
