import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Leads from '../models/leads';

puppeteer.use(StealthPlugin());

interface SearchTarget {
  location: string;
  niche: string;
  currency: string;
}

const searchTargets: SearchTarget[] = [
  // Ghana
  { location: 'Accra Ghana', niche: 'restaurants', currency: '₵' },
  { location: 'Accra Ghana', niche: 'schools', currency: '₵' },
  { location: 'Kumasi Ghana', niche: 'salons', currency: '₵' },
  { location: 'Tema Ghana', niche: 'shops', currency: '₵' },

  // UK
  { location: 'Manchester UK', niche: 'barbershops', currency: '£' },
  { location: 'Birmingham UK', niche: 'restaurants', currency: '£' },
  { location: 'London UK', niche: 'cleaning services', currency: '£' },

  // USA
  { location: 'Houston Texas', niche: 'plumbers', currency: '$' },
  { location: 'Atlanta Georgia', niche: 'salons', currency: '$' },
  { location: 'Dallas Texas', niche: 'restaurants', currency: '$' },

  // Canada
  { location: 'Toronto Canada', niche: 'driving schools', currency: '$' },
  { location: 'Vancouver Canada', niche: 'restaurants', currency: '$' },
];

interface Business {
  name: string;
  phone: string;
  address: string;
  location: string;
  niche: string;
  currency: string;
  hasWebsite: boolean;
  source: string;
}

export const runProspectingAgent = async (): Promise<void> => {
  console.log('🔍 Prospecting Agent started...');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ]
  });

  try {
    for (const target of searchTargets) {
      console.log(`Searching: ${target.niche} in ${target.location}`);
      await scrapeGoogleMaps(browser, target);
      // Wait 3 seconds between searches to avoid detection
      await new Promise(r => setTimeout(r, 3000));
    }
  } finally {
    await browser.close();
    console.log('✅ Prospecting Agent finished!');
  }
};

const scrapeGoogleMaps = async (browser: any, target: SearchTarget): Promise<void> => {
  const page = await browser.newPage();

  try {
    // Set user agent to look like real browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const searchQuery = encodeURIComponent(`${target.niche} in ${target.location}`);
    const url = `https://www.google.com/maps/search/${searchQuery}`;

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // Scroll to load more results
    await autoScroll(page);

    // Extract business listings
    const businesses = await page.evaluate(() => {
      const results: any[] = [];
      const items = document.querySelectorAll('[role="article"]');

      items.forEach((item: any) => {
        const name = item.querySelector('[aria-label]')?.getAttribute('aria-label') || 
                     item.querySelector('.qBF1Pd')?.textContent || '';
        const phone = item.querySelector('[data-tooltip="Copy phone number"]')?.textContent || '';
        const address = item.querySelector('.W4Efsd span:last-child')?.textContent || '';
        const hasWebsite = !!item.querySelector('a[data-value="Website"]');

        if (name) {
          results.push({ name, phone, address, hasWebsite });
        }
      });

      return results;
    });

    console.log(`Found ${businesses.length} businesses in ${target.location}`);

    // Filter businesses with NO website
    const noWebsite = businesses.filter((b: any) => !b.hasWebsite);
    console.log(`${noWebsite.length} have no website — potential leads!`);

    // Save to MongoDB
    for (const business of noWebsite) {
      await saveProspect({
        name: business.name,
        phone: business.phone,
        address: business.address,
        location: target.location,
        niche: target.niche,
        currency: target.currency,
        hasWebsite: false,
        source: 'google_maps'
      });
    }

  } catch (error) {
    console.error(`Error scraping ${target.location}:`, error);
  } finally {
    await page.close();
  }
};

const autoScroll = async (page: any): Promise<void> => {
  await page.evaluate(async () => {
    const scrollable = document.querySelector('[role="feed"]');
    if (!scrollable) return;

    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        scrollable.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= 3000) {
          clearInterval(timer);
          resolve();
        }
      }, 800);
    });
  });
};

const saveProspect = async (business: Business): Promise<void> => {
  try {
    // Check if prospect already exists
    const existing = await Leads.findOne({ 
      business: business.name,
      'conversation': { $size: 0 }
    });

    if (existing) {
      console.log(`Already exists: ${business.name}`);
      return;
    }

    const lead = new Leads({
      name: '',
      business: business.name,
      phone: business.phone,
      email: '',
      projectType: `${business.niche} website`,
      budget: '',
      timeline: '',
      status: 'new',
      conversation: [],
      source: 'prospecting',
      location: business.location,
      currency: business.currency,
    });

    await lead.save();
    console.log(`✅ Saved prospect: ${business.name}`);

  } catch (error) {
    console.error(`Error saving ${business.name}:`, error);
  }
};