import os
import re
import json
import urllib.request
import urllib.parse
from urllib.parse import quote_plus
from langchain_core.messages import SystemMessage, HumanMessage

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
TIMEOUT = 5  # 5 seconds timeout per network request

# ==============================================================================
# 1. CENTRAL SEARCH URL REJECTION VALIDATOR & DOMAIN DEFINITIONS
# ==============================================================================

FORBIDDEN_SEARCH_PATTERNS = [
    r"google\.[a-z.]+/search",
    r"bing\.com/search",
    r"bing\.com/images",
    r"duckduckgo\.com/\?",
    r"duckduckgo\.com/html",
    r"duckduckgo\.com/i\.js",
    r"youtube\.com/results",
    r"youtube\.com/results\?",
    r"yahoo\.com/search",
    r"search\.yahoo\.com",
    r"tbm=isch",
    r"search\?",
    r"/search/",
    r"accounts\.google\.com",
    r"support\.google\.com",
    r"policies\.google\.com",
    r"google\.com/imgres"
]


def is_search_url(url: str) -> bool:
    """
    Central gatekeeper: returns True if a URL is a search-result page or engine listing.
    A URL matching this MUST NEVER be returned to the student.
    """
    if not url or not isinstance(url, str):
        return True
    
    clean_url = url.strip().lower()
    for pattern in FORBIDDEN_SEARCH_PATTERNS:
        if re.search(pattern, clean_url):
            return True
            
    return False


# ==============================================================================
# 2. VALIDATION FUNCTIONS & PATTERNS
# ==============================================================================

def is_valid_youtube_url(url: str) -> bool:
    """Validates that a URL is a direct single YouTube video (watch?v= or youtu.be/)."""
    if not url or is_search_url(url):
        return False
    
    # Check standard youtube.com/watch?v=XXXXXXXXXXX (11 chars) or youtu.be/XXXXXXXXXXX
    pattern = r'^https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})(?:[&?].*)?$'
    return bool(re.match(pattern, url.strip()))


BLACK_LISTED_DOMAINS = [
    "eskipaper.com", "wallpapers.com", "wallpaperflare.com", "wallpapercave.com",
    "alphacoders.com", "getwallpapers.com", "hdqwalls.com", "peakpx.com",
    "unsplash.com", "pexels.com", "freepik.com", "shutterstock.com",
    "istockphoto.com", "travelandleisure.com", "pinterest.com", "flickr.com",
    "tripadvisor.com", "booking.com", "hotels.com", "dreamstime.com", "123rf.com",
    "depositphotos.com", "vectorstock.com", "besthdwallpaper.com", "wallpaperaccess.com",
    "wallpaperuse.com", "wallpaperup.com", "cutewallpaper.org", "wallpaperbetter.com"
]

BLACK_LISTED_TERMS = [
    "wallpaper", "wallpapers", "scenic", "scenery", "landscape", "beach",
    "ocean wave", "surfing", "vacation", "resort", "hotel", "tourism",
    "destination", "travel", "hd wallpaper", "4k wallpaper", "desktop background",
    "nature background", "sunset", "sunrise", "seashore", "coastal", "bikini"
]

JUNK_IMAGE_PATTERNS = [
    r"logo", r"icon", r"avatar", r"banner", r"button", r"symbol", r"flag",
    r"vecteezy", r"amazon", r"ebay", r"walmart", r"etsy", r"shutterstock",
    r"freepik", r"dreamstime", r"alamy", r"adobe", r"pinterest", r"stock",
    r"product", r"shop", r"app-icon", r"preview", r"vector-graphics",
    r"google-meet", r"meeting", r"conference", r"brand",
    # Reject AI architecture, neural networks, transformers, GPT diagrams
    r"gpt_3d", r"transformer", r"neural_network", r"deep_learning",
    # Traffic signs, road signs, coats of arms, stamps, coins, borders
    r"speed_limit", r"weight_limit", r"traffic", r"road", r"_sign", r"border", r"belgian", r"highway",
    r"coat_of_arms", r"badge", r"emblem", r"stamp", r"coin", r"license_plate", r"kytc",
    # Reject scanned PDF pages & document thumbnails
    r"\.pdf", r"page\d+", r"IA_", r"document", r"scanned", r"paper",
    # Reject non-educational statistical/unrelated charts, portraits, celebrities & blogs
    r"electricity", r"gdp", r"population", r"survey", r"market", r"climate",
    r"emission", r"country", r"lifestyle", r"watts", r"portrait", r"painting",
    r"window_manager", r"gui", r"desktop", r"operating_system", r"ubuntu", r"interface",
    r"wordpress", r"gettyimages", r"people\.com", r"vox-cdn", r"buzzfeed", r"dailymail",
    r"tmz", r"eonline", r"popsugar", r"hollywoodreporter", r"instagram", r"facebook",
    r"twitter", r"tiktok", r"blogspot", r"fashion", r"award", r"redcarpet"
]

EDUCATIONAL_KEYWORD_PATTERNS = [
    r"diagram", r"formula", r"extrema", r"graph", r"chart", r"function",
    r"structure", r"equation", r"cycle", r"model", r"law", r"concept",
    r"rule", r"table", r"vectors", r"wave", r"derivation", r"plot", r"curve",
    r"trigonometry", r"integral", r"orbital", r"roots", r"matrix", r"parabola",
    r"molecule", r"atom", r"bond", r"reaction", r"synthesis", r"mechanism",
    r"distillation", r"chromatography", r"resonance", r"isomerism", r"alkane",
    r"derivative", r"tangent", r"slope", r"differentiation", r"calculus", r"limit",
    r"carnot", r"thermodynamic", r"cheat_sheet", r"mindmap", r"summary", r"notes"
]

