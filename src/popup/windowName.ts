"use strict";

// The automatic name of a window, made from the sites its tabs are on.
// Pure (no browser APIs), so it is unit tested in tests/windowName.test.ts.

import { ICANN, PRIVATE } from "./psl.ts";

export interface NameTab {
	url?: string;
	pendingUrl?: string;
	title?: string;
	lastAccessed?: number;
	active?: boolean;
}

// Known sites, by host or by any parent domain of the host (the longest match
// wins, so "docs.google.com" beats a plain "google.com" entry, and
// "console.aws.amazon.com" beats the "amazon.*" wildcard: the table is looked
// up before wildcards). "amazon.*" matches the label under any tld. Extend freely.
const KNOWN_SITES: Record<string, string> = {
	// Google
	"mail.google.com": "Gmail",
	"docs.google.com": "Google Docs",
	"sheets.google.com": "Google Sheets",
	"slides.google.com": "Google Slides",
	"drive.google.com": "Google Drive",
	"calendar.google.com": "Google Calendar",
	"meet.google.com": "Google Meet",
	"maps.google.com": "Google Maps",
	"maps.app.goo.gl": "Google Maps",
	"photos.google.com": "Google Photos",
	"keep.google.com": "Google Keep",
	"translate.google.com": "Google Translate",
	"gemini.google.com": "Gemini",
	"console.firebase.google.com": "Firebase",
	"firebase.google.com": "Firebase",
	"console.cloud.google.com": "Google Cloud",
	"cloud.google.com": "Google Cloud",
	"analytics.google.com": "Google Analytics",
	"ads.google.com": "Google Ads",
	"search.google.com": "Search Console",
	"play.google.com": "Google Play",
	"developers.google.com": "Google Developers",
	"developer.chrome.com": "Chrome Developers",
	"chromewebstore.google.com": "Chrome Web Store",
	"chrome.google.com": "Chrome",
	"fonts.google.com": "Google Fonts",
	"aistudio.google.com": "AI Studio",
	"colab.research.google.com": "Colab",
	"scholar.google.com": "Google Scholar",
	"news.google.com": "Google News",
	"contacts.google.com": "Google Contacts",
	"myaccount.google.com": "Google Account",
	"accounts.google.com": "Google Account",
	"forms.google.com": "Google Forms",
	"sites.google.com": "Google Sites",
	"groups.google.com": "Google Groups",
	"chat.google.com": "Google Chat",
	"voice.google.com": "Google Voice",
	"earth.google.com": "Google Earth",
	"trends.google.com": "Google Trends",
	"business.google.com": "Google Business",
	"admin.google.com": "Google Admin",
	"notebooklm.google.com": "NotebookLM",
	"labs.google.com": "Google Labs",
	"workspace.google.com": "Google Workspace",
	"one.google.com": "Google One",
	"pay.google.com": "Google Pay",
	"store.google.com": "Google Store",
	"support.google.com": "Google Support",
	"takeout.google.com": "Google Takeout",
	"tagmanager.google.com": "Tag Manager",
	"lens.google.com": "Google Lens",
	"books.google.com": "Google Books",
	"patents.google.com": "Google Patents",
	"flights.google.com": "Google Flights",
	"travel.google.com": "Google Travel",
	"podcasts.google.com": "Google Podcasts",
	"google.*": "Google",
	// search engines
	"bing.com": "Bing",
	"duckduckgo.com": "DuckDuckGo",
	"search.yahoo.com": "Yahoo",
	"ecosia.org": "Ecosia",
	"startpage.com": "Startpage",
	"search.brave.com": "Brave Search",
	"kagi.com": "Kagi",
	"yandex.*": "Yandex",
	"baidu.com": "Baidu",
	"perplexity.ai": "Perplexity",
	// Microsoft, Apple
	"outlook.live.com": "Outlook",
	"outlook.office.com": "Outlook",
	"teams.microsoft.com": "Teams",
	"portal.azure.com": "Azure",
	"login.microsoftonline.com": "Microsoft",
	"microsoft.com": "Microsoft",
	"office.com": "Office",
	"onedrive.live.com": "OneDrive",
	"apple.com": "Apple",
	"icloud.com": "iCloud",
	// work and productivity
	"atlassian.net": "Jira",
	"slack.com": "Slack",
	"zoom.us": "Zoom",
	"notion.so": "Notion",
	"figma.com": "Figma",
	"trello.com": "Trello",
	"asana.com": "Asana",
	"monday.com": "monday.com",
	"clickup.com": "ClickUp",
	"linear.app": "Linear",
	"miro.com": "Miro",
	"canva.com": "Canva",
	"dropbox.com": "Dropbox",
	"wetransfer.com": "WeTransfer",
	// AI
	"chat.openai.com": "ChatGPT",
	"chatgpt.com": "ChatGPT",
	"claude.ai": "Claude",
	"claude.com": "Claude",
	"code.claude.com": "Claude Code",
	"docs.claude.com": "Claude Docs",
	"huggingface.co": "Hugging Face",
	"kaggle.com": "Kaggle",
	"deepl.com": "DeepL",
	// social, media, messaging
	"x.com": "X",
	"twitter.com": "X",
	"youtu.be": "YouTube",
	"youtube.com": "YouTube",
	"reddit.com": "Reddit",
	"facebook.com": "Facebook",
	"instagram.com": "Instagram",
	"linkedin.com": "LinkedIn",
	"tiktok.com": "TikTok",
	"pinterest.*": "Pinterest",
	"web.whatsapp.com": "WhatsApp",
	"web.telegram.org": "Telegram",
	"discord.com": "Discord",
	"twitch.tv": "Twitch",
	"netflix.com": "Netflix",
	"open.spotify.com": "Spotify",
	"medium.com": "Medium",
	"imdb.com": "IMDb",
	// developer
	"github.com": "GitHub",
	"gitlab.com": "GitLab",
	"bitbucket.org": "Bitbucket",
	"stackoverflow.com": "Stack Overflow",
	"developer.mozilla.org": "MDN",
	"npmjs.com": "npm",
	"news.ycombinator.com": "Hacker News",
	"dev.to": "DEV",
	"codepen.io": "CodePen",
	"jsfiddle.net": "JSFiddle",
	"stackblitz.com": "StackBlitz",
	"codesandbox.io": "CodeSandbox",
	"replit.com": "Replit",
	"unity.com": "Unity",
	"docs.unity3d.com": "Unity",
	"unrealengine.com": "Unreal",
	"steampowered.com": "Steam",
	"steamcommunity.com": "Steam",
	// cloud and payments
	"aws.amazon.com": "AWS",
	"console.aws.amazon.com": "AWS",
	"vercel.com": "Vercel",
	"netlify.com": "Netlify",
	"cloudflare.com": "Cloudflare",
	"dash.cloudflare.com": "Cloudflare",
	"paypal.com": "PayPal",
	"stripe.com": "Stripe",
	// shopping and travel
	"amazon.*": "Amazon",
	"ebay.*": "eBay",
	"aliexpress.*": "AliExpress",
	"shopee.*": "Shopee",
	"lazada.*": "Lazada",
	"booking.com": "Booking.com",
	"airbnb.*": "Airbnb",
	"agoda.com": "Agoda",
	"tripadvisor.*": "Tripadvisor",
	// reference and learning
	"wikipedia.org": "Wikipedia",
	"wolframalpha.com": "Wolfram|Alpha",
	"archive.org": "Internet Archive",
	"web.archive.org": "Wayback Machine",
	"coursera.org": "Coursera",
	"udemy.com": "Udemy",
	"addons.mozilla.org": "Firefox Add-ons",
	"mozilla.org": "Mozilla",
	// news
	"bbc.co.uk": "BBC",
	"bbc.com": "BBC",
	"theguardian.com": "The Guardian",
	"cnn.com": "CNN",
	"reuters.com": "Reuters",
	"spiegel.de": "Spiegel",
	"tagesschau.de": "Tagesschau",
	"heise.de": "heise",
	"golem.de": "Golem",
	"zeit.de": "ZEIT",
	"faz.net": "FAZ",
	"sueddeutsche.de": "SZ",
	"bild.de": "BILD",
	// news (more)
	"nytimes.com": "The New York Times",
	"washingtonpost.com": "The Washington Post",
	"usatoday.com": "USA Today",
	"latimes.com": "LA Times",
	"nypost.com": "NY Post",
	"wsj.com": "WSJ",
	"cnbc.com": "CNBC",
	"cbsnews.com": "CBS News",
	"nbcnews.com": "NBC News",
	"abcnews.com": "ABC News",
	"foxnews.com": "Fox News",
	"apnews.com": "AP News",
	"npr.org": "NPR",
	"pbs.org": "PBS",
	"msn.com": "MSN",
	"aol.com": "AOL",
	"huffpost.com": "HuffPost",
	"businessinsider.com": "Business Insider",
	"forbes.com": "Forbes",
	"newsweek.com": "Newsweek",
	"time.com": "TIME",
	"people.com": "People",
	"variety.com": "Variety",
	"hollywoodreporter.com": "The Hollywood Reporter",
	"rollingstone.com": "Rolling Stone",
	"nationalgeographic.com": "National Geographic",
	"buzzfeed.com": "BuzzFeed",
	"thesun.co.uk": "The Sun",
	"the-sun.com": "The Sun",
	"thetimes.com": "The Times",
	"telegraph.co.uk": "The Telegraph",
	"independent.co.uk": "The Independent",
	"mirror.co.uk": "Daily Mirror",
	"express.co.uk": "Daily Express",
	"dailymail.co.uk": "Daily Mail",
	"dailymail.com": "Daily Mail",
	"standard.co.uk": "Evening Standard",
	"metro.co.uk": "Metro",
	"manchestereveningnews.co.uk": "Manchester Evening News",
	"liverpoolecho.co.uk": "Liverpool Echo",
	"walesonline.co.uk": "WalesOnline",
	"birminghammail.co.uk": "Birmingham Mail",
	"dailyrecord.co.uk": "Daily Record",
	"skysports.com": "Sky Sports",
	"sky.com": "Sky",
	"itv.com": "ITV",
	"espn.com": "ESPN",
	"cbssports.com": "CBS Sports",
	"foxsports.com": "Fox Sports",
	"si.com": "Sports Illustrated",
	"indiatimes.com": "Times of India",
	"hindustantimes.com": "Hindustan Times",
	"ndtv.com": "NDTV",
	"globo.com": "Globo",
	"uol.com.br": "UOL",
	// tech, entertainment, media
	"cnet.com": "CNET",
	"techradar.com": "TechRadar",
	"tomsguide.com": "Tom's Guide",
	"pcmag.com": "PCMag",
	"ign.com": "IGN",
	"gamespot.com": "GameSpot",
	"screenrant.com": "Screen Rant",
	"gamerant.com": "Game Rant",
	"thegamer.com": "TheGamer",
	"cbr.com": "CBR",
	"collider.com": "Collider",
	"digitalspy.com": "Digital Spy",
	"radiotimes.com": "Radio Times",
	"tvguide.com": "TV Guide",
	"tvinsider.com": "TV Insider",
	"justwatch.com": "JustWatch",
	"rottentomatoes.com": "Rotten Tomatoes",
	"themoviedb.org": "TMDB",
	"letterboxd.com": "Letterboxd",
	"filmaffinity.com": "FilmAffinity",
	"tvtropes.org": "TV Tropes",
	"fandango.com": "Fandango",
	"primevideo.com": "Prime Video",
	"dailymotion.com": "Dailymotion",
	"soundcloud.com": "SoundCloud",
	"deviantart.com": "DeviantArt",
	"tumblr.com": "Tumblr",
	"threads.com": "Threads",
	"threads.net": "Threads",
	"quora.com": "Quora",
	"fandom.com": "Fandom",
	"genius.com": "Genius",
	"goodreads.com": "Goodreads",
	"scribd.com": "Scribd",
	"slideshare.net": "SlideShare",
	"prezi.com": "Prezi",
	"shutterstock.com": "Shutterstock",
	"istockphoto.com": "iStock",
	"gettyimages.com": "Getty Images",
	"gettyimages.co.uk": "Getty Images",
	"alamy.com": "Alamy",
	"dreamstime.com": "Dreamstime",
	"pixabay.com": "Pixabay",
	"unsplash.com": "Unsplash",
	"freepik.com": "Freepik",
	"vecteezy.com": "Vecteezy",
	"flickr.com": "Flickr",
	"softonic.com": "Softonic",
	"uptodown.com": "Uptodown",
	"adobe.com": "Adobe",
	"plex.tv": "Plex",
	"mubi.com": "MUBI",
	// reference and learning (more)
	"britannica.com": "Britannica",
	"wiktionary.org": "Wiktionary",
	"wikihow.com": "wikiHow",
	"wikimedia.org": "Wikimedia",
	"wikidata.org": "Wikidata",
	"wikiwand.com": "Wikiwand",
	"merriam-webster.com": "Merriam-Webster",
	"dictionary.com": "Dictionary.com",
	"thesaurus.com": "Thesaurus.com",
	"collinsdictionary.com": "Collins Dictionary",
	"oxfordlearnersdictionaries.com": "Oxford Learner's Dictionaries",
	"ldoceonline.com": "Longman Dictionary",
	"thefreedictionary.com": "The Free Dictionary",
	"yourdictionary.com": "YourDictionary",
	"vocabulary.com": "Vocabulary.com",
	"wordreference.com": "WordReference",
	"reverso.net": "Reverso",
	"bab.la": "bab.la",
	"glosbe.com": "Glosbe",
	"wordhippo.com": "WordHippo",
	"powerthesaurus.org": "Power Thesaurus",
	"urbandictionary.com": "Urban Dictionary",
	"etymonline.com": "Etymonline",
	"oed.com": "OED",
	"hinative.com": "HiNative",
	"stackexchange.com": "Stack Exchange",
	"geeksforgeeks.org": "GeeksforGeeks",
	"khanacademy.org": "Khan Academy",
	"quizlet.com": "Quizlet",
	"brainly.com": "Brainly",
	"brainly.in": "Brainly",
	"study.com": "Study.com",
	"studocu.com": "Studocu",
	"byjus.com": "BYJU'S",
	"libretexts.org": "LibreTexts",
	"ck12.org": "CK-12",
	"sciencedirect.com": "ScienceDirect",
	"researchgate.net": "ResearchGate",
	"springer.com": "Springer",
	"investopedia.com": "Investopedia",
	"nerdwallet.com": "NerdWallet",
	"howstuffworks.com": "HowStuffWorks",
	"thoughtco.com": "ThoughtCo",
	"timeanddate.com": "timeanddate",
	"accuweather.com": "AccuWeather",
	"weather.com": "The Weather Channel",
	"famousbirthdays.com": "Famous Birthdays",
	// health and government
	"webmd.com": "WebMD",
	"healthline.com": "Healthline",
	"mayoclinic.org": "Mayo Clinic",
	"clevelandclinic.org": "Cleveland Clinic",
	"hopkinsmedicine.org": "Johns Hopkins Medicine",
	"medicalnewstoday.com": "Medical News Today",
	"medicinenet.com": "MedicineNet",
	"verywellhealth.com": "Verywell Health",
	"everydayhealth.com": "Everyday Health",
	"healthgrades.com": "Healthgrades",
	"goodrx.com": "GoodRx",
	"drugs.com": "Drugs.com",
	"medlineplus.gov": "MedlinePlus",
	"nih.gov": "NIH",
	"cdc.gov": "CDC",
	"nhs.uk": "NHS",
	"nhsinform.scot": "NHS inform",
	"patient.info": "Patient.info",
	"gov.uk": "GOV.UK",
	"company-information.service.gov.uk": "Companies House",
	"parliament.uk": "UK Parliament",
	"europa.eu": "European Union",
	"usda.gov": "USDA",
	"nps.gov": "National Park Service",
	"ca.gov": "California",
	"ny.gov": "New York State",
	"texas.gov": "Texas",
	// shopping, retail
	"walmart.com": "Walmart",
	"target.com": "Target",
	"etsy.com": "Etsy",
	"homedepot.com": "The Home Depot",
	"lowes.com": "Lowe's",
	"bestbuy.com": "Best Buy",
	"costco.com": "Costco",
	"kroger.com": "Kroger",
	"walgreens.com": "Walgreens",
	"cvs.com": "CVS",
	"macys.com": "Macy's",
	"nordstrom.com": "Nordstrom",
	"wayfair.com": "Wayfair",
	"wayfair.co.uk": "Wayfair",
	"ikea.com": "IKEA",
	"hm.com": "H&M",
	"asos.com": "ASOS",
	"zalando.co.uk": "Zalando",
	"barnesandnoble.com": "Barnes & Noble",
	"dickssportinggoods.com": "Dick's Sporting Goods",
	"poshmark.com": "Poshmark",
	"alibaba.com": "Alibaba",
	"flipkart.com": "Flipkart",
	"mercadolivre.com.br": "Mercado Livre",
	"indiamart.com": "IndiaMART",
	"tesco.com": "Tesco",
	"sainsburys.co.uk": "Sainsbury's",
	"asda.com": "ASDA",
	"waitrose.com": "Waitrose",
	"argos.co.uk": "Argos",
	"johnlewis.com": "John Lewis",
	"marksandspencer.com": "Marks & Spencer",
	"next.co.uk": "Next",
	"very.co.uk": "Very",
	"boots.com": "Boots",
	"superdrug.com": "Superdrug",
	"currys.co.uk": "Currys",
	"diy.com": "B&Q",
	"screwfix.com": "Screwfix",
	"wickes.co.uk": "Wickes",
	"therange.co.uk": "The Range",
	"dunelm.com": "Dunelm",
	"wilko.com": "Wilko",
	"houseoffraser.co.uk": "House of Fraser",
	"selfridges.com": "Selfridges",
	"debenhams.com": "Debenhams",
	"newlook.com": "New Look",
	"boohoo.com": "boohoo",
	"sportsdirect.com": "Sports Direct",
	"flannels.com": "Flannels",
	"manomano.co.uk": "ManoMano",
	"onbuy.com": "OnBuy",
	"pricerunner.com": "PriceRunner",
	"pricespy.co.uk": "PriceSpy",
	"idealo.co.uk": "idealo",
	"idealo.de": "idealo",
	"kleinanzeigen.de": "Kleinanzeigen",
	"gumtree.com": "Gumtree",
	"moneysavingexpert.com": "MoneySavingExpert",
	"trustpilot.com": "Trustpilot",
	"which.co.uk": "Which?",
	// travel, local, food
	"expedia.com": "Expedia",
	"expedia.co.uk": "Expedia",
	"hotels.com": "Hotels.com",
	"trip.com": "Trip.com",
	"kayak.com": "KAYAK",
	"kayak.co.uk": "KAYAK",
	"skyscanner.net": "Skyscanner",
	"trivago.co.uk": "trivago",
	"travelocity.com": "Travelocity",
	"lastminute.com": "lastminute.com",
	"tui.co.uk": "TUI",
	"getyourguide.com": "GetYourGuide",
	"rome2rio.com": "Rome2Rio",
	"wanderlog.com": "Wanderlog",
	"timeout.com": "Time Out",
	"opentable.com": "OpenTable",
	"opentable.co.uk": "OpenTable",
	"yelp.com": "Yelp",
	"yelp.co.uk": "Yelp",
	"yelp.ca": "Yelp",
	"yell.com": "Yell",
	"yellowpages.com": "Yellow Pages",
	"thomsonlocal.com": "Thomson Local",
	"192.com": "192.com",
	"mapquest.com": "MapQuest",
	"waze.com": "Waze",
	"doordash.com": "DoorDash",
	"ubereats.com": "Uber Eats",
	"grubhub.com": "Grubhub",
	"postmates.com": "Postmates",
	"instacart.com": "Instacart",
	"deliveroo.co.uk": "Deliveroo",
	"just-eat.co.uk": "Just Eat",
	"allrecipes.com": "Allrecipes",
	"foodnetwork.com": "Food Network",
	"seriouseats.com": "Serious Eats",
	"tasteofhome.com": "Taste of Home",
	"bbcgoodfood.com": "BBC Good Food",
	"thekitchn.com": "The Kitchn",
	"thespruce.com": "The Spruce",
	"food.com": "Food.com",
	"eater.com": "Eater",
	"tastingtable.com": "Tasting Table",
	"cookpad.com": "Cookpad",
	// property, cars, jobs, services
	"zillow.com": "Zillow",
	"realtor.com": "Realtor.com",
	"redfin.com": "Redfin",
	"trulia.com": "Trulia",
	"apartments.com": "Apartments.com",
	"homes.com": "Homes.com",
	"houzz.com": "Houzz",
	"rightmove.co.uk": "Rightmove",
	"zoopla.co.uk": "Zoopla",
	"onthemarket.com": "OnTheMarket",
	"nextdoor.com": "Nextdoor",
	"nextdoor.co.uk": "Nextdoor",
	"patch.com": "Patch",
	"cars.com": "Cars.com",
	"cargurus.com": "CarGurus",
	"edmunds.com": "Edmunds",
	"kbb.com": "Kelley Blue Book",
	"carfax.com": "CARFAX",
	"autozone.com": "AutoZone",
	"autotrader.com": "Auto Trader",
	"autotrader.co.uk": "Auto Trader",
	"pistonheads.com": "PistonHeads",
	"theaa.com": "The AA",
	"rac.co.uk": "RAC",
	"indeed.com": "Indeed",
	"glassdoor.com": "Glassdoor",
	"glassdoor.co.uk": "Glassdoor",
	"ziprecruiter.com": "ZipRecruiter",
	"mumsnet.com": "Mumsnet",
	"checkatrade.com": "Checkatrade",
	"twinkl.co.uk": "Twinkl",
	"wise.com": "Wise",
	"investing.com": "Investing.com",
	"weebly.com": "Weebly",
	// international
	"naver.com": "NAVER",
	"yahoo.co.jp": "Yahoo! Japan",
	"rakuten.co.jp": "Rakuten",
	"weblio.jp": "Weblio",
	"ameblo.jp": "Ameblo",
	"note.com": "note",
	"tistory.com": "Tistory",
	"namu.wiki": "Namu Wiki",
	"allocine.fr": "AlloCiné",
	"pagesjaunes.fr": "PagesJaunes",
	"larousse.fr": "Larousse",
	"pons.com": "PONS",
	"rae.es": "RAE",
	"letras.com": "Letras",
	"letras.mus.br": "Letras",
	"sofascore.com": "Sofascore",
	"365scores.com": "365Scores",
	"harvard.edu": "Harvard",
	"cornell.edu": "Cornell",
	"cambridge.org": "Cambridge",
	"snyk.io": "Snyk",
	"dribbble.com": "Dribbble",
	"flaticon.com": "Flaticon",
	"plos.org": "PLOS",
	"wptavern.com": "WP Tavern",
	"trendshift.io": "Trendshift",
	"com.be": "Com.be",
	"gov.wales": "GOV.WALES",
};

