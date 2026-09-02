/**
 * ProofChain - Social Media Post Image Scraper
 * Extracts og:image, twitter:image, or main photo from social URLs (X, Instagram, LinkedIn, GitHub, blogs).
 */

export interface ScrapedPostResult {
  postUrl: string;
  imageUrl: string;
  pageTitle: string;
  platform: 'Instagram' | 'X / Twitter' | 'LinkedIn' | 'GitHub' | 'Blog' | 'Direct Image';
  authorHandle?: string;
  description?: string;
}

export async function extractPostImage(url: string): Promise<ScrapedPostResult> {
  const cleanUrl = url.trim();

  // 1. Direct Image URL check
  if (
    cleanUrl.match(/\.(jpeg|jpg|png|webp|avif|gif)(\?.*)?$/i) ||
    cleanUrl.includes('images.unsplash.com') ||
    cleanUrl.includes('pbs.twimg.com/media') ||
    cleanUrl.includes('avatars.githubusercontent.com')
  ) {
    return {
      postUrl: cleanUrl,
      imageUrl: cleanUrl,
      pageTitle: 'Direct Image Asset',
      platform: 'Direct Image'
    };
  }

  // Detect platform
  let platform: ScrapedPostResult['platform'] = 'Blog';
  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) platform = 'X / Twitter';
  else if (cleanUrl.includes('instagram.com')) platform = 'Instagram';
  else if (cleanUrl.includes('linkedin.com')) platform = 'LinkedIn';
  else if (cleanUrl.includes('github.com')) platform = 'GitHub';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 ProofChain-Verifier/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching post URL.`);
    }

    const html = await response.text();

    // Extract Open Graph & Twitter meta tags via regex
    const ogImageMatch =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i);

    const twitterImageMatch =
      html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i);

    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const descMatch =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);

    let imageUrl = ogImageMatch ? ogImageMatch[1] : twitterImageMatch ? twitterImageMatch[1] : null;

    // If relative URL, make absolute
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      try {
        const parsedBase = new URL(cleanUrl);
        imageUrl = new URL(imageUrl, parsedBase.origin).href;
      } catch {
        // keep as is
      }
    }

    // Fallback: look for <img> in the body if meta tag is missing
    if (!imageUrl) {
      const imgMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }

    if (!imageUrl) {
      throw new Error('Could not find Open Graph (og:image) or image asset in social media post URL.');
    }

    const pageTitle = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').trim() : 'Social Media Post';
    const description = descMatch ? descMatch[1].replace(/&amp;/g, '&').trim() : undefined;

    return {
      postUrl: cleanUrl,
      imageUrl,
      pageTitle,
      platform,
      description
    };
  } catch (err: any) {
    // If external site blocks scraper (e.g. strict CORS/login wall), fallback gracefully if it was a direct url or inform user
    throw new Error(
      `Failed to extract post image from URL: ${err.message || 'Network timeout'}. Tip: Provide a direct public post image URL or check the link.`
    );
  }
}