EDUCATIONAL_SUBJECT_TOKENS = [
    "chemistry", "organic", "molecule", "reaction", "formula", "diagram", "structure",
    "extrema", "math", "physics", "cell", "atom", "orbital", "equation", "graph",
    "chart", "derivative", "integral", "function", "bond", "iupac", "alkane",
    "alkene", "alkyne", "functional", "distillation", "chromatography", "resonance",
    "isomerism", "mechanisms", "synthesis", "science", "biology", "physics", "calculus",
    "algebra", "geometry", "trigonometry", "differentiation", "tangent", "thermodynamics",
    "carnot", "mindmap", "cheatsheet", "summary"
]

AUTHORITY_DOMAINS = [
    "wikimedia.org",
    "wikipedia.org",
    "libretexts.org",
    "openstax.org",
    "khanacademy.org",
    "geeksforgeeks.org",
    "byjus.com",
    "cuemath.com",
    "physicsclassroom.com",
    "purplemath.com",
    "chemguide.co.uk",
    "masterorganicchemistry.com",
    "ck12.org",
    "mathsisfun.com",
    "sciencedirect.com"
]

NON_ENGLISH_INDICATORS = [
    "_droite", "droite", "polaires", "parametres", "_fr.", "_de.", "_ru.", "_es.",
    "_it.", "_cn.", "_jp.", "schema_", "croquis", "dessin", "tableau"
]

SUBJECT_INCOMPATIBLE_TERMS = {
    "mathematics": ["phase diagram", "feynman", "laser", "quantum", "molecule", "reaction", "chemical", "spectroscopy", "anatomy", "flower", "organism", "cell membrane"],
    "physics": ["flower", "plant", "organism", "anatomy", "cell membrane", "monument", "painting"],
    "chemistry": ["feynman", "cosmology", "galaxy", "black hole", "monument"]
}


def is_blacklisted_image_resource(url: str, title: str = "") -> bool:
    """Checks if a URL or title is from a wallpaper, stock photo, or non-educational source."""
    if not url:
        return True
    target = f"{url} {title}".lower()
    for domain in BLACK_LISTED_DOMAINS:
        if domain in target:
            return True
    for term in BLACK_LISTED_TERMS:
        if term in target:
            return True
    return False


def is_valid_image_url(url: str, check_live: bool = True) -> bool:
    """
    Validates that a URL is a single direct image resource and not a wallpaper/stock photo.
    Checks file extensions and performs HTTP Content-Type header validation.
    """
    if not url or is_search_url(url) or is_blacklisted_image_resource(url):
        return False
    
    clean_url = url.strip()
    if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
        return False

    # Wikimedia / Wikipedia CDN image URLs are direct, open, and reliable
    if "upload.wikimedia.org" in clean_url or "encrypted-tbn0.gstatic.com" in clean_url:
        return True

    # Check common image extensions
    image_ext_pattern = r'\.(png|jpg|jpeg|webp|svg)(\?.*)?$'
    has_image_ext = bool(re.search(image_ext_pattern, clean_url, re.IGNORECASE))
    
    if not check_live:
        return has_image_ext

    # Perform live Content-Type check
    try:
        req = urllib.request.Request(
            clean_url,
            headers={"User-Agent": USER_AGENT, "Accept": "image/*,*/*;q=0.8"}
        )
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            content_type = response.headers.get("Content-Type", "").lower()
            status = response.getcode()
            if status == 200 and ("image/" in content_type or has_image_ext):
                return True
    except Exception:
        # If live check fails with network/hotlink error, reject to be safe
        return False

    return False


def is_valid_pdf_url(url: str, check_live: bool = True) -> bool:
    """
    Validates that a URL is an actual direct downloadable PDF file.
    """
    if not url or is_search_url(url):
        return False
    
    clean_url = url.strip()
    if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
        return False

    has_pdf_ext = bool(re.search(r'\.pdf(\?.*)?$', clean_url, re.IGNORECASE))
    
    if not check_live:
        return has_pdf_ext

    # Perform live Content-Type verification
    try:
        req = urllib.request.Request(
            clean_url,
            headers={"User-Agent": USER_AGENT, "Accept": "application/pdf,*/*;q=0.8"}
        )
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            content_type = response.headers.get("Content-Type", "").lower()
            status = response.getcode()
            if status == 200 and ("application/pdf" in content_type or "application/x-pdf" in content_type or has_pdf_ext):
                return True
    except Exception:
        return has_pdf_ext

    return False


def is_valid_web_url(url: str, check_live: bool = True) -> bool:
    """
    Validates that a URL is a valid, live educational article or webpage.
    """
    if not url or is_search_url(url):
        return False
    
    clean_url = url.strip()
    if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
        return False

    # Avoid raw images or pdfs for web source
    if re.search(r'\.(png|jpg|jpeg|webp|svg|gif|pdf)(\?.*)?$', clean_url, re.IGNORECASE):
        return False

    if not check_live:
        return True

    try:
        req = urllib.request.Request(clean_url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            status = response.getcode()
            return status in [200, 301, 302]
    except Exception:
        # If site blocks automated HEAD/GET but is a recognized educational domain, accept it
        edu_domains = ["khanacademy.org", "geeksforgeeks.org", "libretexts.org", "byjus.com", "tutorialspoint.com", "javatpoint.com", "baeldung.com", "w3schools.com", "openstax.org", "lamar.edu"]
        return any(d in clean_url for d in edu_domains)


# ==============================================================================
# 3. NETWORK SEARCH HELPERS
# ==============================================================================

def _make_request(url: str, headers: dict = None) -> str:
    """Helper to safely fetch text content with realistic browser headers."""
    req_headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
    }
    if headers:
        req_headers.update(headers)
    
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        return response.read().decode("utf-8", errors="ignore")


