import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';

export interface ScrapedJob {
  company: string | null;
  position: string | null;
  location: string | null;
  salary: string | null;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
};

const tryJsonLd = (html: string): Partial<ScrapedJob> => {
  const matches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of matches) {
    try {
      const json = JSON.parse(block.replace(/<script[^>]*>|<\/script>/gi, '').trim());
      const entries = Array.isArray(json) ? json : [json];
      for (const entry of entries) {
        if (entry['@type'] === 'JobPosting') {
          const salary = entry.baseSalary
            ? `${entry.baseSalary?.value?.minValue ?? ''}–${entry.baseSalary?.value?.maxValue ?? ''} ${entry.baseSalary?.currency ?? ''}`.trim()
            : null;
          return {
            company: entry.hiringOrganization?.name ?? null,
            position: entry.title ?? null,
            location:
              entry.jobLocation?.address?.addressLocality ??
              entry.jobLocation?.address?.addressRegion ??
              (typeof entry.jobLocation === 'string' ? entry.jobLocation : null),
            salary: salary || null,
          };
        }
      }
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return {};
};

const tryMeta = ($: cheerio.CheerioAPI): Partial<ScrapedJob> => {
  const ogTitle = $('meta[property="og:title"]').attr('content') ?? null;
  const ogSite = $('meta[property="og:site_name"]').attr('content') ?? null;
  const h1 = $('h1').first().text().trim() || null;
  const title = $('title').text().trim() || null;

  let position: string | null = null;
  let company: string | null = null;

  if (ogTitle) {
    // Common pattern: "Position | Company" or "Position at Company"
    const pipe = ogTitle.split(/\s*[|\-–]\s*/);
    if (pipe.length >= 2) {
      position = pipe[0].trim();
      company = pipe[pipe.length - 1].trim();
    } else {
      position = ogTitle;
    }
  } else if (h1) {
    position = h1;
  } else if (title) {
    position = title;
  }

  if (!company) company = ogSite;

  return { position, company, location: null, salary: null };
};

export const scrapeJob = async (url: string): Promise<ScrapedJob> => {
  let html: string;
  try {
    const { data } = await axios.get<string>(url, {
      headers: HEADERS,
      timeout: 8_000,
      maxRedirects: 5,
      responseType: 'text',
    });
    html = data;
  } catch (err: any) {
    logger.warn({ url, err: err.message }, 'Scrape fetch failed');
    throw { statusCode: 422, message: 'Could not fetch the URL. The site may block automated requests.' };
  }

  const $ = cheerio.load(html);
  const fromJsonLd = tryJsonLd(html);
  const fromMeta = tryMeta($);

  return {
    company: fromJsonLd.company ?? fromMeta.company ?? null,
    position: fromJsonLd.position ?? fromMeta.position ?? null,
    location: fromJsonLd.location ?? fromMeta.location ?? null,
    salary: fromJsonLd.salary ?? null,
  };
};
