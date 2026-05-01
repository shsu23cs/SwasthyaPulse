"""
NLP Analysis Pipeline
─────────────────────
• Entity extraction  — spaCy en_core_web_sm (medical terms via pattern matching)
• Sentiment          — VADER (rule-based, no GPU, fast)
• Safety signals     — keyword/regex detection
• PII/PHI masking    — regex patterns (SSN, DOB, phone, names next to patient ID)
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

# ── VADER sentiment ──────────────────────────────────────────────────────────
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    _vader = SentimentIntensityAnalyzer()
except ImportError:
    _vader = None  # graceful degradation

# ── spaCy NER ────────────────────────────────────────────────────────────────
try:
    import spacy
    _nlp = spacy.load("en_core_web_sm")
except Exception:
    _nlp = None

# ─── Domain wordlists ────────────────────────────────────────────────────────
DRUG_TERMS = {
    "pembrolizumab", "keytruda", "nivolumab", "opdivo", "ipilimumab",
    "carboplatin", "paclitaxel", "metformin", "insulin", "ozempic",
    "wegovy", "humira", "adalimumab", "dupilumab", "dupixent",
    "ssri", "sertraline", "fluoxetine", "escitalopram", "bupropion",
    "cgm", "dexcom", "libre", "statin", "atorvastatin", "rosuvastatin",
    "aspirin", "ibuprofen", "acetaminophen", "morphine", "oxycodone",
    "immunotherapy", "chemotherapy", "radiation", "adjuvant",
}

SYMPTOM_TERMS = {
    "fatigue", "nausea", "vomiting", "pain", "headache", "dizziness",
    "shortness of breath", "chest tightness", "chest pain", "palpitations",
    "myocarditis", "rash", "fever", "joint pain", "muscle pain",
    "anxiety", "depression", "insomnia", "weight loss", "weight gain",
    "sensor failure", "hypoglycemia", "hyperglycemia", "tremors",
}

CONDITION_TERMS = {
    "cancer", "diabetes", "type 1 diabetes", "type 2 diabetes",
    "hypertension", "heart disease", "asthma", "copd", "alzheimer",
    "parkinson", "multiple sclerosis", "lupus", "rheumatoid arthritis",
    "depression", "anxiety disorder", "ptsd", "ocd", "adhd",
}

# Safety signal keywords that indicate potential adverse events
SAFETY_KEYWORDS = [
    r"\ber\b", r"\bemergency\b", r"\bhospital\b", r"\bseizure\b",
    r"\bshortness of breath\b", r"\bchest (pain|tightness)\b",
    r"\bsuicid\b", r"\bself.harm\b", r"\boverdose\b",
    r"\bsevere\b.{0,30}\b(pain|reaction|side effect)\b",
    r"\breact\w*\b.{0,20}\b(severe|serious|bad|terrible)\b",
    r"\bdied?\b", r"\bdeath\b", r"\banaph\w+\b",
]

_SAFETY_RE = [re.compile(p, re.IGNORECASE) for p in SAFETY_KEYWORDS]

# PII patterns
_PII_PATTERNS = [
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "███-██-████"),          # SSN
    (re.compile(r"\b\d{10,11}\b"), "██████████"),                     # phone
    (re.compile(r"\bDOB:?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", re.I), "DOB: ██/██/████"),
    (re.compile(r"\bpatient\s+id:?\s*[\w-]+\b", re.I), "Patient ID: ██████"),
    (re.compile(r"\bMRN:?\s*[\w-]+\b", re.I), "MRN: ██████"),
]


@dataclass
class NLPResult:
    sentiment: str = "neutral"
    sentiment_score: float = 0.0
    keywords: list[str] = field(default_factory=list)
    entities: dict = field(default_factory=lambda: {"drugs": [], "symptoms": [], "conditions": []})
    has_alert: bool = False
    severity: str | None = None
    privacy_masked: bool = False
    content: str = ""


def analyze(text: str) -> NLPResult:
    """Run the full NLP pipeline on raw text."""
    result = NLPResult(content=text)

    # 1. PII Masking
    masked, was_masked = _mask_pii(text)
    result.content = masked
    result.privacy_masked = was_masked

    # 2. Sentiment (VADER)
    if _vader:
        scores = _vader.polarity_scores(masked)
        compound = scores["compound"]
        result.sentiment_score = round(compound, 4)
        if compound >= 0.05:
            result.sentiment = "positive"
        elif compound <= -0.05:
            result.sentiment = "negative"
        else:
            result.sentiment = "neutral"

    # 3. Entity extraction
    lower = masked.lower()
    drugs = [t for t in DRUG_TERMS if t in lower]
    symptoms = [t for t in SYMPTOM_TERMS if t in lower]
    conditions = [t for t in CONDITION_TERMS if t in lower]

    # Augment with spaCy NER if available (catches proper nouns like drug brand names)
    if _nlp:
        doc = _nlp(masked[:1000])  # truncate to avoid slow processing on long docs
        for ent in doc.ents:
            if ent.label_ in ("PRODUCT", "ORG") and ent.text.lower() not in drugs:
                drugs.append(ent.text.lower())

    result.entities = {
        "drugs": list(dict.fromkeys(drugs)),
        "symptoms": list(dict.fromkeys(symptoms)),
        "conditions": list(dict.fromkeys(conditions)),
    }

    # 4. Keywords = union of detected entities
    result.keywords = list(dict.fromkeys(drugs + symptoms + conditions))[:8]

    # 5. Safety signal detection
    matched_patterns = [p for p in _SAFETY_RE if p.search(masked)]
    if matched_patterns:
        result.has_alert = True
        # Severity tiers based on how many safety patterns matched
        if len(matched_patterns) >= 3 or result.sentiment_score <= -0.7:
            result.severity = "high"
        elif len(matched_patterns) >= 2 or result.sentiment_score <= -0.4:
            result.severity = "medium"
        else:
            result.severity = "low"

    return result


def _mask_pii(text: str) -> tuple[str, bool]:
    """Replace PII patterns with redacted placeholders. Returns (masked_text, was_changed)."""
    masked = text
    for pattern, replacement in _PII_PATTERNS:
        masked = pattern.sub(replacement, masked)
    return masked, masked != text
