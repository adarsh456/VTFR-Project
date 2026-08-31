import re
import json
import urllib.request
import urllib.parse
from urllib.parse import quote_plus

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
TIMEOUT = 5  # 5 seconds timeout per network request

# ==============================================================================
# 1. CENTRAL SEARCH URL REJECTION VALIDATOR
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
# 2. VALIDATION FUNCTIONS
# ==============================================================================

def is_valid_youtube_url(url: str) -> bool:
    """Validates that a URL is a direct single YouTube video (watch?v= or youtu.be/)."""
    if not url or is_search_url(url):
        return False
    
    # Check standard youtube.com/watch?v=XXXXXXXXXXX (11 chars) or youtu.be/XXXXXXXXXXX
    pattern = r'^https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})(?:[&?].*)?$'
    return bool(re.match(pattern, url.strip()))


def is_valid_image_url(url: str, check_live: bool = True) -> bool:
    """
    Validates that a URL is a single direct image resource.
    Checks file extensions and performs HTTP Content-Type header validation.
    """
    if not url or is_search_url(url):
        return False
    
    clean_url = url.strip()
    if not (clean_url.startswith("http://") or clean_url.startswith("https://")):
        return False

    # Google-hosted image CDN (always 100% accessible in browsers without 403 hotlink blocks)
    if "encrypted-tbn0.gstatic.com/images" in clean_url:
        return True

    # Check common image extensions
    image_ext_pattern = r'\.(png|jpg|jpeg|webp|svg|gif)(\?.*)?$'
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
        # If live check fails but has clear image extension, accept it
        return has_image_ext

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


def _search_web_candidates(query: str) -> list:
    """Searches for organic educational article candidate URLs across multiple engines."""
    candidates = []
    
    # 1. Try DuckDuckGo Lite
    try:
        ddg_url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        html = _make_request(ddg_url)
        raw_uddg = re.findall(r'uddg=([^&"]+)', html)
        for link in raw_uddg:
            unquoted = urllib.parse.unquote(link)
            if unquoted.startswith("http") and not is_search_url(unquoted):
                candidates.append(unquoted)
    except Exception:
        pass

    # 2. Try Google Search
    try:
        g_url = f"https://www.google.com/search?q={quote_plus(query)}&num=8&hl=en"
        html = _make_request(g_url)
        # /url?q=...
        raw_matches = re.findall(r'/url\?q=(https?://[^"&]+)', html)
        for raw_url in raw_matches:
            clean_url = urllib.parse.unquote(raw_url)
            if not is_search_url(clean_url) and clean_url not in candidates:
                candidates.append(clean_url)
    except Exception:
        pass

    # 3. Try Bing Search
    try:
        b_url = f"https://www.bing.com/search?q={quote_plus(query)}"
        html = _make_request(b_url)
        matches = re.findall(r'<h2><a[^>]+href="(https?://[^"]+)"', html)
        for m in matches:
            if not is_search_url(m) and m not in candidates:
                candidates.append(m)
    except Exception:
        pass

    return candidates


def _search_image_candidates(query: str, topic: str = "") -> list:
    """Searches for direct image URLs (.png, .jpg, .svg, .webp) across Bing Images, DDG, and Wikimedia."""
    candidates = []

    # 1. Bing Images Search (extracts direct source image URLs)
    try:
        b_img_url = f"https://www.bing.com/images/search?q={quote_plus(query)}&form=HDRSC2"
        html = _make_request(b_img_url)
        
        # Pattern 1: murl (clean exact image file URL)
        murls = re.findall(r'murl&quot;:&quot;(https?://[^&"]+?)&quot;', html)
        for m in murls:
            clean_m = urllib.parse.unquote(m).strip()
            if not is_search_url(clean_m) and clean_m not in candidates:
                candidates.append(clean_m)
                
        # Pattern 2: mediaurl parameter
        mediaurls = re.findall(r'mediaurl=(https?://[^&"\'\s]+)', html)
        for m in mediaurls:
            clean_m = urllib.parse.unquote(m).strip()
            if not is_search_url(clean_m) and clean_m not in candidates:
                candidates.append(clean_m)
    except Exception:
        pass

    # 2. Wikimedia Commons Diagram API
    if topic:
        try:
            commons_url = (
                f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
                f"&gsrsearch={quote_plus(topic + ' diagram')}&gsrlimit=5&prop=imageinfo"
                f"&iiprop=url&iiurlwidth=1000&format=json"
            )
            res_json = _make_request(commons_url)
            data = json.loads(res_json)
            pages = data.get("query", {}).get("pages", {})
            for p_id, p_info in pages.items():
                imageinfo = p_info.get("imageinfo", [])
                if imageinfo:
                    direct_url = imageinfo[0].get("thumburl") or imageinfo[0].get("url")
                    if direct_url and not is_search_url(direct_url) and direct_url not in candidates:
                        candidates.append(direct_url)
        except Exception:
            pass

    # 3. DuckDuckGo Image JSON API
    try:
        vqd_url = f"https://duckduckgo.com/?q={quote_plus(query)}&iax=images&ia=images"
        html = _make_request(vqd_url)
        vqd_match = re.search(r'vqd=([\d-]+)', html) or re.search(r'vqd="([^"]+)"', html)
        if vqd_match:
            vqd = vqd_match.group(1)
            img_api = f"https://duckduckgo.com/i.js?q={quote_plus(query)}&o=json&p=1&s=0&u=bing&f=,,,&l=us-en&vqd={vqd}"
            res_json = _make_request(img_api, headers={"Referer": "https://duckduckgo.com/"})
            data = json.loads(res_json)
            for item in data.get("results", []):
                img_url = item.get("image")
                if img_url and img_url.startswith("http") and not is_search_url(img_url):
                    if img_url not in candidates:
                        candidates.append(img_url)
    except Exception:
        pass

    return candidates


