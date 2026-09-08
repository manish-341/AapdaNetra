import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas

# ---------------------------------------------------------
# Numbered Canvas for Running Header, Footer, and Page Count
# ---------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header (on all pages)
        self.drawString(54, letter[1] - 36, "AapdaNetra vs. NDMA SACHET — Comparative Intelligence & Feasibility Report")
        self.drawRightString(letter[0] - 54, letter[1] - 36, "Technical & Operational Whitepaper")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Running Footer
        self.line(54, 45, letter[0] - 54, 45)
        self.setFont("Helvetica", 7.5)
        self.drawString(54, 32, "Confidential • Academic Defense, Policy & Technical Evaluation Reference")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 32, page_str)
        self.restoreState()


def generate_comparison_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    base_styles = getSampleStyleSheet()

    # Color Palette
    PRIMARY = colors.HexColor("#0284c7")       # Sky Blue
    NAVY = colors.HexColor("#0f172a")          # Deep Slate Navy
    DARK_GRAY = colors.HexColor("#1e293b")     # Charcoal body text
    MUTED = colors.HexColor("#64748b")         # Slate Muted
    LIGHT_BG = colors.HexColor("#f8fafc")      # Alternate row background
    CALLOUT_BG = colors.HexColor("#f0f9ff")    # Blue callout
    CALLOUT_BORDER = colors.HexColor("#bae6fd")
    BORDER_COLOR = colors.HexColor("#e2e8f0")
    ALERT_RED = colors.HexColor("#b91c1c")
    SAFE_GREEN = colors.HexColor("#15803d")
    ACCENT_AMBER = colors.HexColor("#b45309")

    # Typography Styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=21,
        leading=25,
        textColor=NAVY,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=PRIMARY,
        spaceAfter=6
    )

    meta_style = ParagraphStyle(
        "DocMeta",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=MUTED,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=NAVY,
        spaceBefore=11,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=PRIMARY,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11.5,
        textColor=DARK_GRAY,
        spaceAfter=4
    )

    body_bold = ParagraphStyle(
        "Body_Bold",
        parent=body_style,
        fontName="Helvetica-Bold"
    )

    callout_style = ParagraphStyle(
        "Callout",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11.5,
        textColor=NAVY
    )

    th_style = ParagraphStyle(
        "TH",
        parent=base_styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        "TD",
        parent=base_styles["Normal"],
        fontName="Helvetica",
        fontSize=7.6,
        leading=10.2,
        textColor=DARK_GRAY
    )

    td_bold = ParagraphStyle(
        "TDBold",
        parent=td_style,
        fontName="Helvetica-Bold",
        textColor=NAVY
    )

    story = []

    # =========================================================================
    # HEADER SECTION
    # =========================================================================
    story.append(Paragraph("AapdaNetra vs. NDMA SACHET: Comparative Analysis", title_style))
    story.append(Paragraph("Architectural Paradigm, AI Forensics, Shelter Logistics & Operational Differentiators", subtitle_style))
    story.append(Paragraph("<b>Evaluation Context:</b> Disaster Decision Support & Early Warning • <b>Target Stakeholders:</b> Academic Examiners, NDMA/SDMA Authorities & Technical Evaluators", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=0, spaceAfter=8))

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & PHILOSOPHICAL SHIFT
    # =========================================================================
    story.append(Paragraph("1. Executive Summary: The Paradigm Shift", h1_style))
    p1 = (
        "India's disaster warning landscape is anchored by the National Disaster Management Authority's (NDMA) "
        "<b>SACHET</b> platform, engineered by the Centre for Development of Telematics (C-DOT). SACHET serves as a centralized "
        "Common Alerting Protocol (CAP) aggregator that collects macro-level alerts from national agencies (IMD, CWC, INCOIS, FSI) "
        "and disseminates them outward to citizens. While effective as an authoritative alert bulletin, SACHET operates as a "
        "<b>one-way broadcast channel</b> that halts at the awareness stage."
    )
    story.append(Paragraph(p1, body_style))

    p2 = (
        "<b>AapdaNetra</b> introduces a next-generation <b>closed-loop disaster intelligence cockpit</b>. Rather than stopping at "
        "broadcasting that danger exists, AapdaNetra executes sub-kilometer hyper-local hazard modeling, demystifies risk drivers "
        "through Explainable AI (TreeSHAP), verifies field damage via Computer Vision, and closes the operational loop by executing "
        "<b>capacity-constrained shelter allocation</b> and unflooded evacuation routing. AapdaNetra bridges the critical gap between "
        "<i>early warning</i> and <i>tactical survival execution</i>."
    )
    story.append(Paragraph(p2, body_style))

    exec_box = [[
        Paragraph(
            "<b>The Core Contrast in One Sentence:</b><br/>"
            "<i>• SACHET tells citizens:</i> <b>'There is a severe flood in your district; stay vigilant.'</b><br/>"
            "<i>• AapdaNetra tells citizens & responders:</i> <b>'Water will crest at your ward in 2 hours (+42% river surge); take Route B to Shelter #4 because it has 48 available beds, while Shelter #1 is at 95% capacity.'</b>",
            callout_style
        )
    ]]
    t_box = Table(exec_box, colWidths=[letter[0] - 108])
    t_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CALLOUT_BG),
        ('BORDER', (0, 0), (-1, -1), 1, CALLOUT_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_box)
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 2: COMPREHENSIVE FEATURE COMPARISON MATRIX
    # =========================================================================
    story.append(Paragraph("2. Deep-Dive Feature & Architectural Comparison Matrix", h1_style))

    matrix_data = [
        [Paragraph("Dimension / Feature", th_style), Paragraph("NDMA SACHET App", th_style), Paragraph("AapdaNetra Platform (Our Project)", th_style)],
        [
            Paragraph("<b>Core Architecture</b>", td_bold),
            Paragraph("Centralized CAP alert dissemination broker.", td_style),
            Paragraph("Decoupled microservice: React 19 + Node.js + FastAPI AI service + MongoDB.", td_style)
        ],
        [
            Paragraph("<b>Prediction Granularity</b>", td_bold),
            Paragraph("<b>Macro / District-wide</b> (reflects regional IMD/CWC bulletins).", td_style),
            Paragraph("<b>Sub-Kilometer Hyper-Local</b> via calibrated XGBoost & Random Forest pipelines (~94.2% F1).", td_style)
        ],
        [
            Paragraph("<b>Explainable AI (XAI)</b>", td_bold),
            Paragraph("<b>None</b> (Opaque color codes: Green/Yellow/Orange/Red).", td_style),
            Paragraph("<b>TreeSHAP & Gini Factor Attribution</b> (Decomposes exact drivers: +42% Rain, +28% Gauge, -10% Elev).", td_style)
        ],
        [
            Paragraph("<b>Temporal Hydro-Forecasting</b>", td_bold),
            Paragraph("Static current status or 24-48h generic weather text.", td_style),
            Paragraph("<b>5-Horizon Predictive Trends (0h, 2h, 6h, 12h, 24h)</b> modeling drainage lag & saturation curves.", td_style)
        ],
        [
            Paragraph("<b>Information Flow</b>", td_bold),
            Paragraph("<b>One-Way Broadcast</b> (Citizen is a passive recipient).", td_style),
            Paragraph("<b>Bidirectional Loop</b> (Citizens submit geotagged distress reports with automated NLP & Vision triage).", td_style)
        ],
        [
            Paragraph("<b>Relief & Shelter Logistics</b>", td_bold),
            Paragraph("<b>None</b> (Only displays static helpline numbers & text PDFs).", td_style),
            Paragraph("<b>Dynamic Capacity-Constrained Bed Tracking</b> with atomic reservation & overflow redirection.", td_style)
        ],
        [
            Paragraph("<b>Evacuation Path Safety</b>", td_bold),
            Paragraph("None (Citizens must determine routes independently).", td_style),
            Paragraph("<b>Inundation Polygon Verification</b> (Ensures citizens are not routed across submerged bridges).", td_style)
        ],
        [
            Paragraph("<b>Simulation Sandbox</b>", td_bold),
            Paragraph("None (Purely reactive to published alerts).", td_style),
            Paragraph("<b>'What-If?' Scenario Engine</b> (Stress-tests +30k cusec dam releases or +50% rainfall on city shelters).", td_style)
        ],
        [
            Paragraph("<b>Computer Vision AI</b>", td_bold),
            Paragraph("None (No image or multimedia processing).", td_style),
            Paragraph("<b>Damage Detection Module</b> (Detects flooded roads, fire, smoke, and structural collapses from photos).", td_style)
        ],
        [
            Paragraph("<b>Conversational Assistant</b>", td_bold),
            Paragraph("Static DOs and DONTs brochures.", td_style),
            Paragraph("<b>RAG AI Copilot (GPT-4o-mini)</b> with certified NDMA SOPs in Hinglish + Responder tactical briefing.", td_style)
        ],
        [
            Paragraph("<b>Emergency Audio Warning</b>", td_bold),
            Paragraph("Standard device push notification chime (easily muted/missed).", td_style),
            Paragraph("<b>In-Memory Web Audio API PCM Synthesizer</b> (7-second modulating acoustic siren running offline).", td_style)
        ],
        [
            Paragraph("<b>Role-Based Access (RBAC)</b>", td_bold),
            Paragraph("Uniform public interface for all users.", td_style),
            Paragraph("<b>Dual-Role RBAC</b> (District Tactical Command Desk vs. Citizen Public Safety Portal).", td_style)
        ]
    ]

    t_matrix = Table(matrix_data, colWidths=[120, 185, 199])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_matrix)
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 3: KEY DIFFERENTIATORS & REAL-WORLD SOLVED PROBLEMS
    # =========================================================================
    story.append(Paragraph("3. Critical Operational Advantages of AapdaNetra", h1_style))

    diffs = [
        (
            "A. Solving the 'Blind Evacuation' & Shelter Stampede Dilemma",
            "When SACHET broadcasts a 'Red Alert' for a district, citizens panic and flee toward the nearest known facility. "
            "Without live capacity visibility, shelters rapidly exceed 100% capacity, leading to severe sanitation collapse, food shortages, "
            "and secondary casualties. AapdaNetra enforces a capacity-constrained optimization algorithm [Sum(Pop_i) <= Capacity_j]. "
            "If Shelter A reaches 90% capacity, it automatically switches status to 'NEAR_CAPACITY', and the platform dynamically reroutes "
            "subsequent evacuees to secondary facilities with available beds and power generators."
        ),
        (
            "B. Explainable AI (XAI) Eliminates Administrative Reluctance",
            "District Magistrates and relief commissioners are hesitant to order multi-million-rupee mandatory evacuations based on "
            "opaque black-box AI scores. AapdaNetra implements TreeSHAP game-theoretic decomposition, showing officials exactly why an alert "
            "was triggered (e.g., Rainfall anomaly +42%, upstream reservoir release +28%, soil saturation 84%). This explainability gives "
            "commanders the confidence to mobilize National Disaster Response Force (NDRF) battalions early."
        ),
        (
            "C. Proactive 'What-If?' Pre-Disaster Stress Testing",
            "SACHET is purely reactive; it alerts users only after sensor thresholds are breached. AapdaNetra features a What-If simulation "
            "sandbox where administrators test extreme environmental parameters hours ahead (e.g., 'What happens if the upstream dam releases "
            "+40,000 cusecs while rainfall spikes 50%?'). The system computes newly inundated square kilometers, counts newly displaced "
            "families, and flags shelter deficit warnings before a single drop of floodwater enters residential wards."
        ),
        (
            "D. Multimodal Noise-Filtered Crowdsourcing & NLP Triage",
            "During crises, government helplines are overwhelmed with duplicate and spam reports. AapdaNetra validates citizen reports through "
            "a 4-stage filter: (1) GPS geofencing, (2) Sensor cross-validation, (3) Spatial clustering within 500m, and (4) Multilingual NLP "
            "triage that immediately elevates life-critical reports containing distress keywords ('trapped', 'submerged', 'water rising')."
        )
    ]

    for title, desc in diffs:
        story.append(Paragraph(title, h2_style))
        story.append(Paragraph(desc, body_style))

    story.append(Spacer(1, 6))

    # =========================================================================
    # SECTION 4: SYNERGY & INTEGRATION MODEL
    # =========================================================================
    story.append(Paragraph("4. Institutional Synergy: How AapdaNetra Complements SACHET", h1_style))
    p_syn = (
        "AapdaNetra is not designed to replace national alert infrastructure, but rather to serve as the <b>last-mile execution layer</b>. "
        "AapdaNetra can ingest SACHET's official Common Alerting Protocol (CAP) feeds at the district entry point, enrich that macro-alert "
        "with sub-kilometer XGBoost hazard scoring, evaluate ward-level habitation vulnerability, and direct citizens to safe, capacity-checked "
        "shelters. This turns national awareness into localized, life-saving operational logistics."
    )
    story.append(Paragraph(p_syn, body_style))

    # =========================================================================
    # SECTION 5: VIVA VOCE & TECHNICAL DEFENSE QUICK-FIRE
    # =========================================================================
    story.append(Paragraph("5. Viva Voce & Technical Defense Quick-Fire", h1_style))
    story.append(Paragraph("<b>Q: 'NDMA already deployed SACHET. Why is your system needed?'</b>", body_bold))
    a1 = (
        "<i>'SACHET is a one-way notification broadcast system at the district level. It alerts citizens that a hazard exists, "
        "but provides zero logistical support on where to go. AapdaNetra closes the operational loop: we provide sub-kilometer ML predictions, "
        "explain the risk factors via SHAP, verify damage through vision AI, and algorithmically allocate evacuees to safe shelters with live bed "
        "capacities and unflooded routes. SACHET provides alert awareness; AapdaNetra provides crisis execution.'</i>"
    )
    story.append(Paragraph(a1, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] Comparative PDF generated successfully at: {output_path}")

if __name__ == "__main__":
    target = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AapdaNetra_vs_SACHET_Comparative_Analysis.pdf")
    generate_comparison_pdf(target)