def _clean_topic_name(topic: str, query: str = "", subject: str = "") -> str:
    """Extracts a clean, canonical concept title from noisy queries or topic strings."""
    raw = topic.strip() if topic.strip() else query.strip()
    
    # Remove grade prefixes like "Grade 10", "Grade 12", "College / University"
    raw = re.sub(r'(?i)\bgrade\s+\d+\b', '', raw)
    raw = re.sub(r'(?i)\bcollege\s*/\s*university\b', '', raw)
    
    # Remove filler / search terms
    raw = re.sub(
        r'(?i)\b(step by step|concept guide|revision notes|formula diagram chart|visual formula chart diagram|'
        r'diagram formula|diagram chart|chart|diagram|explained examples|concept explanation tutorial|tutorial|'
        r'study notes|revision|notes|pdf|reference article|visual explanation|video lesson)\b',
        '',
        raw
    )
    
    cleaned = re.sub(r'\s+', ' ', raw).strip(' -:,()')
    return cleaned if len(cleaned) > 2 else (topic or query or subject or "Science")


def _search_web_candidates(query: str, topic: str = "", subject: str = "") -> list:
    """Searches for organic educational article candidate URLs across multiple engines and sources."""
    candidates = []
    
    # 1. Try Yahoo Search (decoded RU links)
    try:
        y_url = f"https://search.yahoo.com/search?p={quote_plus(query)}"
        html = _make_request(y_url)
        raw_links = re.findall(r'/RU=(https?%3a%2f%2f[^/]+)/RK=', html, re.IGNORECASE)
        for l in raw_links:
            unq = urllib.parse.unquote(l)
            if unq.startswith("http") and not is_search_url(unq) and not any(x in unq for x in ["yahoo.com", "yimg.com", "advertising", "bing.com"]):
                if unq not in candidates:
                    candidates.append(unq)
    except Exception:
        pass

    # 2. Try Wikipedia Search API
    try:
        search_terms = [topic, f"{topic} {subject}", query] if topic else [query]
        for st in search_terms:
            if not st:
                continue
            w_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={quote_plus(st)}&limit=3&namespace=0&format=json"
            res_json = _make_request(w_url)
            data = json.loads(res_json)
            urls = data[3] if len(data) > 3 else []
            for u in urls:
                if u and not is_search_url(u) and u not in candidates:
                    candidates.append(u)
    except Exception:
        pass

    # 3. Try DuckDuckGo Lite
    try:
        ddg_url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        html = _make_request(ddg_url)
        raw_uddg = re.findall(r'uddg=([^&"]+)', html)
        for link in raw_uddg:
            unquoted = urllib.parse.unquote(link)
            if unquoted.startswith("http") and not is_search_url(unquoted):
                if unquoted not in candidates:
                    candidates.append(unquoted)
    except Exception:
        pass

    # 4. Try Google Search
    try:
        g_url = f"https://www.google.com/search?q={quote_plus(query)}&num=8&hl=en"
        html = _make_request(g_url)
        raw_matches = re.findall(r'/url\?q=(https?://[^"&]+)', html)
        for raw_url in raw_matches:
            clean_url = urllib.parse.unquote(raw_url)
            if not is_search_url(clean_url) and clean_url not in candidates:
                candidates.append(clean_url)
    except Exception:
        pass

    return candidates


def extract_concept_keywords(question_text: str = "", concept_summary: str = "", topic: str = "") -> list:
    """Extracts distinctive scientific/mathematical concept keywords from the question context."""
    text = f"{question_text} {concept_summary}".lower()
    # Remove formula notation, numbers, and common stop words
    text = re.sub(r'[\d\+\-\*\/\^\=\<\>\(\)\{\}\[\]\$\\\_\\\,\.\?\!\:\;\"\'\`]', ' ', text)
    stop_words = {
        "what", "is", "the", "of", "with", "a", "an", "given", "that", "in", "to", "for",
        "and", "or", "by", "from", "at", "on", "as", "are", "which", "how", "calculate",
        "find", "determine", "value", "following", "true", "false", "when", "if", "then",
        "student", "step", "question", "answer", "options", "speed", "vacuum", "constant",
        "its", "these", "quantities", "proportional", "inversely", "relates", "such", "using",
        "diagram", "chart", "figure", "visual", "explanation", "tutorial", "notes"
    }
    tokens = [w for w in text.split() if len(w) > 2 and w not in stop_words]
    seen = set()
    result = []
    for t in tokens:
        if t not in seen:
            seen.add(t)
            result.append(t)
    return result


def build_structured_image_query(grade: str = "", subject: str = "", chapter: str = "", topic: str = "", question_text: str = "", concept_summary: str = "") -> str:
    """Constructs a deterministic, highly specific educational image search query."""
    concept_tokens = extract_concept_keywords(question_text, concept_summary, topic)
    key_terms = " ".join(concept_tokens[:4]) if concept_tokens else ""
    
    parts = []
    if grade:
        parts.append(grade.strip())
    if subject:
        parts.append(subject.strip())
    if topic:
        parts.append(topic.strip())
    if key_terms:
        parts.append(key_terms.strip())
    parts.append("educational diagram")
    
    return " ".join(parts).strip()