// Paths that make a site into another one: host (no www), or "label.*" for
// any tld -> [path prefix, name]
const KNOWN_PATHS: Record<string, [string, string]> = {
	"google.*": ["/maps", "Google Maps"],
};

const BROWSER_SCHEMES = new Set(["chrome:", "about:", "edge:", "brave:", "moz-extension:", "chrome-extension:", "file:"]);
const SEPARATORS = /\s+(?:-|\||—|–|·|•|::|»)\s+/;
const MAX_TITLE_NAME = 40;
const MAX_PREFIX_MATCH = 24;
const LABEL_PREFIXES = ["fly", "my", "get", "go", "try", "use", "join", "the", "app", "shop", "hello", "meet", "visit", "we", "i"];
const VERSION_LIKE = /\d+\.\d+/;
const BROWSER_KEY = /^(chrome|about|edge|brave):/;

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

// "phuket-padel" -> "Phuket Padel"
function words(label: string): string {
	return label.split(/[-_]+/).filter(Boolean).map(capitalize).join(" ") || capitalize(label);
}

function slug(s: string): string {
	return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function isIp(host: string): boolean {
	return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[") || host.includes(":");
}

function titleSegments(title: string | undefined): string[] {
	const clean = (title || "").replace(/^\(\d+\+?\)\s*/, "").trim();
	if (!clean) return [];
	return clean.split(SEPARATORS).map((s) => s.trim()).filter(Boolean);
}

function noThe(s: string): string {
	return s.length > 6 && s.startsWith("the") ? s.slice(3) : s;
}

// 2 = equal, 1 = matches by prefix, 0 = no match
function matchesSlugs(s: string, l: string, segment: string): number {
	if (!s || !l) return 0;
	if (s === l) return 2;
	if (Math.min(s.length, l.length) < 3) return 0;
	return s.startsWith(l) || (l.startsWith(s) && segment.length <= 24) ? 1 : 0;
}

// the label with one known prefix removed ("flyasiana" -> "asiana"), if 4+ chars remain
function labelVariants(l: string): string[] {
	const out = [l];
	for (const p of LABEL_PREFIXES) if (l.startsWith(p) && l.length - p.length >= 4) out.push(l.slice(p.length));
	return out;
}

// a leading "the" is optional on either side: "The Guardian" ~ "guardian"
function matchesLabel(segment: string, label: string): boolean {
	if (segment.length > MAX_TITLE_NAME) return false;
	const s = slug(segment);
	let best = 0;
	for (const l of labelVariants(slug(label))) {
		best = Math.max(best, matchesSlugs(s, l, segment), matchesSlugs(noThe(s), l, segment), matchesSlugs(s, noThe(l), segment), matchesSlugs(noThe(s), noThe(l), segment));
	}
	if (best === 2) return true;
	if (best === 0) return false;
	return !VERSION_LIKE.test(segment) && segment.length <= MAX_PREFIX_MATCH;
}

// ASIANA AIRLINES -> Asiana Airlines (words of 5+ letters only: BBC, IKEA stay); villabox -> Villabox
function spell(segment: string): string {
	if (segment === segment.toUpperCase() && segment !== segment.toLowerCase()) {
		return segment.replace(/\p{L}{5,}/gu, (w) => w.charAt(0) + w.slice(1).toLowerCase());
	}
	if (segment === segment.toLowerCase() && !/\s/.test(segment)) return capitalize(segment);
	return segment;
}

function known(host: string, label: string, path: string): string | null {
	const p = KNOWN_PATHS[host] || KNOWN_PATHS[label + ".*"];
	if (p && path.startsWith(p[0])) return p[1];
	const parts = host.split(".");
	for (let i = 0; i < parts.length; i++) {
		const hit = KNOWN_SITES[parts.slice(i).join(".")];
		if (hit) return hit;
	}
	return KNOWN_SITES[label + ".*"] || null;
}

// Tenant hosts the PSL lacks
const EXTRA_PRIVATE = ["wordpress.com", "substack.com"];

// Rules of one TLD, parsed on first use; rules are stored without the TLD ("co", "*.kawasaki")
type Rules = { icann: Set<string>; priv: Set<string> };
const cache = new Map<string, Rules | null>();

function rulesFor(tld: string): Rules | null {
	let rules = cache.get(tld);
	if (rules !== undefined) return rules;
	const icann = ICANN[tld];
	const priv = PRIVATE[tld];
	const extra = EXTRA_PRIVATE.filter((e) => e.endsWith("." + tld)).map((e) => e.slice(0, -tld.length - 1));
	if (icann === undefined && priv === undefined && !extra.length) rules = null;
	else {
		rules = {
			icann: new Set(icann ? icann.split(" ") : []),
			priv: new Set([...(priv ? priv.split(" ") : []), ...extra]),
		};
	}
	cache.set(tld, rules);
	return rules;
}

// The public suffix of a host (https://github.com/publicsuffix/list/wiki/Format):
// an exception rule beats everything, else the longest matching rule wins
// (a wildcard rule matches one extra label), else the last label.
export function publicSuffix(host: string): { suffix: string; private: boolean } {
	const labels = host.split(".");
	const n = labels.length;
	const tld = labels[n - 1];
	const rules = rulesFor(tld);
	if (!rules) return { suffix: tld, private: false };
	const find = (rule: string): boolean | null => (rules.icann.has(rule) ? false : rules.priv.has(rule) ? true : null);
	for (let i = 0; i < n - 1; i++) {
		const exception = find("!" + labels.slice(i, n - 1).join("."));
		if (exception !== null) return { suffix: labels.slice(i + 1).join("."), private: exception };
	}
	for (let i = 0; i < n - 1; i++) {
		const rest = labels.slice(i + 1, n - 1).join(".");
		const hit = find(labels.slice(i, n - 1).join(".")) ?? (rest ? find("*." + rest) : null);
		if (hit !== null) return { suffix: labels.slice(i).join("."), private: hit };
	}
	return { suffix: tld, private: false };
}

// { label: the site's own word, key: what identifies the site }
function registrable(host: string): { label: string; key: string; tenant?: boolean } {
	const parts = host.split(".");
	const { suffix, private: isPrivate } = publicSuffix(host);
	if (host === suffix) return { label: parts[0], key: host };
	const label = parts[parts.length - suffix.split(".").length - 1];
	return { label, key: label + "." + suffix, tenant: isPrivate };
}

export function siteOf(tab: NameTab): { key: string; name: string } | null {
	const raw = tab.pendingUrl || tab.url;
	if (!raw) return null;
	let url: URL;
	try {
		url = new URL(raw);
	} catch (e) {
		return null;
	}

	if (url.protocol === "view-source:") return siteOf({ ...tab, pendingUrl: "", url: url.pathname });

	if (BROWSER_SCHEMES.has(url.protocol)) {
		const scheme = url.protocol;
		if (scheme === "file:") return { key: "file:", name: "Files" };
		const host = url.hostname || url.pathname.replace(/^\/+/, "").split(/[/?#]/)[0];
		if (!host) return null;
		const first = titleSegments(tab.title)[0];
		if (scheme === "chrome-extension:" || scheme === "moz-extension:") {
			return { key: scheme + host, name: first || "Extension" };
		}
		return { key: scheme + host, name: first || capitalize(host) };
	}

	let host = url.hostname.toLowerCase();
	if (!host) return null;
	if (isIp(host) || host === "localhost") return { key: url.host.toLowerCase(), name: url.host.toLowerCase() };

	host = host.replace(/^www\./, "").replace(/\.$/, "");
	const reg = registrable(host);
	const hit = known(host, reg.label, url.pathname);
	if (hit) return { key: "known:" + hit, name: hit };

	// the title spells the site (for a tenant: the tenant) the way its owner does
	const segments = titleSegments(tab.title);
	const candidates = segments.length ? [segments[segments.length - 1], segments[0]] : [];
	for (const c of candidates) {
		if (matchesLabel(c, reg.label)) return { key: reg.key, name: spell(c) };
	}
	return { key: reg.key, name: /^\p{L}{1,3}$/u.test(reg.label) ? reg.label.toUpperCase() : words(reg.label) };
}

interface Site {
	key: string;
	name: string;
	names: Map<string, number>;
	browser: boolean;
	count: number;
	accessed: number;
	first: number;
}

// the name most tabs of the site agreed on; ties go to the first seen
function pickName(names: Map<string, number>): string {
	let best = "";
	let bestCount = 0;
	for (const [name, count] of names) {
		if (count > bestCount) {
			best = name;
			bestCount = count;
		}
	}
	return best;
}

function rank(a: Site, b: Site): number {
	return Number(a.browser) - Number(b.browser) || b.count - a.count || b.accessed - a.accessed || a.first - b.first;
}

export function windowName(tabs: NameTab[]): string {
	const byKey = new Map<string, Site>();
	let total = 0;
	tabs.forEach((tab, i) => {
		const s = siteOf(tab);
		if (!s) return;
		total++;
		let site = byKey.get(s.key);
		if (!site) {
			site = { key: s.key, name: "", names: new Map(), browser: BROWSER_KEY.test(s.key), count: 0, accessed: 0, first: i };
			byKey.set(s.key, site);
		}
		site.count++;
		site.accessed = Math.max(site.accessed, tab.lastAccessed || 0);
		site.names.set(s.name, (site.names.get(s.name) || 0) + 1);
	});
	if (total === 0) return "";

	// sites that ended up with the same name are one entry
	const byName = new Map<string, Site>();
	for (const site of [...byKey.values()].sort(rank)) {
		site.name = pickName(site.names);
		const id = site.name.toLowerCase();
		const have = byName.get(id);
		if (have) {
			have.count += site.count;
				have.browser = have.browser && site.browser;
			have.accessed = Math.max(have.accessed, site.accessed);
			have.first = Math.min(have.first, site.first);
		} else {
			byName.set(id, site);
		}
	}
	// browser pages (new tab, extensions) come after every real site and do not count
	let sites = [...byName.values()].sort(rank);
	const real = sites.filter((s) => !s.browser);
	if (real.length) sites = real;

	if (sites[0].count >= 4 && sites[0].count >= total * 0.7) return sites[0].name;

	const names = sites.slice(0, 3).map((s) => s.name);
	let out = names.join(", ");
	if (sites.length > 3) out += " & " + (sites.length - 3) + " more";
	return out;
}

// changes when a tab is added, removed, moved or navigated; not on title changes
export function tabsKey(tabs: NameTab[]): string {
	return tabs.map((t) => t.pendingUrl || t.url || "").join("\n");
}
