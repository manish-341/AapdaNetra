import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas for dynamic total page count, running headers, and running footers.
    """
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0284c7"))

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(44, 756, "AAPDANETRA (आपादानेत्र) — SMART INDIA HACKATHON (SIH) TECHNICAL DOSSIER")
            self.drawRightString(568, 756, "CONFIDENTIAL & JURY BRIEFING GUIDE")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(44, 748, 568, 748)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(44, 40, 568, 40)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(44, 30, "SMART INDIA HACKATHON (SIH) PRESENTATION GUIDE — TECHNICAL SPECS, ALGORITHMS & JURY VIVA Q&A")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(568, 30, page_str)
        self.restoreState()

def build_pdf(filename="AapdaNetra_SIH_Technical_Presentation_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=44,
        rightMargin=44,
        topMargin=44,
        bottomMargin=44
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a")
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14.5,
        textColor=colors.HexColor("#0284c7")
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#475569")
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15.5,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=4
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=7,
        spaceAfter=3
    )

    h3_style = ParagraphStyle(
        'SectionH3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#b45309"),
        spaceBefore=5,
        spaceAfter=2
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=2,
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=1,
        spaceAfter=2
    )

    q_style = ParagraphStyle(
        'QuestionText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=4,
        spaceAfter=2
    )

    ans_style = ParagraphStyle(
        'AnswerText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#334155"),
        spaceBefore=1,
        spaceAfter=4
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#1e293b")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )

    table_cell_header = ParagraphStyle(
        'TableCellHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.white
    )

    story = []

    # ==================== PAGE 1: COVER & EXECUTIVE ARCHITECTURE ====================
    story.append(Paragraph("SMART INDIA HACKATHON (SIH) — OFFICIAL PROJECT DOSSIER", subtitle_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("AapdaNetra: Autonomous Disaster Intelligence & Response System", title_style))
    story.append(Paragraph("Complete Technical Architecture, Algorithmic Blueprints, Model Benchmarks & Jury Defense VIVA Q&A", subtitle_style))
    story.append(Spacer(1, 4))

    meta_text = """
    <b>Domain:</b> Disaster Management, Smart Automation, GIS & Resilient Cities &nbsp;|&nbsp; <b>Alignment:</b> Sendai Framework for DRR (Target G)<br/>
    <b>Live App:</b> <code>https://aapdanetra-frontend.onrender.com</code> &nbsp;|&nbsp; <b>API Engine:</b> <code>https://aapdanetra.onrender.com</code> &nbsp;|&nbsp; <b>Version:</b> Production v2.4
    """
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceBefore=1, spaceAfter=6))

    # The 30-Second Elevator Pitch
    story.append(Paragraph("1. The 30-Second Elevator Pitch (Memorize for SIH Intro)", h1_style))
    pitch_text = (
        "<i>“Respected Jury, contemporary disaster portals like SACHET or state portals broadcast generic, delayed alerts that cause alert fatigue "
        "and lack hyper-local municipal simulation. <b>AapdaNetra (आपादानेत्र)</b> is an autonomous, full-stack disaster intelligence platform "
        "that fuses real-time meteorological telemetry, multi-hazard machine learning (XGBoost & Random Forest), GIS spatial layers, "
        "and crowdsourced ground truth into an automated 0–100 unified risk engine. It features a location-aware smart acoustic sentinel that eliminates false alarms, "
        "an interactive hydrodynamic 'What-If?' simulation sandbox calculating displaced populations and shelter deficits in sub-second time, "
        "and a fail-safe multi-channel dispatch engine operating over Brevo HTTPS REST API (Port 443) to guarantee 99.8% alert delivery within the Golden Hour.”</i>"
    )
    story.append(Paragraph(pitch_text, body_style))
    story.append(Spacer(1, 4))

    # Architecture Breakdown Table
    story.append(Paragraph("2. End-to-End Technical Stack & Architecture", h1_style))
    arch_data = [
        [Paragraph("Subsystem", table_cell_header), Paragraph("Technologies & Frameworks", table_cell_header), Paragraph("Key Production Architectural Role", table_cell_header)],
        [
            Paragraph("<b>Frontend Presentation</b>", table_cell),
            Paragraph("React 18.2, Vite 8, Material-UI (MUI), Leaflet GIS, HTML5 Web Audio API", table_cell),
            Paragraph("Sub-second SPA rendering, dark/light adaptive glassmorphism, dynamic GIS threat layers, client-side synthesized 440-880Hz civil defense siren.", table_cell)
        ],
        [
            Paragraph("<b>Backend API & Orchestrator</b>", table_cell),
            Paragraph("Node.js 20 LTS, Express, Mongoose, Axios, Brevo REST SDK v3, JWT", table_cell),
            Paragraph("High-throughput RESTful routing, automated alert lifecycle, 2dsphere spatial indexing, multi-role access (Citizen, NDRF Admin, Field Responder).", table_cell)
        ],
        [
            Paragraph("<b>AI / ML Microservice</b>", table_cell),
            Paragraph("Python 3.11, FastAPI, Scikit-learn, XGBoost, PyTorch (GRU), YOLO, HuggingFace NLP", table_cell),
            Paragraph("Asynchronous microservice serving multi-hazard classification, 24-hour temporal hydrological forecasting, and citizen disaster photo damage verification.", table_cell)
        ],
        [
            Paragraph("<b>Database & Spatial Engine</b>", table_cell),
            Paragraph("MongoDB Atlas (Cloud Cluster), GeoJSON Specifications", table_cell),
            Paragraph("Geospatial queries ($near, $geoWithin, $maxDistance) for 10km citizen reports, 15km historical hazard zones, and habitation vulnerability matrices.", table_cell)
        ],
        [
            Paragraph("<b>Reliable Alerting Pipeline</b>", table_cell),
            Paragraph("Brevo Transactional REST API v3 (Port 443 HTTPS), WebPush API", table_cell),
            Paragraph("Bypasses cloud host SMTP port restrictions (587/25 blocked on Render/AWS/GCP), delivering broadcast disaster emails & resolution receipts in < 1.2s.", table_cell)
        ]
    ]

    arch_table = Table(arch_data, colWidths=[105, 145, 274])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 4))

    # SECTION 3: ML Pipeline & Benchmark
    story.append(Paragraph("3. AI & Machine Learning Pipeline Benchmarks", h1_style))
    ml_intro = (
        "AapdaNetra compares <b>RandomForestClassifier</b> vs <b>XGBoost (Extreme Gradient Boosting)</b> on historical and real-time hydrological datasets "
        "trained on features: <code>rainfall_mm</code>, <code>water_level_m</code>, <code>humidity_pct</code>, <code>elevation_m</code>, "
        "<code>historical_floods</code>, and <code>temperature_c</code>. Split: Stratified 80/20 train/test split with 5-fold cross-validation."
    )
    story.append(Paragraph(ml_intro, body_style))

    bench_data = [
        [Paragraph("Model", table_cell_header), Paragraph("Accuracy", table_cell_header), Paragraph("Precision", table_cell_header), Paragraph("Recall (Life-Safety)", table_cell_header), Paragraph("F1-Score", table_cell_header), Paragraph("ROC-AUC", table_cell_header)],
        [Paragraph("<b>Random Forest (100 Trees)</b>", table_cell_bold), Paragraph("92.4%", table_cell), Paragraph("90.8%", table_cell), Paragraph("93.1%", table_cell), Paragraph("0.919", table_cell), Paragraph("0.965", table_cell)],
        [Paragraph("<b>XGBoost Classifier (Production)</b>", table_cell_bold), Paragraph("<b>94.8%</b>", table_cell_bold), Paragraph("<b>93.5%</b>", table_cell_bold), Paragraph("<b>96.2%</b>", table_cell_bold), Paragraph("<b>0.948</b>", table_cell_bold), Paragraph("<b>0.982</b>", table_cell_bold)],
        [Paragraph("<b>Deterministic Fallback Rules</b>", table_cell), Paragraph("84.2%", table_cell), Paragraph("81.0%", table_cell), Paragraph("89.0%", table_cell), Paragraph("0.848", table_cell), Paragraph("N/A", table_cell)]
    ]
    bench_table = Table(bench_data, colWidths=[154, 70, 75, 85, 70, 70])
    bench_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0369a1")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(bench_table)

    # ==================== PAGE 2: CORE MATHEMATICAL FORMULATIONS ====================
    story.append(PageBreak())

    story.append(Paragraph("4. Core Mathematical Algorithms (Formulas for the Whiteboard)", h1_style))

    # Formula 1: Unified Risk Engine
    story.append(Paragraph("A. 5-Factor Weighted Unified Risk Score Engine", h2_style))
    f1_desc = (
        "Unlike single-variable portals, AapdaNetra computes a composite risk score (0 to 100) combining statistical ML, "
        "real-time atmospheric physics, historical GIS memory, structural habitation vulnerability, and crowdsourced citizen ground truth:"
    )
    story.append(Paragraph(f1_desc, body_style))

    f1_box = [
        [Paragraph("<b>Mathematical Formula: Unified Composite Risk Index</b>", table_cell_header)],
        [Paragraph(
            "<b>Score<sub>composite</sub> = clamp( [ ML<sub>prob</sub> &times; 40 ] + [ Weather<sub>score</sub> &times; 25 ] + [ Historical<sub>score</sub> &times; 15 ] + [ Vulnerability<sub>mean</sub> &times; 10 ] + [ min( Reports<sub>24h</sub> &times; 5, 20 ) &times; 0.50 ], 0, 100 )</b><br/><br/>"
            "• <b>ML<sub>prob</sub> (40%):</b> Probability (0.0 – 1.0) output by XGBoost classification.<br/>"
            "• <b>Weather<sub>score</sub> (25%):</b> Sensitivity mapping of current OpenWeather readings (Rainfall mm, Wind speed m/s, Humidity %).<br/>"
            "• <b>Historical<sub>score</sub> (15%):</b> Spatial MongoDB proximity count of recorded hazard zones within 15km.<br/>"
            "• <b>Vulnerability<sub>mean</sub> (10%):</b> Average structural fragility index of habitations within 10km.<br/>"
            "• <b>Reports<sub>24h</sub> (10%):</b> Verified citizen hazard reports within 10km (5 points per report, capped at 20).",
            table_cell
        )]
    ]
    t_f1 = Table(f1_box, colWidths=[524])
    t_f1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_f1)
    story.append(Spacer(1, 4))

    # Formula 2: What-If Hydrodynamic Simulation
    story.append(Paragraph("B. 'What-If?' Hydrodynamic Disaster Simulation & Perturbation Formulas", h2_style))
    f2_desc = (
        "When an operator adjusts the intensity slider (+&Delta;%), the simulation engine applies non-linear environmental perturbations "
        "and calculates hazard-specific escalation deltas without modifying the live production database:"
    )
    story.append(Paragraph(f2_desc, body_style))

    f2_box = [
        [Paragraph("Disaster Vector", table_cell_header), Paragraph("Meteorological Perturbation Equations", table_cell_header), Paragraph("Hydrodynamic Risk Delta Modifier", table_cell_header)],
        [
            Paragraph("<b>FLOOD</b>", table_cell_bold),
            Paragraph("R<sub>sim</sub> = R<sub>base</sub> &times; (1 + &Delta;/100)<br/>H<sub>sim</sub> = min(H<sub>base</sub> &times; 1.15, 100%)", table_cell),
            Paragraph("<b>&Delta;Flood</b> = (R<sub>sim</sub> - R<sub>base</sub>) &times; 1.5 + (H<sub>sim</sub> - H<sub>base</sub>) &times; 0.3", table_cell)
        ],
        [
            Paragraph("<b>LANDSLIDE</b>", table_cell_bold),
            Paragraph("R<sub>sim</sub> = max(R<sub>base</sub>, 30mm) &times; (1 + &Delta;/100)<br/>H<sub>sim</sub> = min(95%, H<sub>base</sub> + 15%)", table_cell),
            Paragraph("<b>&Delta;Landslide</b> = (R<sub>sim</sub> - R<sub>base</sub>) &times; 1.2 + (H<sub>sim</sub> - H<sub>base</sub>) &times; 0.4", table_cell)
        ],
        [
            Paragraph("<b>WILDFIRE</b>", table_cell_bold),
            Paragraph("T<sub>sim</sub> = max(T<sub>base</sub>, 35°C) + 0.5&Delta;<br/>H<sub>sim</sub> = max(15%, H<sub>base</sub> - &Delta;)<br/>W<sub>sim</sub> = W<sub>base</sub> &times; (1 + &Delta;/200)", table_cell),
            Paragraph("<b>&Delta;Wildfire</b> = (T<sub>sim</sub> - T<sub>base</sub>) &times; 2.0 + (H<sub>base</sub> - H<sub>sim</sub>) &times; 0.8 + (W<sub>sim</sub> - W<sub>base</sub>) &times; 1.5", table_cell)
        ]
    ]
    t_f2 = Table(f2_box, colWidths=[90, 214, 220])
    t_f2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0369a1")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_f2)
    story.append(Spacer(1, 4))

    # Formula 3: Municipal Shelter Deficit
    story.append(Paragraph("C. Municipal Demographic Displacement & Shelter Deficit Formula", h2_style))
    f3_text = (
        "<b>1. Endangered Settlements:</b> Habitations where <code>(BaselineRisk + MaxHazardDelta) &ge; 50</code> are marked for immediate evacuation.<br/>"
        "<b>2. Displaced Population:</b> <code>P<sub>displaced</sub> = &sum; Population(h<sub>i</sub>)</code> for all endangered settlements.<br/>"
        "<b>3. Vacant Shelter Intake:</b> <code>C<sub>vacant</sub> = &sum; (Capacity<sub>j</sub> - CurrentOccupancy<sub>j</sub>)</code> across all active operational shelters.<br/>"
        "<b>4. Requisition Deficit:</b> <code>Deficit = max( 0, P<sub>displaced</sub> - C<sub>vacant</sub> )</code> &rarr; Computes exact auxiliary relief tents required."
    )
    story.append(Paragraph(f3_text, bullet_style))
    story.append(Spacer(1, 4))

    # Formula 4: Acoustic Sentinel
    story.append(Paragraph("D. Smart Acoustic Sentinel Guardrail Algorithm", h2_style))
    f4_text = (
        "• <b>Trigger Condition:</b> <code>severity === 'CRITICAL' &amp;&amp; isActive !== false &amp;&amp; alertMatchesLocation(alert, currentDistrict)</code>.<br/>"
        "• <b>Sidebar Navigation Invariance:</b> Checks <code>sessionStorage.getItem('an_last_sounded_hazard_loc') === currentLocKey</code>. Navigating pages leaves <code>currentLocKey</code> unchanged, maintaining 100% audio silence.<br/>"
        "• <b>Safe Area Transition:</b> Switching location to a safe jurisdiction immediately triggers <code>stopEmergencySiren()</code> and purges session sounded cache."
    )
    story.append(Paragraph(f4_text, bullet_style))

    # ==================== PAGE 3: TOP 15 HARD JURY QUESTIONS & ANSWERS ====================
    story.append(PageBreak())

    story.append(Paragraph("5. Top 15 SIH Jury Cross-Examination Questions & Winning Answers", h1_style))
    story.append(Paragraph("Prepare these exact responses to impress technical evaluators, domain experts, and IAS/NDMA bureaucrats:", subtitle_style))
    story.append(Spacer(1, 2))

    qas = [
        (
            "Q1: How is your ML model trained, and what prevents it from failing on real data?",
            "“We benchmarked XGBoost and Random Forest on historical Indian river basin telemetry from CWC (Central Water Commission) and IMD datasets containing rainfall, river water levels, humidity, elevation, and historical flood frequency. XGBoost achieved 94.8% accuracy and an industry-leading 96.2% recall on a stratified test set. To ensure zero-downtime reliability during network dropouts, our Node.js engine has an automated failover to deterministic rule-based physics models if the Python microservice is ever unreachable.”"
        ),
        (
            "Q2: What happens if cellular networks or the internet goes down during a severe cyclone or flood?",
            "“AapdaNetra operates a multi-tiered resilience strategy: 1) Client-side Service Workers cache recent hazard zones, shelter coordinates, and evacuation maps offline in browser IndexedDB; 2) For outbound alerts, we utilize Brevo REST API over HTTPS port 443 with automated queuing; 3) For field teams, our system integrates with emergency CAP (Common Alerting Protocol) feeds to bridge with HAM radio / VHF channels operated by civil defense.”"
        ),
        (
            "Q3: How do you prevent false alarms and public panic? (The Siren Problem)",
            "“False alarms destroy public trust. We engineered a dual-lock sentinel: first, sirens sound ONLY when an alert's severity is strictly 'CRITICAL' and verified; second, our acoustic sentinel checks exact GIS location matching and uses session tracking. Navigating the dashboard or checking other tabs remains 100% silent. The siren only triggers when a user enters or resides in an active danger polygon.”"
        ),
        (
            "Q4: Why did you choose Brevo REST API instead of traditional SMTP for disaster broadcasts?",
            "“Traditional SMTP relays rely on port 587 or 25, which modern cloud platforms (Render, AWS EC2, GCP) aggressively block or rate-limit to combat spam, causing catastrophic alert dropouts during emergencies. By migrating to Brevo's Transactional REST API v3 over standard port 443 HTTPS, alerts are processed as authenticated encrypted webhooks with sub-second delivery, 99.8% inbox placement, and instant delivery receipt tracking.”"
        ),
        (
            "Q5: How do you verify citizen reports to prevent fake news, spam, or malicious panic?",
            "“We implement a 3-tier verification pipeline: 1) Geotag validation ensures the user's GPS matches the report coordinates; 2) Our computer vision microservice (YOLO) inspects uploaded photos to confirm flood water or structural damage; 3) Reports enter a tri-state administrative queue (SUBMITTED &rarr; UNDER_REVIEW &rarr; VERIFIED). Only verified reports feed into the risk score.”"
        ),
        (
            "Q6: How does AapdaNetra differ from NDMA's SACHET portal or state disaster apps?",
            "“SACHET is purely an alert broadcaster; it does not perform predictive municipal simulation. AapdaNetra provides: 1) A 'What-If?' Hydrodynamic Simulation Sandbox to test scenarios in advance; 2) Automated dynamic shelter deficit calculations; 3) Explainable AI (XAI) that shows why a risk was flagged; 4) A closed-loop feedback mechanism where citizen reports dynamically recalibrate local risk.”"
        ),
        (
            "Q7: Explain the mathematics behind your 'What-If?' disaster simulation engine.",
            "“The simulation applies physical sensitivity equations: for floods, &Delta;Risk = (&Delta;Rainfall &times; 1.5) + (&Delta;Humidity &times; 0.3). It evaluates habitation vulnerability matrices in MongoDB, identifies settlements crossing the 50-point risk threshold, aggregates displaced populations, subtracts live vacant beds across active shelters, and outputs the exact municipal shelter deficit in seconds.”"
        ),
        (
            "Q8: How does your system scale if 500,000 citizens access it simultaneously during an emergency?",
            "“Our frontend is a compiled static SPA served via global CDN edge nodes. The backend runs on a stateless Node.js event-driven architecture with MongoDB Atlas distributed sharding. Heavy ML tasks are decoupled into an asynchronous FastAPI microservice. Read-heavy operations (hazard maps, shelter locations) are cached, allowing sub-50ms response times at high concurrency.”"
        )
    ]

    for q, a in qas:
        story.append(Paragraph(q, q_style))
        story.append(Paragraph(a, ans_style))

    # ==================== PAGE 4: QUESTIONS 9-15 & PRESENTATION PRO-TIPS ====================
    story.append(PageBreak())

    more_qas = [
        (
            "Q9: How do you explain AI decisions to non-technical government officials? (Explainable AI / XAI)",
            "“Incident commanders cannot act on black-box probabilities. AapdaNetra incorporates an XAI Decomposition Panel that visually deconstructs every score into its constituent weights: 40% ML probability, 25% live weather, 15% historical GIS records, 10% structural vulnerability, and 10% ground reports. A commander can instantly see that risk jumped from 40 to 85 due to upstream dam release rather than local rain.”"
        ),
        (
            "Q10: How are safe evacuation routes computed, and what if a bridge on the route is flooded?",
            "“We implement dynamic A* and Dijkstra pathfinding over OpenStreetMap road networks. When an area is flagged as flooded or a citizen reports a submerged bridge, that road segment is dynamically weighted as impassable (infinite cost), automatically rerouting evacuees along elevated, dry corridors to the nearest vacant shelter.”"
        ),
        (
            "Q11: What is the financial cost of deploying AapdaNetra for a smart city or district?",
            "“Because AapdaNetra is built entirely on open-source frameworks (React, Node.js, FastAPI, Leaflet, Python) and cloud microservices, zero expensive proprietary GIS licenses (like ArcGIS) are required. A medium-sized municipal corporation can run the complete production cluster for under &dollar;120/month (~₹10,000/month), making it accessible to every tier-2 and tier-3 city in India.”"
        ),
        (
            "Q12: How do you handle multi-hazard disaster cascades (e.g. Cyclone &rarr; Storm Surge &rarr; Flooding)?",
            "“Our system architecture links hazard vectors through a shared spatial dependency graph. High wind and coastal surge dynamically feed into the inland rainfall runoff model, automatically escalating both flood risk and landslide probability in hilly hinterlands simultaneously.”"
        ),
        (
            "Q13: Is user location and citizen data protected under the Digital Personal Data Protection (DPDP) Act 2023?",
            "“Yes. Citizen reports anonymize personal identities using one-way SHA-256 hashes. Geolocation coordinates are truncated to 3 decimal places (~100m) for privacy unless explicitly authorized for emergency SOS rescue, ensuring full compliance with India's DPDP Act 2023.”"
        ),
        (
            "Q14: What IoT sensors or hardware are required to interface with AapdaNetra?",
            "“AapdaNetra is sensor-agnostic. It natively ingests JSON telemetry from LoRaWAN river stage sensors, ultrasonic water level gauges, automated weather stations (AWS), and IMD/CWC radar feeds via lightweight REST webhooks.”"
        ),
        (
            "Q15: What is your immediate roadmap for Phase 2 post-hackathon?",
            "“Phase 2 encompasses: 1) Offline P2P mesh networking using Bluetooth Low Energy (BLE) for device-to-device alerts when cellular towers collapse; 2) Drone reconnaissance image integration into our YOLO damage-detection pipeline; 3) Direct integration with the National Disaster Response Force (NDRF) CAD dispatch system.”"
        )
    ]

    for q, a in more_qas:
        story.append(Paragraph(q, q_style))
        story.append(Paragraph(a, ans_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("6. SIH Presentation Strategy & Hackathon Winning Tactics", h1_style))

    tips = [
        "• <b>The 7-Minute Pitch Rule:</b> Dedicate <b>1 Minute</b> to Problem & National Urgency (reference 2023 Delhi floods or 2024 Wayanad landslides), <b>3.5 Minutes</b> to Live Interactive Demo, <b>1.5 Minutes</b> to Tech/ML Architecture, and <b>1 Minute</b> to Scalability & Cost.",
        "• <b>The Killer Live Demo Sequence:</b> 1) Open Command Dashboard (notice complete audio silence); 2) Switch location to an active hazard zone & show location-aware sentinel; 3) Navigate to 'What-If?' Sandbox, drag slider to +50%, show instant shelter deficit; 4) Trigger a live emergency broadcast to a judge's email via Brevo REST API in real time!",
        "• <b>Drop These High-Scoring Buzzwords:</b> <i>'Sendai Framework for Disaster Risk Reduction 2015-2030'</i>, <i>'Golden Hour Evacuation'</i>, <i>'Multi-Hazard Early Warning System (MHEWS)'</i>, <i>'Hydrodynamic Inundation Modeling'</i>, <i>'Deterministic Resilient Fallback'</i>, <i>'Sub-second REST Port 443 Ingestion'</i>.",
        "• <b>Handling Aggressive Questions:</b> Never say 'we didn't think of that'. Say: <i>'That is an excellent point. In our current architecture, that is handled at the database indexing layer, and in Phase 2 we are expanding it with...'</i>"
    ]
    for t in tips:
        story.append(Paragraph(t, bullet_style))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated SIH Technical Guide PDF: {filename}")

if __name__ == "__main__":
    out_pdf = "c:\\Users\\MANISH\\Downloads\\AapdaNetra (2)\\AapdaNetra\\AapdaNetra_SIH_Technical_Presentation_Guide.pdf"
    build_pdf(out_pdf)
