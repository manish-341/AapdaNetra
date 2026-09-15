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
    Two-pass canvas to dynamically compute and draw total page count
    and professional running headers & footers.
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
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "AapdaNetra Autonomous Disaster Intelligence System")
            self.drawRightString(558, 750, "Technical Reference: What-If Simulation Engine")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)

        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — AAPDANETRA DISASTER OPERATIONS SUITE")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.restoreState()

def build_pdf(filename="AapdaNetra_WhatIf_Simulation_Technical_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0f172a")
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0284c7")
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#475569")
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=14,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=3,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#0f172a")
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#92400e")
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#1e293b")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#0f172a")
    )

    table_cell_header = ParagraphStyle(
        'TableCellHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.white
    )

    story = []

    # ---------------- PAGE 1: COVER & EXECUTIVE ARCHITECTURE ----------------
    story.append(Paragraph("AapdaNetra: Disaster Intelligence Platform", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("“What-If?” Disaster Simulation Engine", title_style))
    story.append(Paragraph("Comprehensive Technical Specification, Algorithmic Mathematics & System Workflow", subtitle_style))
    story.append(Spacer(1, 10))

    meta_text = """
    <b>Document Version:</b> 2.4.0 &nbsp;|&nbsp; <b>Classification:</b> Technical Reference &nbsp;|&nbsp; <b>Target Audience:</b> Disaster Commissioners, Incident Engineers<br/>
    <b>Core Service:</b> <code>simulationService.js</code> &nbsp;|&nbsp; <b>Route:</b> <code>POST /api/v1/intelligence/simulate</code> &nbsp;|&nbsp; <b>UI:</b> <code>frontend/src/pages/Simulation.jsx</code>
    """
    story.append(Paragraph(meta_text, meta_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceBefore=2, spaceAfter=10))

    # Executive Summary
    story.append(Paragraph("1. Executive Overview & Purpose", h1_style))
    exec_summary = (
        "The <b>“What-If?” Disaster Simulator</b> is an interactive predictive stress-testing sandbox in AapdaNetra. "
        "It empowers municipal commissioners, disaster response teams (NDRF/SDRF), and urban planners to hypothesize extreme "
        "climatological anomalies (e.g. cloudbursts, heatwaves, arid gale-force winds) and project their hydrodynamic "
        "and socio-economic aftermaths <i>before</i> catastrophe strikes. By combining real-time baseline telemetry, "
        "machine learning inference, GIS elevation profiles, and spatial demographics, the engine computes simulated risk "
        "escalations, displacement deltas, and municipal shelter deficits in sub-second response times."
    )
    story.append(Paragraph(exec_summary, body_style))

    # Architecture Overview Table
    story.append(Spacer(1, 6))
    story.append(Paragraph("System Architectural Flow", h2_style))

    arch_data = [
        [Paragraph("Pipeline Stage", table_cell_header), Paragraph("Component", table_cell_header), Paragraph("Key Responsibilities & Operational Logic", table_cell_header)],
        [
            Paragraph("<b>1. UI & Parameter Selection</b>", table_cell),
            Paragraph("<code>Simulation.jsx</code><br/>React 18 + MUI", table_cell),
            Paragraph("Captures geographic sector (lat/lon), scenario preset (5 types), and stress delta (+10% to +100%). Enforces strict simulation notice to prevent false public alerts.", table_cell)
        ],
        [
            Paragraph("<b>2. Route & Validation</b>", table_cell),
            Paragraph("<code>intelligenceRoutes.js</code><br/>Express + Joi/Custom", table_cell),
            Paragraph("Routes payload via <code>POST /api/v1/intelligence/simulate</code>. Sanitizes latitude [-90, 90], longitude [-180, 180], and ensures percentage adjustment is bounded.", table_cell)
        ],
        [
            Paragraph("<b>3. Baseline Telemetry</b>", table_cell),
            Paragraph("<code>riskEngine.js</code><br/>Multi-Source Fusion", table_cell),
            Paragraph("Pulls live meteorological conditions (OpenWeather), ML microservice predictions (Python FastAPI), citizen reports within 10km, and historical hazard polygons.", table_cell)
        ],
        [
            Paragraph("<b>4. Perturbation Engine</b>", table_cell),
            Paragraph("<code>simulationService.js</code><br/>Mathematical Modifiers", table_cell),
            Paragraph("Applies scenario perturbation equations to baseline metrics. Calculates differential risk scores for FLOOD, LANDSLIDE, and WILDFIRE on a 0–100 scale.", table_cell)
        ],
        [
            Paragraph("<b>5. Impact & Shelter Modeling</b>", table_cell),
            Paragraph("MongoDB Geospatial<br/><code>Habitation</code> & <code>Shelter</code>", table_cell),
            Paragraph("Filters habitations exceeding critical danger threshold (Score &ge; 50), tallies displaced citizens, computes active shelter capacity, and yields shelter bed deficit.", table_cell)
        ]
    ]

    arch_table = Table(arch_data, colWidths=[110, 120, 274])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(arch_table)

    # ---------------- PAGE 2: MATHEMATICAL FORMULATION & SCENARIOS ----------------
    story.append(PageBreak())

    story.append(Paragraph("2. Environmental Perturbation & Scenario Formulation", h1_style))
    story.append(Paragraph(
        "The simulation engine supports five distinct disaster scenarios. When an operator selects a scenario and an "
        "intensity factor &Delta; (%) via the frontend slider, the engine applies non-linear meteorological transformations "
        "to the baseline parameters:",
        body_style
    ))

    scenarios_data = [
        [Paragraph("Scenario Code", table_cell_header), Paragraph("Scenario Name & Focus", table_cell_header), Paragraph("Mathematical Transformation", table_cell_header)],
        [
            Paragraph("<b>heavy_rainfall</b>", table_cell),
            Paragraph("Rainfall Inundation Surge<br/>(+10% to +100%)", table_cell),
            Paragraph("R<sub>sim</sub> = R<sub>base</sub> &times; (1 + &Delta; / 100)<br/>H<sub>sim</sub> = min(H<sub>base</sub> &times; 1.15, 100%)", table_cell)
        ],
        [
            Paragraph("<b>extreme_rainfall</b>", table_cell),
            Paragraph("Flash Downpour & Upstream Inflow<br/>(Cloudburst Simulation)", table_cell),
            Paragraph("R<sub>sim</sub> = max(R<sub>base</sub>, 20mm) &times; (1 + &Delta; / 100)<br/>H<sub>sim</sub> = min(95%, H<sub>base</sub> + 20%)<br/>CloudCover = 95%", table_cell)
        ],
        [
            Paragraph("<b>temperature_rise</b>", table_cell),
            Paragraph("Heatwave & Evaporation Surge<br/>(+1°C to +15°C)", table_cell),
            Paragraph("T<sub>sim</sub> = T<sub>base</sub> + &Delta;°C<br/>H<sub>sim</sub> = max(H<sub>base</sub> - 2&Delta;, 10%)", table_cell)
        ],
        [
            Paragraph("<b>wildfire_conditions</b>", table_cell),
            Paragraph("Arid Wind Shift & Fuel Dryness<br/>(Fire Danger Index)", table_cell),
            Paragraph("T<sub>sim</sub> = max(T<sub>base</sub>, 35°C) + 0.5&Delta;<br/>H<sub>sim</sub> = max(15%, H<sub>base</sub> - &Delta;)<br/>W<sub>sim</sub> = W<sub>base</sub> &times; (1 + &Delta; / 200)<br/>R<sub>sim</sub> = 0 mm", table_cell)
        ],
        [
            Paragraph("<b>landslide_rainfall</b>", table_cell),
            Paragraph("Sustained Slope Saturation<br/>(Geotechnical Pore Pressure)", table_cell),
            Paragraph("R<sub>sim</sub> = max(R<sub>base</sub>, 30mm) &times; (1 + &Delta; / 100)<br/>H<sub>sim</sub> = min(95%, H<sub>base</sub> + 15%)", table_cell)
        ]
    ]

    scen_table = Table(scenarios_data, colWidths=[105, 155, 244])
    scen_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0369a1")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(scen_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("3. Hydrodynamic & Risk Modification Equations", h1_style))
    story.append(Paragraph(
        "Once perturbed environmental values (R<sub>sim</sub>, T<sub>sim</sub>, H<sub>sim</sub>, W<sub>sim</sub>) are generated, "
        "the engine executes disaster-specific sensitivity functions to compute risk deltas:",
        body_style
    ))

    eq_box = [
        [Paragraph("<b>Disaster Vector</b>", table_cell_header), Paragraph("Sensitivity & Delta Modifier Equation", table_cell_header), Paragraph("Primary Physical Drivers", table_cell_header)],
        [
            Paragraph("<b>FLOOD RISK</b>", table_cell_bold),
            Paragraph("<b>Modifier</b> = (R<sub>sim</sub> - R<sub>base</sub>) &times; 1.5 + (H<sub>sim</sub> - H<sub>base</sub>) &times; 0.3<br/><b>Score<sub>new</sub></b> = clamp(Score<sub>base</sub> + Modifier, 0, 100)", table_cell),
            Paragraph("Runoff volume, soil saturation, drainage capacity saturation.", table_cell)
        ],
        [
            Paragraph("<b>LANDSLIDE RISK</b>", table_cell_bold),
            Paragraph("<b>Modifier</b> = (R<sub>sim</sub> - R<sub>base</sub>) &times; 1.2 + (H<sub>sim</sub> - H<sub>base</sub>) &times; 0.4<br/><b>Score<sub>new</sub></b> = clamp(Score<sub>base</sub> + Modifier, 0, 100)", table_cell),
            Paragraph("Soil pore-water pressure, shear stress on slope toe.", table_cell)
        ],
        [
            Paragraph("<b>WILDFIRE RISK</b>", table_cell_bold),
            Paragraph("<b>Modifier</b> = (T<sub>sim</sub> - T<sub>base</sub>) &times; 2.0 + (H<sub>base</sub> - H<sub>sim</sub>) &times; 0.8 + (W<sub>sim</sub> - W<sub>base</sub>) &times; 1.5<br/><b>Score<sub>new</sub></b> = clamp(Score<sub>base</sub> + Modifier, 0, 100)", table_cell),
            Paragraph("Vegetation desiccating temperature, relative humidity drop, wind propagation velocity.", table_cell)
        ]
    ]

    eq_table = Table(eq_box, colWidths=[105, 245, 154])
    eq_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(eq_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Risk Classification Thresholds:", h2_style))
    risk_tiers = (
        "• <b>CRITICAL (Score &ge; 76):</b> Severe life hazard. Mandatory evacuation protocols and emergency warning.<br/>"
        "• <b>RED (51 &le; Score &le; 75):</b> High danger. Immediate relief mobilization, shelter preparation.<br/>"
        "• <b>AMBER (26 &le; Score &le; 50):</b> Elevated watch. Monitor sluice gates, standby emergency personnel.<br/>"
        "• <b>GREEN (Score &le; 25):</b> Normal baseline conditions. Low immediate threat."
    )
    story.append(Paragraph(risk_tiers, bullet_style))

    # ---------------- PAGE 3: BASELINE FUSION & MUNICIPAL IMPACT ----------------
    story.append(PageBreak())

    story.append(Paragraph("4. Baseline Unified Risk Fusion Mechanism", h1_style))
    story.append(Paragraph(
        "Before applying any hypothetical adjustment, the simulator grounds itself in empirical reality by pulling the "
        "unified risk composite from <code>riskEngine.js</code>. The baseline composite score (0–100) is determined by "
        "a weighted multi-layer formula:",
        body_style
    ))

    fusion_data = [
        [Paragraph("Component", table_cell_header), Paragraph("Weight", table_cell_header), Paragraph("Data Source & Methodology", table_cell_header)],
        [
            Paragraph("<b>Machine Learning Prediction</b>", table_cell),
            Paragraph("<b>40%</b>", table_cell_bold),
            Paragraph("FastAPI Python microservice running Random Forest & XGBoost models on live weather features (temp, humidity, rain, wind, pressure, soil moisture).", table_cell)
        ],
        [
            Paragraph("<b>Real-time Weather Risk</b>", table_cell),
            Paragraph("<b>25%</b>", table_cell_bold),
            Paragraph("Live OpenWeather API readings mapped to hazard sensitivity curves.", table_cell)
        ],
        [
            Paragraph("<b>Historical Spatial Hazards</b>", table_cell),
            Paragraph("<b>15%</b>", table_cell_bold),
            Paragraph("Geo-spatial query within 15km for historical floodplains and seismic zones in MongoDB <code>HazardZone</code> collection.", table_cell)
        ],
        [
            Paragraph("<b>Habitation Vulnerability</b>", table_cell),
            Paragraph("<b>10%</b>", table_cell_bold),
            Paragraph("Average structural vulnerability index of habitations within 10km radius.", table_cell)
        ],
        [
            Paragraph("<b>Crowdsourced Citizen Reports</b>", table_cell),
            Paragraph("<b>10%</b>", table_cell_bold),
            Paragraph("Verified citizen reports in the last 24h within 10km (each report adds 5 pts up to 20 max boost).", table_cell)
        ]
    ]

    fusion_table = Table(fusion_data, colWidths=[130, 60, 314])
    fusion_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(fusion_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("5. Municipal Impact & Shelter Deficit Modeling", h1_style))
    story.append(Paragraph(
        "A critical innovation of AapdaNetra's simulator is translating abstract risk numbers into actionable municipal logistics:",
        body_style
    ))

    impact_points = (
        "<b>1. Affected Habitations Thresholding:</b><br/>"
        "The system scans all habitations in the jurisdiction. Any habitation where:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>(CurrentRiskScore + MaxHazardChange) &ge; 50</code><br/>"
        "is flagged as an endangered settlement requiring immediate operational intervention.<br/><br/>"
        "<b>2. Displaced Population Tally:</b><br/>"
        "Aggregates total census headcount: <code>P<sub>affected</sub> = &sum; Population(h<sub>i</sub>)</code> across all endangered settlements.<br/><br/>"
        "<b>3. Live Shelter Availability:</b><br/>"
        "Queries all operational emergency shelters (status &ne; 'CLOSED'):<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>Capacity<sub>avail</sub> = &sum; (MaxCapacity<sub>j</sub> - CurrentOccupancy<sub>j</sub>)</code><br/><br/>"
        "<b>4. Projected Shelter Deficit & Auxiliary Relief Tents:</b><br/>"
        "<code>Deficit = max(0, P<sub>affected</sub> - Capacity<sub>avail</sub>)</code><br/>"
        "This metric immediately informs district commissioners exactly how many auxiliary relief tents, mobile sanitation units, and food parcels must be requisitioned."
    )
    story.append(Paragraph(impact_points, body_style))

    # ---------------- PAGE 4: FAIL-SAFE DESIGN & CONCRETE CASE STUDY ----------------
    story.append(PageBreak())

    story.append(Paragraph("6. Fail-Safe Sandbox Isolation & Life-Safety Guardrails", h1_style))
    story.append(Paragraph(
        "Because false disaster alarms cause panic, civil disruption, and alert fatigue, AapdaNetra enforces strict architectural isolation:",
        body_style
    ))

    safety_rules = (
        "• <b>Zero Sound Output:</b> The Civil Defense Siren (<code>playEmergencySiren()</code>) and browser Web Audio synthesizers are completely disarmed inside the Simulation sandbox.<br/>"
        "• <b>No Citizen Push Dispatches:</b> Simulation runs never emit push notifications, WebPush events, or WhatsApp/SMS alerts to residents.<br/>"
        "• <b>Database Read-Only Isolation:</b> Simulation calculations run purely in-memory. No synthetic risk scores are persisted into production <code>Alert</code> or <code>CitizenReport</code> tables.<br/>"
        "• <b>Mandatory Simulation Watermark:</b> All output payloads carry a mandatory disclaimer header: <i>'⚠️ SIMULATION — This is a hypothetical scenario, NOT a real prediction or forecast.'</i>"
    )
    story.append(Paragraph(safety_rules, body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("7. End-to-End Walkthrough: Delhi Yamuna +50% Surge Case Study", h1_style))
    story.append(Paragraph(
        "Consider an emergency planner in Delhi testing a severe monsoon cloudburst over the Yamuna Floodplain sector:",
        body_style
    ))

    case_data = [
        [Paragraph("Simulation Parameter", table_cell_header), Paragraph("Baseline Value", table_cell_header), Paragraph("Simulated Value", table_cell_header), Paragraph("Net Impact / Delta", table_cell_header)],
        [
            Paragraph("Target Micro-Sector", table_cell_bold),
            Paragraph("Yamuna Floodplain R-12", table_cell),
            Paragraph("Yamuna Floodplain R-12", table_cell),
            Paragraph("Sector Coordinates: 28.6139°N, 77.2090°E", table_cell)
        ],
        [
            Paragraph("Monsoon Precipitation", table_cell_bold),
            Paragraph("18.4 mm", table_cell),
            Paragraph("<b>27.6 mm</b> (+50%)", table_cell),
            Paragraph("+9.2 mm surge in 2-hour window", table_cell)
        ],
        [
            Paragraph("Relative Humidity", table_cell_bold),
            Paragraph("74%", table_cell),
            Paragraph("<b>85.1%</b>", table_cell),
            Paragraph("+11.1% near-saturation atmospheric vapor", table_cell)
        ],
        [
            Paragraph("Flood Threat Score", table_cell_bold),
            Paragraph("48 / 100 (AMBER)", table_cell),
            Paragraph("<b>65 / 100 (RED)</b>", table_cell),
            Paragraph("<b>+17 pts</b> escalation into high hazard", table_cell)
        ],
        [
            Paragraph("Endangered Habitations", table_cell_bold),
            Paragraph("2 settlements", table_cell),
            Paragraph("<b>7 settlements</b>", table_cell),
            Paragraph("+5 vulnerable settlements submerged", table_cell)
        ],
        [
            Paragraph("Affected Resident Population", table_cell_bold),
            Paragraph("4,200 citizens", table_cell),
            Paragraph("<b>22,100 citizens</b>", table_cell),
            Paragraph("+17,900 citizens requiring immediate evacuation", table_cell)
        ],
        [
            Paragraph("Available Shelter Beds", table_cell_bold),
            Paragraph("1,965 beds", table_cell),
            Paragraph("1,965 beds", table_cell),
            Paragraph("Existing static municipal shelters at full capacity", table_cell)
        ],
        [
            Paragraph("Projected Shelter Deficit", table_cell_bold),
            Paragraph("2,235 beds", table_cell),
            Paragraph("<b>20,135 beds</b>", table_cell),
            Paragraph("<b>Urgent requisition of 40+ auxiliary relief camps required</b>", table_cell)
        ]
    ]

    case_table = Table(case_data, colWidths=[110, 110, 110, 174])
    case_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0369a1")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(case_table)
    story.append(Spacer(1, 14))

    # Concluding sign-off
    sign_off = (
        "<b>Conclusion & Tactical Value:</b><br/>"
        "By simulating this scenario in advance, the district magistrate does not need to guess shelter requirements during a midnight flood. "
        "Within 2 seconds, the simulator provides exact deficit figures (20,135 beds), identifies priority low-lying settlements "
        "(Yamuna Vihar, Nala Colony), and models logistics before rainfall even commences."
    )
    story.append(Paragraph(sign_off, meta_style))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated technical PDF: {filename}")

if __name__ == "__main__":
    out_pdf = "c:\\Users\\MANISH\\Downloads\\AapdaNetra (2)\\AapdaNetra\\AapdaNetra_WhatIf_Simulation_Technical_Guide.pdf"
    build_pdf(out_pdf)