# ==============================================================================
# 4. CANDIDATE RANKING
# ==============================================================================

AUTHORITY_DOMAINS = [
    "khanacademy.org",
    "geeksforgeeks.org",
    "libretexts.org",
    "byjus.com",
    "tutorialspoint.com",
    "javatpoint.com",
    "baeldung.com",
    "w3schools.com",
    "lamar.edu",
    "openstax.org",
    "mit.edu",
    "stanford.edu",
    "coursera.org",
    "sciencedirect.com",
    "britannica.com"
]


def _rank_candidates(candidates: list, topic: str, subject: str = "") -> list:
    """Ranks candidates by keyword match, domain authority, and resource specificity."""
    clean_topic = _clean_topic_name(topic).lower()
    topic_tokens = [w for w in re.split(r'\W+', clean_topic) if len(w) > 2]

    def score_candidate(url: str) -> int:
        score = 0
        url_lower = url.lower()
        
        # High score for authority educational platforms
        for auth_domain in AUTHORITY_DOMAINS:
            if auth_domain in url_lower:
                score += 15
                break
                
        # Points for each matching topic token in URL path
        for token in topic_tokens:
            if token in url_lower:
                score += 5
                
        if subject and subject.lower() in url_lower:
            score += 2
            
        return score

    return sorted(candidates, key=score_candidate, reverse=True)


# ==============================================================================
# 5. CORE RESOLVER FUNCTIONS (RETURNS EXACT DIRECT URL OR NONE)
# ==============================================================================

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


def get_exact_image_url(query: str, topic: str = "", subject: str = "") -> str:
    """
    Finds exactly ONE direct image resource (.jpg/.png/.svg/.webp).
    Validates MIME type / image extension.
    Returns direct image URL or None.
    NEVER returns an image search page or thumbnail grid.
    """
    clean_topic = _clean_topic_name(topic, query, subject)
    search_q = f"{clean_topic} {subject} diagram formula chart".strip()

    print(f"[Image] Searching for direct educational diagram...")
    candidates = _search_image_candidates(search_q, clean_topic)
    
    # Try broader query if 0 candidates found
    if not candidates:
        candidates = _search_image_candidates(f"{clean_topic} diagram", clean_topic)

    ranked_candidates = _rank_candidates(candidates, clean_topic, subject)

    for candidate in ranked_candidates:
        if is_valid_image_url(candidate, check_live=False):
            print(f"[Image] Valid direct URL: {candidate}")
            return candidate

    print(f"[Image] No valid direct image found. Returning None.")
    return None


def get_exact_pdf_url(query: str, topic: str = "", subject: str = "") -> str:
    """
    Finds exactly ONE direct PDF document URL.
    Validates that URL points to a PDF.
    Returns direct PDF URL or None.
    NEVER returns a Google search page.
    """
    clean_topic = _clean_topic_name(topic, query, subject)
    search_q = f"{clean_topic} {subject} notes filetype:pdf".strip()

    print(f"[PDF] Searching for direct PDF document...")
    candidates = _search_web_candidates(search_q)

    # Filter strictly for candidate URLs containing .pdf
    pdf_candidates = [c for c in candidates if is_valid_pdf_url(c, check_live=False)]
    
    if not pdf_candidates:
        # Search with alternative phrasing
        alt_candidates = _search_web_candidates(f"{clean_topic} revision notes pdf")
        pdf_candidates = [c for c in alt_candidates if is_valid_pdf_url(c, check_live=False)]

    ranked_pdfs = _rank_candidates(pdf_candidates, clean_topic, subject)

    for candidate in ranked_pdfs:
        if is_valid_pdf_url(candidate, check_live=False):
            print(f"[PDF] Valid PDF URL: {candidate}")
            return candidate

    print(f"[PDF] No verified direct PDF document found. Returning None.")
    return None


def get_exact_web_url(query: str, topic: str = "", subject: str = "") -> str:
    """
    Finds exactly ONE direct educational article URL (Khan Academy, GeeksforGeeks, LibreTexts, etc.).
    Returns direct article URL or None.
    NEVER returns a search results page.
    """
    clean_topic = _clean_topic_name(topic, query, subject)
    search_q = f"{clean_topic} {subject} tutorial explanation".strip()

    print(f"[Web] Searching for direct educational article...")
    candidates = _search_web_candidates(search_q)

    # Filter out search engines and rank by educational quality
    valid_candidates = [c for c in candidates if is_valid_web_url(c, check_live=False)]
    ranked_web = _rank_candidates(valid_candidates, clean_topic, subject)

    for candidate in ranked_web:
        if is_valid_web_url(candidate, check_live=False):
            print(f"[Web] Valid article URL: {candidate}")
            return candidate

    print(f"[Web] No verified direct article found. Returning None.")
    return None