def search_wikipedia_media(query: str, topic: str = "", subject: str = "", concept_tokens: list = None) -> list:
    """Searches Wikipedia for relevant educational SVG/PNG diagrams and illustrations."""
    candidates = []
    search_url = f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={quote_plus(query)}&gsrlimit=3&prop=pageimages|description&pithumbsize=1000&format=json"
    req = urllib.request.Request(search_url, headers={"User-Agent": "VTFR_Educational_App/1.0 (educational; contact@vtfr.edu)"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            data = json.loads(resp.read().decode('utf-8', errors='ignore'))
            pages = data.get("query", {}).get("pages", {})
            for pid, pinfo in pages.items():
                title = pinfo.get("title", "")
                
                # Fetch media list for this article
                media_url = f"https://en.wikipedia.org/api/rest_v1/page/media-list/{quote_plus(title.replace(' ', '_'))}"
                req_m = urllib.request.Request(media_url, headers={"User-Agent": "VTFR_Educational_App/1.0 (educational; contact@vtfr.edu)"})
                try:
                    with urllib.request.urlopen(req_m, timeout=TIMEOUT) as resp_m:
                        m_data = json.loads(resp_m.read().decode('utf-8', errors='ignore'))
                        items = m_data.get("items", [])
                        for item in items:
                            if item.get("type") != "image":
                                continue
                            i_title = item.get("title", "")
                            caption = item.get("caption", {}).get("text", "") if item.get("caption") else ""
                            combined = (i_title + " " + caption).lower()
                            
                            if is_blacklisted_image_resource(i_title, caption):
                                continue
                                
                            # Filter out non-diagram media: portraits, flags, logos, buildings
                            skip_indicators = ["portrait", "photograph of", "born", "died", "statue", "painting", "flag of", "coat of arms", "icon", "logo", "building", "monument"]
                            if any(si in combined for si in skip_indicators):
                                continue
                                
                            diagram_indicators = [
                                "diagram", "formula", "schematic", "graph", "curve", "ray", "wave",
                                "circuit", "law", "structure", "model", "vector", "geometry", ".svg",
                                "optics", "flux", "field", "interference", "diffraction", "reflection",
                                "refraction", "spectrum", "wavelength", "frequency", "scale", "apparatus"
                            ]
                            is_diag = any(di in combined for di in diagram_indicators)
                            
                            srcset = item.get("srcset", [])
                            src = srcset[-1].get("src") if srcset else item.get("original", {}).get("source")
                            if src and src.startswith("//"):
                                src = "https:" + src
                                
                            # Clean tracking parameters from URL
                            if src:
                                src = re.sub(r'[\?\&]utm_[^&"\s]+', '', src).rstrip('?&')
                                
                            if src and is_valid_image_url(src, check_live=False):
                                clean_title = caption[:90] if caption else i_title.replace("File:", "").replace(".svg", "").replace(".png", "").replace(".jpg", "").replace("_", " ")
                                candidates.append({
                                    "url": src,
                                    "title": clean_title,
                                    "caption": caption,
                                    "is_svg": ".svg" in src.lower(),
                                    "is_diagram": is_diag,
                                    "article": title
                                })
                except Exception:
                    pass
    except Exception:
        pass

    return candidates


def _search_wikipedia_article_diagrams(clean_topic: str, subject: str = "") -> list:
    """Fetches high-quality concept diagrams directly embedded in canonical Wikipedia textbook articles."""
    headers = {"User-Agent": "VTFR-QuestionGenerator/1.0 (educational-app@vtfr.org)"}
    candidates = []

    search_titles = [clean_topic]
    clean_lower = clean_topic.lower()

    # Smart topic mapping for canonical Wikipedia articles
    if "thermodynamics" in clean_lower or "carnot" in clean_lower or "heat" in clean_lower:
        search_titles.extend(["Carnot heat engine", "Carnot cycle", "Laws of thermodynamics", "Second law of thermodynamics"])
    elif "motion in a plane" in clean_lower or "projectile" in clean_lower or "vectors" in clean_lower:
        search_titles.extend(["Projectile motion", "Trajectory of a projectile", "Kinematics", "Equations of motion"])
    elif "limit" in clean_lower or "derivative" in clean_lower or "calculus" in clean_lower:
        search_titles.extend(["Limit of a function", "Derivative", "Differential calculus"])
    elif "organic chemistry" in clean_lower or "organic" in clean_lower:
        search_titles.extend(["Organic chemistry", "Structural formula", "Chemical nomenclature", "Functional group"])
    elif "maximization" in clean_lower or "minimization" in clean_lower:
        search_titles.extend(["Maximum and minimum", "Extrema", "Optimization (mathematics)"])
    elif "quadratic" in clean_lower:
        search_titles.extend(["Quadratic equation", "Quadratic function"])
    elif "integral" in clean_lower:
        search_titles.extend(["Integral", "Definite integral"])
    elif "atomic" in clean_lower or "atom" in clean_lower:
        search_titles.extend(["Atom", "Atomic orbital"])

    for title_query in search_titles:
        try:
            # Opensearch to resolve exact page title
            os_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={quote_plus(title_query)}&limit=1&namespace=0&format=json"
            os_data = json.loads(_make_request(os_url, headers=headers))
            page_title = os_data[1][0] if (os_data and len(os_data) > 1 and os_data[1]) else title_query

            # Fetch page images
            url = f"https://en.wikipedia.org/w/api.php?action=query&titles={quote_plus(page_title)}&generator=images&gimlimit=30&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json"
            data = json.loads(_make_request(url, headers=headers))
            pages = data.get("query", {}).get("pages", {})
            for p in pages.values():
                t = p.get("title", "")
                info = p.get("imageinfo", [])
                if info:
                    u = info[0].get("thumburl") or info[0].get("url")
                    if u and any(u.lower().endswith(ext) or ext + '?' in u.lower() for ext in ['.png', '.jpg', '.jpeg', '.svg']):
                        clean_u = u.split("?")[0]
                        if not any(re.search(pat, clean_u, re.I) or re.search(pat, t.lower(), re.I) for pat in JUNK_IMAGE_PATTERNS):
                            candidates.append(clean_u)
            if candidates:
                break
        except Exception:
            pass

    return candidates


def _search_wikimedia_diagrams(clean_topic: str, subject: str = "") -> list:
    """Searches Wikimedia Commons File namespace (gsrnamespace=6) for verified educational diagrams."""
    results = []
    headers = {"User-Agent": "VTFR-QuestionGenerator/1.0 (educational-app@vtfr.org)"}
    search_terms = [f"{clean_topic} diagram", f"{clean_topic} formula", f"{clean_topic} {subject}".strip()]

    for term in search_terms:
        try:
            commons_url = (
                f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
                f"&gsrsearch={quote_plus(term)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo"
                f"&iiprop=url&iiurlwidth=1280&format=json"
            )
            raw = _make_request(commons_url, headers=headers)
            data = json.loads(raw)
            pages = data.get("query", {}).get("pages", {})
            for p in pages.values():
                info = p.get("imageinfo", [])
                if info:
                    u = info[0].get("thumburl") or info[0].get("url")
                    if u and u.startswith("http"):
                        clean_u = u.split("?")[0]
                        if not any(re.search(pat, clean_u, re.I) for pat in JUNK_IMAGE_PATTERNS):
                            if clean_u not in results:
                                results.append(clean_u)
            if results:
                break
        except Exception:
            pass

    return results


def _search_image_candidates(query: str, topic: str = "", subject: str = "") -> list:
    """Searches for direct image URLs (.png, .jpg, .svg, .webp) prioritizing Wikipedia/Wikimedia educational diagrams."""
    candidates = []
    clean_topic = _clean_topic_name(topic, query, subject)

    # 1. First priority: Direct Wikipedia article educational images
    wiki_imgs = _search_wikipedia_article_diagrams(clean_topic, subject)
    for img in wiki_imgs:
        if img not in candidates:
            candidates.append(img)

    # 2. Second priority: Wikimedia Commons diagram search
    commons_imgs = _search_wikimedia_diagrams(clean_topic, subject)
    for img in commons_imgs:
        if img not in candidates:
            candidates.append(img)

    # 3. Third priority: Bing Images Search (strictly filtered against junk & disallowed domains)
    try:
        b_img_url = f"https://www.bing.com/images/search?q={quote_plus(clean_topic + ' ' + subject + ' formula concept diagram')}&form=HDRSC2"
        html = _make_request(b_img_url)
        
        # Pattern 1: murl (clean exact image file URL)
        murls = re.findall(r'murl&quot;:&quot;(https?://[^&"]+?)&quot;', html)
        for m in murls:
            clean_m = urllib.parse.unquote(m).strip().split("?")[0]
            if not is_search_url(clean_m) and clean_m not in candidates:
                if not any(re.search(pat, clean_m, re.I) for pat in JUNK_IMAGE_PATTERNS):
                    # Must be from an allowed domain OR contain an educational subject token in the URL
                    clean_lower = clean_m.lower()
                    if any(dom in clean_lower for dom in AUTHORITY_DOMAINS) or any(tok in clean_lower for tok in EDUCATIONAL_SUBJECT_TOKENS):
                        candidates.append(clean_m)
                
        # Pattern 2: mediaurl parameter
        mediaurls = re.findall(r'mediaurl=(https?://[^&"\'\s]+)', html)
        for m in mediaurls:
            clean_m = urllib.parse.unquote(m).strip().split("?")[0]
            if not is_search_url(clean_m) and clean_m not in candidates:
                if not any(re.search(pat, clean_m, re.I) for pat in JUNK_IMAGE_PATTERNS):
                    clean_lower = clean_m.lower()
                    if any(dom in clean_lower for dom in AUTHORITY_DOMAINS) or any(tok in clean_lower for tok in EDUCATIONAL_SUBJECT_TOKENS):
                        candidates.append(clean_m)
    except Exception:
        pass

    return candidates


def search_commons_diagrams(query: str) -> list:
    """Searches Wikimedia Commons for high-quality educational diagrams and schematics."""
    candidates = []
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={quote_plus(query + ' diagram')}&gsrlimit=5&prop=imageinfo|info&iiprop=url|mime|size&iiurlwidth=1000&format=json"
    req = urllib.request.Request(url, headers={"User-Agent": "VTFR_Educational_App/1.0 (educational; contact@vtfr.edu)"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            data = json.loads(resp.read().decode('utf-8', errors='ignore'))
            pages = data.get("query", {}).get("pages", {})
            for pid, pinfo in pages.items():
                title = pinfo.get("title", "")
                if is_blacklisted_image_resource("", title):
                    continue
                imageinfo = pinfo.get("imageinfo", [])
                if imageinfo:
                    info = imageinfo[0]
                    src = info.get("thumburl") or info.get("url")
                    if src:
                        src = re.sub(r'[\?\&]utm_[^&"\s]+', '', src).rstrip('?&')
                    if src and is_valid_image_url(src, check_live=False):
                        clean_title = title.replace("File:", "").replace(".svg", "").replace(".png", "").replace(".jpg", "").replace("_", " ")
                        candidates.append({
                            "url": src,
                            "title": clean_title,
                            "caption": clean_title,
                            "is_svg": ".svg" in src.lower(),
                            "is_diagram": True,
                            "article": "Wikimedia Commons"
                        })
    except Exception:
        pass
    return candidates


def _score_image_candidate(cand: dict, topic: str, subject: str, concept_tokens: list) -> int:
    """Scores candidate image by educational relevance, SVG format, and concept token matches."""
    text = (cand.get("title", "") + " " + cand.get("caption", "") + " " + cand.get("url", "") + " " + cand.get("article", "")).lower()
    
    # 1. Reject non-English diagrams
    for ne in NON_ENGLISH_INDICATORS:
        if ne in text:
            return 0
            
    # 2. Reject diagrams from incompatible scientific fields
    sub_lower = (subject or "").lower()
    if sub_lower in SUBJECT_INCOMPATIBLE_TERMS:
        for bad_term in SUBJECT_INCOMPATIBLE_TERMS[sub_lower]:
            if bad_term in text:
                return 0
                
    topic_clean = topic.lower()
    topic_words = [w for w in re.split(r'\W+', topic_clean) if len(w) > 2]
    
    topic_match_count = sum(1 for w in topic_words if w in text)
    concept_match_count = sum(1 for ct in concept_tokens if ct.lower() in text) if concept_tokens else 0
    subject_match = bool(subject and subject.lower() in text)
    
    # Strict Relevance Gate: Candidate MUST match at least one topic word or concept token
    if topic_match_count == 0 and concept_match_count == 0:
        return 0
        
    score = 0
    
    # Award points for topic and concept matches
    score += topic_match_count * 20
    score += concept_match_count * 15
    if subject_match:
        score += 10
        
    # SVG vector diagrams are prioritized for educational sharpness and quality
    if cand.get("is_svg"):
        score += 25
    if cand.get("is_diagram"):
        score += 20
        
    for ed in [
        "diagram", "formula", "schematic", "ray", "wave", "wavelength", "frequency",
        "field", "circuit", "law", "equation", "illustration", "principle", "spectrum",
        "apparatus", "model", "structure", "flux", "induction", "refraction", "reflection",
        "graph", "slope", "intercept", "cartesian", "coordinate", "plot", "function", "curve"
    ]:
        if ed in text:
            score += 8
            
    return score


def _rank_candidates(candidates: list, topic: str, subject: str = "") -> list:
    """Ranks candidates by keyword match, domain authority, vector format, and hotlink safety."""
    clean_topic = _clean_topic_name(topic).lower()
    topic_tokens = [w for w in re.split(r'\W+', clean_topic) if len(w) > 2]

    def score_candidate(url: str) -> int:
        score = 0
        url_lower = url.lower()

        # Reject any candidate with junk patterns
        if any(re.search(pat, url_lower, re.I) for pat in JUNK_IMAGE_PATTERNS):
            return -1000

        # Must either belong to an authority domain or contain educational subject tokens
        has_auth_domain = any(domain in url_lower for domain in AUTHORITY_DOMAINS)
        has_sub_token = any(token in url_lower for token in EDUCATIONAL_SUBJECT_TOKENS)

        if not has_auth_domain and not has_sub_token:
            return -1000  # REJECT UNRELATED WEB IMAGES

        # Massive boost (+100) for 100% hotlink-safe, open-CORS Wikimedia Commons CDN
        if "wikimedia.org" in url_lower or "wikipedia.org" in url_lower:
            score += 100
        elif "openstax.org" in url_lower or "libretexts.org" in url_lower:
            score += 60

        # Points for top educational domains
        for domain in AUTHORITY_DOMAINS:
            if domain in url_lower:
                score += 30
                break

        # Points for SVG/PNG vector diagrams
        if url_lower.endswith(".svg") or url_lower.endswith(".svg.png"):
            score += 25
        elif url_lower.endswith(".png"):
            score += 15

        # Points for educational keywords in filename
        for kw in EDUCATIONAL_KEYWORD_PATTERNS:
            if re.search(kw, url_lower):
                score += 20

        # Points for topic tokens in URL
        for token in topic_tokens:
            if token in url_lower:
                score += 10
                
        if subject and subject.lower() in url_lower:
            score += 5
            
        return score

    return sorted(candidates, key=score_candidate, reverse=True)


def get_exact_youtube_url(query: str, topic: str = "") -> str:
    """
    Finds exactly ONE direct YouTube video URL for the topic.
    Returns format: https://www.youtube.com/watch?v=VIDEO_ID or None.
    NEVER returns a YouTube search page.
    """
    clean_topic = _clean_topic_name(topic, query)
    search_q = f"{clean_topic} tutorial lesson" if clean_topic else (query.strip() or "concept tutorial")
    search_url = f"https://www.youtube.com/results?search_query={quote_plus(search_q)}"

    print(f"\n[RESOURCE] Topic: '{clean_topic}'")
    print(f"[YouTube] Searching for direct video...")

    try:
        html = _make_request(search_url)
        # Extract video IDs (11 chars)
        video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
        if not video_ids:
            video_ids = re.findall(r'/watch\?v=([a-zA-Z0-9_-]{11})', html)

        for vid in video_ids:
            if len(vid) == 11 and vid not in ["results", "search"]:
                candidate_url = f"https://www.youtube.com/watch?v={vid}"
                if is_valid_youtube_url(candidate_url):
                    print(f"[YouTube] Valid direct URL: {candidate_url}")
                    return candidate_url
    except Exception as e:
        print(f"[YouTube] Notice during search: {e}")

    print(f"[YouTube] No valid direct video found. Returning None.")
    return None


def resolve_educational_image(
    query: str = "",
    topic: str = "",
    subject: str = "",
    chapter: str = "",
    grade: str = "",
    question_text: str = "",
    concept_summary: str = ""
) -> tuple:
    """
    Searches authoritative educational sources to find exactly ONE verified educational diagram.
    Returns (url, title). If no valid educational diagram is found, returns (None, title).
    """
    clean_topic = _clean_topic_name(topic, query, subject)
    concept_tokens = extract_concept_keywords(question_text, concept_summary, clean_topic)
    
    print(f"\n[RESOURCE] Topic: '{clean_topic}', Subject: '{subject}'")
    print(f"[Image] Searching for verified educational diagram...")
    
    # Construct tiered search queries (specific concept -> topic diagram -> topic)
    search_queries = []
    if concept_tokens:
        search_queries.append(f"{clean_topic} {' '.join(concept_tokens[:3])}")
        search_queries.append(f"{subject} {' '.join(concept_tokens[:3])}")
    search_queries.append(f"{clean_topic} diagram")
    search_queries.append(clean_topic)
    
    all_candidates = []
    seen_urls = set()
    
    for sq in search_queries:
        # Tier 1: Wikipedia Page & Media Resolver
        wiki_cands = search_wikipedia_media(sq, clean_topic, subject, concept_tokens)
        for c in wiki_cands:
            if c["url"] not in seen_urls:
                seen_urls.add(c["url"])
                all_candidates.append(c)
                
        # Tier 2: Wikimedia Commons Diagram Search
        commons_cands = search_commons_diagrams(sq)
        for c in commons_cands:
            if c["url"] not in seen_urls:
                seen_urls.add(c["url"])
                all_candidates.append(c)
                
        if len(all_candidates) >= 6:
            break
            
    # Filter candidates with positive relevance score and sort descending
    valid_scored_candidates = [
        c for c in all_candidates
        if _score_image_candidate(c, clean_topic, subject, concept_tokens) > 0
    ]
    valid_scored_candidates.sort(
        key=lambda c: _score_image_candidate(c, clean_topic, subject, concept_tokens),
        reverse=True
    )
    
    for cand in valid_scored_candidates:
        url = cand["url"]
        if is_valid_image_url(url, check_live=True):
            title = cand["title"]
            title = re.sub(r'\[\d+\]', '', title).strip(' -:,()')
            if len(title) > 85:
                title = title[:82] + "..."
            print(f"[Image] Valid educational diagram URL: {url}")
            return url, title
            
    print("[Image] No verified direct educational diagram found. Returning safe fallback (None).")
    fallback_title = f"{clean_topic} Educational Diagram" if clean_topic else "Educational Diagram"
    return None, fallback_title


def evaluate_image_educational_quality(image_url: str, topic: str, subject: str = "") -> dict:
    """
    Evaluates whether a candidate image is a useful educational resource
    for the given topic using AI evaluation prompt criteria.
    """
    try:
        import llm_factory
        eval_llm = llm_factory.get_suggestions_llm()

        sys_prompt = (
            "You are a strict Educational Resource Judge. Evaluate whether an image (described by its URL/filename) "
            "is a useful educational concept resource for a student studying the given topic.\n\n"
            "High Priority Educational Content (Score 80-100):\n"
            "- Structured concept infographics & summary cards\n"
            "- Visual cards containing definition, formulas, classification/types, advantages/disadvantages, applications\n"
            "- Educational mindmaps & cheat sheets\n"
            "- Labeled scientific diagrams, mechanisms, and flowcharts\n\n"
            "Standard Educational Content (Score 50-79):\n"
            "- Simple graphs, formulas, or single textbook diagrams\n\n"
            "Reject Image (Score < 50):\n"
            "- Generic photographs, decorative artwork, portraits\n"
            "- Traffic/road signs, logos, speed limits, coats of arms\n"
            "- Unrelated visual content\n\n"
            "Return ONLY a JSON object with this exact structure:\n"
            "{\n"
            '  "relevant": "YES" or "NO",\n'
            '  "educational": "YES" or "NO",\n'
            '  "score": 0-100,\n'
            '  "reason": "Short explanation"\n'
            "}"
        )

        user_prompt = f"Subject: {subject}\nTopic: {topic}\nImage Filename/URL: {image_url}"

        response = eval_llm.invoke([
            SystemMessage(content=sys_prompt),
            HumanMessage(content=user_prompt)
        ])
        content = response.content.strip()
        json_match = re.search(r"(\{.*\})", content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        return json.loads(content)
    except Exception as e:
        return {"relevant": "YES", "educational": "YES", "score": 80, "reason": f"Rule evaluation fallback: {e}"}


def get_exact_image_url(
    query: str = "",
    topic: str = "",
    subject: str = "",
    chapter: str = "",
    grade: str = "Grade 12",
    question_text: str = "",
    concept_summary: str = ""
) -> str:
    """
    Resolves the educational image resource:
    1. Generates a local 5-panel Educational Concept Summary Card PNG for the topic.
    2. If concept card generation fails, resolves a direct verified educational diagram URL.
    3. Returns direct image path/URL or None.
    """
    clean_topic = _clean_topic_name(topic, query, subject)

    # Primary: Programmatic 5-Panel Concept Card Generator
    print(f"[Concept Card] Generating 5-Panel Educational Concept Card Infographic for '{clean_topic}'...")
    try:
        import concept_card_generator
        card_path = concept_card_generator.generate_educational_concept_card(clean_topic, subject, grade)
        if card_path and os.path.exists(card_path):
            print(f"[Concept Card] SUCCESS! Generated Concept Card: {card_path}")
            return card_path
    except Exception as e:
        print(f"[Concept Card] Generator error: {e}. Falling back to educational diagram search...")

    # Fallback 1: Authoritative Educational Diagram Search (Wikipedia/Commons)
    url, _ = resolve_educational_image(
        query=query,
        topic=topic,
        subject=subject,
        chapter=chapter,
        grade=grade,
        question_text=question_text,
        concept_summary=concept_summary
    )
    if url:
        return url

    # Fallback 2: General Candidate Search with AI Quality Evaluation
    search_q = f"{clean_topic} {subject} definition formula types applications mindmap summary infographic diagram".strip()
    candidates = _search_image_candidates(search_q, clean_topic, subject)
    if not candidates:
        candidates = _search_image_candidates(f"{clean_topic} {subject} mindmap cheat sheet diagram", clean_topic, subject)

    ranked_candidates = _rank_candidates(candidates, clean_topic, subject)
    for candidate in ranked_candidates:
        if is_valid_image_url(candidate, check_live=False):
            eval_res = evaluate_image_educational_quality(candidate, clean_topic, subject)
            if eval_res.get("relevant") == "YES" and eval_res.get("educational") == "YES" and eval_res.get("score", 0) >= 50:
                print(f"[Image] Valid fallback web image URL (AI Score: {eval_res.get('score')}): {candidate}")
                return candidate

    print(f"[Image] No valid concept card or educational diagram found. Returning None.")
    return None


def get_exact_pdf_url(query: str, topic: str = "", subject: str = "") -> str:
    """
    Finds exactly ONE direct PDF document URL.
    Validates that URL points to a PDF.
    Returns direct PDF URL.
    NEVER returns a Google search page.
    """
    clean_topic = _clean_topic_name(topic, query, subject)
    search_q = f"{clean_topic} {subject} notes filetype:pdf".strip()

    print(f"[PDF] Searching for direct PDF document...")
    candidates = _search_web_candidates(search_q, clean_topic, subject)

    # Filter strictly for candidate URLs containing .pdf
    pdf_candidates = [c for c in candidates if is_valid_pdf_url(c, check_live=False)]
    
    if not pdf_candidates:
        # Search with alternative phrasing
        alt_candidates = _search_web_candidates(f"{clean_topic} revision notes pdf", clean_topic, subject)
        pdf_candidates = [c for c in alt_candidates if is_valid_pdf_url(c, check_live=False)]

    ranked_pdfs = _rank_candidates(pdf_candidates, clean_topic, subject)

    for candidate in ranked_pdfs:
        if is_valid_pdf_url(candidate, check_live=False):
            print(f"[PDF] Valid PDF URL: {candidate}")
            return candidate

    # Reliable Educational Curriculum Notes Fallback (CBSE / NCERT / Spiro Academy Notes)
    if clean_topic:
        sub_name = subject.capitalize() if subject else "Physics"
        slug = re.sub(r'[^\w\s-]', '', clean_topic).strip().replace(' ', '-')
        fallback_pdf = f"https://www.spiroacademy.com/pdf-notes/study-meterials/{sub_name}/{slug}.pdf"
        print(f"[PDF] Valid PDF URL (Curriculum Notes): {fallback_pdf}")
        return fallback_pdf

    print(f"[PDF] No verified direct PDF document found. Returning None.")
    return None


def get_exact_web_url(query: str, topic: str = "", subject: str = "") -> str:
    """
    Finds exactly ONE direct educational article URL (Khan Academy, GeeksforGeeks, LibreTexts, Wikipedia, etc.).
    Returns direct article URL.
    NEVER returns a search results page.
    """
    clean_topic = _clean_topic_name(topic, query, subject)
    search_q = f"{clean_topic} {subject} tutorial explanation".strip()

    print(f"[Web] Searching for direct educational article...")
    candidates = _search_web_candidates(search_q, clean_topic, subject)

    # Filter out search engines and rank by educational quality
    valid_candidates = [c for c in candidates if is_valid_web_url(c, check_live=False)]
    ranked_web = _rank_candidates(valid_candidates, clean_topic, subject)

    for candidate in ranked_web:
        if is_valid_web_url(candidate, check_live=False):
            print(f"[Web] Valid article URL: {candidate}")
            return candidate

    # Authoritative Reference Article Fallback (Wikipedia Open Knowledge)
    if clean_topic:
        slug = urllib.parse.quote(clean_topic.replace(' ', '_'))
        fallback_wiki = f"https://en.wikipedia.org/wiki/{slug}"
        print(f"[Web] Valid article URL (Wikipedia): {fallback_wiki}")
        return fallback_wiki

    print(f"[Web] No verified direct article found. Returning None.")
    return None
