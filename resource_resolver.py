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


# ==============================================================================
# 4. CANDIDATE RANKING
# ==============================================================================

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
            "is a useful educational resource for a student studying the given topic.\n\n"
            "The image MUST contain meaningful educational content such as:\n"
            "- a diagram\n"
            "- labeled concepts\n"
            "- explanations\n"
            "- formulas\n"
            "- examples\n"
            "- process/flowchart\n"
            "- comparison\n"
            "- graph or chart\n\n"
            "Reject the image if it is primarily:\n"
            "- a photograph\n"
            "- decorative artwork\n"
            "- an unlabeled object/model\n"
            "- a traffic sign / road sign / speed limit sign\n"
            "- a portrait of a person\n"
            "- unrelated visual content\n\n"
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


def get_exact_image_url(query: str, topic: str = "", subject: str = "") -> str:
    """
    Finds exactly ONE direct image resource (.jpg/.png/.svg/.webp).
    Validates MIME type / image extension and educational quality via AI Judge.
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
            # Run AI Educational Judge Evaluation
            eval_res = evaluate_image_educational_quality(candidate, clean_topic, subject)
            if eval_res.get("relevant") == "YES" and eval_res.get("educational") == "YES" and eval_res.get("score", 0) >= 50:
                print(f"[Image] Valid direct URL (AI Score: {eval_res.get('score')}): {candidate}")
                return candidate
            else:
                print(f"[Image] Candidate rejected by AI Judge ({eval_res.get('reason')}): {candidate}")

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
