import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

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
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 760, "AapdaNetra — Smart India Hackathon (SIH) Prototype Video Script")
            self.drawRightString(572, 760, "Confidential - SIH Prototype Guide")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, 752, 572, 752)
        
        # Footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        
        self.drawString(40, 30, "AapdaNetra: AI-Powered Disaster Intelligence & Emergency Command System")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 30, page_text)
        self.restoreState()


def build_pdf(filename="AapdaNetra_SIH_Prototype_Video_Script.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0284C7'),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#0369A1'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    body_bold = ParagraphStyle(
        'Body_Bold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    cell_time = ParagraphStyle(
        'CellTime',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#0284C7')
    )

    cell_action = ParagraphStyle(
        'CellAction',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor('#0F172A')
    )

    cell_voice = ParagraphStyle(
        'CellVoice',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor('#334155')
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.2,
        leading=11.5,
        textColor=colors.HexColor('#1E293B')
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("AapdaNetra — SIH Prototype Video Script", title_style))
    story.append(Paragraph("AI-Powered Disaster Intelligence & Emergency Command System | Submission Guide", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284C7"), spaceAfter=10))

    # Production Specs Card
    specs_data = [
        [
            Paragraph("<b>Target Duration:</b> 3 to 4 Minutes", body_style),
            Paragraph("<b>Resolution:</b> 1080p FHD (1920x1080, 60fps)", body_style),
            Paragraph("<b>Browser Mode:</b> Fullscreen (F11, 100% Zoom)", body_style)
        ],
        [
            Paragraph("<b>Audio:</b> Clear narration, neutral background", body_style),
            Paragraph("<b>Target Users:</b> NDRF, SDMA, District Admins", body_style),
            Paragraph("<b>Core Goal:</b> Demonstrate Live Working Tech", body_style)
        ]
    ]
    specs_table = Table(specs_data, colWidths=[175, 175, 182])
    specs_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0F9FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#BAE6FD')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0F2FE')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(specs_table)
    story.append(Spacer(1, 12))

    # SECTION 1: MASTER TIME-STAMPED SCRIPT TABLE
    story.append(Paragraph("1. Master Time-Stamped Walkthrough Script (4-Minute Full Flow)", h1_style))
    story.append(Paragraph("Follow this step-by-step cue table. Synchronize your cursor and page transitions strictly with the spoken voiceover dialogue.", body_style))
    story.append(Spacer(1, 6))

    script_headers = [
        Paragraph("Timestamp", table_header_style),
        Paragraph("On-Screen Action / Visuals", table_header_style),
        Paragraph("Voiceover Dialogue / What to Say", table_header_style)
    ]

    script_rows = [
        [
            Paragraph("<b>0:00 – 0:30</b><br/>(30 sec)", cell_time),
            Paragraph("<b>Opening Slide & Live Context:</b><br/>• Display AapdaNetra splash title / logo.<br/>• Transition immediately to the live application in dark mode.<br/>• Show the breadcrumb & navigation bar.", cell_action),
            Paragraph('"Greetings Respected Evaluators and Jury Members. During climate disasters like flash floods, landslides, and cyclones, the first few hours—the Golden Hours—determine life and death. Today, emergency authorities face fragmented data, delayed early warnings, and overwhelmed citizen helplines.<br/><br/>To bridge this critical operational gap, we present <b>AapdaNetra</b>—an end-to-end, AI-powered disaster intelligence and emergency response platform built for NDRF, SDMAs, district authorities, and citizens."', cell_voice)
        ],
        [
            Paragraph("<b>0:30 – 1:00</b><br/>(30 sec)", cell_time),
            Paragraph("<b>Command Dashboard:</b><br/>• Navigate to <code>/dashboard</code>.<br/>• Hover over Active Disasters, Severe Alerts, Weather Telemetry, and Rapid Action Cards.<br/>• Point cursor to the live time-stamped activity feed.", cell_action),
            Paragraph('"Here is the <b>Unified Command Dashboard</b>. At a single glance, operational commanders can monitor real-time disaster metrics, active regional alerts, and live meteorological feeds.<br/><br/>The system integrates autonomous anomaly detection that continuously ingests weather telemetry to trigger early warning signals before a catastrophe strikes."', cell_voice)
        ],
        [
            Paragraph("<b>1:00 – 1:40</b><br/>(40 sec)", cell_time),
            Paragraph("<b>Interactive GIS Map:</b><br/>• Navigate to <code>/disaster-map</code>.<br/>• Zoom into high-risk district cluster.<br/>• Toggle layer controls: flood zones, shelter pins, and trauma centers.<br/>• Click an active incident pin to view popup telemetry.", cell_action),
            Paragraph('"Next, our <b>Interactive GIS Disaster Map</b>. Using geospatial intelligence, AapdaNetra visualizes multi-hazard danger zones alongside critical infrastructure.<br/><br/>Commanders can toggle live flood plains, active shelters with real-time bed capacity, and emergency medical trauma centers. This spatial awareness eliminates blind spots and ensures relief materials reach exact coordinates without delay."', cell_voice)
        ],
        [
            Paragraph("<b>1:40 – 2:20</b><br/>(40 sec)", cell_time),
            Paragraph("<b>Risk Analysis & Decision Deck:</b><br/>• Navigate to <code>/risk-analysis</code>.<br/>• Point to the 4 Top HUD Cards (Runoff Risk, Saturation, Population, Vulnerability).<br/>• Click through the <b>7 Decision Stepper tabs</b>.<br/>• Scroll to What-If simulation slider and click <i>Simulate Impact</i>.", cell_action),
            Paragraph('"Moving to our core intelligence engine: <b>Risk Analysis & Decision Pipeline</b>. Instead of just displaying raw telemetry, AapdaNetra executes an automated <b>7-Tier Response Pipeline</b>—calculating exact trigger thresholds for NDRF battalion mobilization, siren dispatch, safe relief corridors, and helicopter airdrops.<br/><br/>With our built-in <b>What-If Simulator</b>, officers can stress-test rainfall intensity and dam discharge scenarios to forecast downstream inundation hours in advance."', cell_voice)
        ],
        [
            Paragraph("<b>2:20 – 3:00</b><br/>(40 sec)", cell_time),
            Paragraph("<b>Citizen Reports & AI Vision:</b><br/>• Navigate to <code>/citizen-reports</code>.<br/>• View verified citizen submissions.<br/>• Click on an incident with an uploaded photo showing the <b>YOLOv8 bounding box</b> (e.g., structural damage, flood debris).", cell_action),
            Paragraph('"Citizen participation is critical. Through our <b>Citizen Reporting Module</b>, verified ground reports are fed into our <b>AI Vision and NLP Pipeline</b>.<br/><br/>Our YOLOv8 model inspects citizen-uploaded disaster images to detect structural damage, road blockages, and water levels in real-time, filtering out false rumors and automatically prioritizing life-threatening distress calls for the rescue teams."', cell_voice)
        ],
        [
            Paragraph("<b>3:00 – 3:30</b><br/>(30 sec)", cell_time),
            Paragraph("<b>Multilingual AI Copilot:</b><br/>• Navigate to <code>/ai-assistant</code>.<br/>• Send prompt: <i>\"Flood level rising near Sector 62, where is the nearest safe shelter and helpline?\"</i><br/>• Highlight instant structured response with shelter details.", cell_action),
            Paragraph('"For citizens and field responders, we built the <b>AapdaNetra AI Copilot</b>. Supporting multilingual and Hinglish natural language queries, citizens can instantly discover their nearest evacuation routes and open shelters, while field officers can query live situational databases using conversational AI."', cell_voice)
        ],
        [
            Paragraph("<b>3:30 – 4:00</b><br/>(30 sec)", cell_time),
            Paragraph("<b>Tech Stack & Closing Slide:</b><br/>• Show System Architecture slide or terminal microservice health.<br/>• Display Team Name, Problem Statement ID, and College / Organization details.", cell_action),
            Paragraph('"Under the hood, AapdaNetra is engineered with a modular, highly scalable microservices architecture: a React 18 frontend, a resilient Node.js backend with automated telemetry ingestion, and a Python FastAPI service hosting XGBoost, GRU time-series forecasting, and YOLOv8 computer vision models.<br/><br/>AapdaNetra aligns directly with the Sendai Framework for Disaster Risk Reduction and India\'s vision for proactive, tech-driven disaster resilience. Thank you!"', cell_voice)
        ]
    ]

    master_table_data = [script_headers] + script_rows
    col_widths = [65, 175, 292]
    master_table = Table(master_table_data, colWidths=col_widths, repeatRows=1)
    
    # Table Styling
    ts = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]

    # Alternating row colors
    for r in range(1, len(master_table_data)):
        bg = colors.HexColor('#F8FAFC') if r % 2 == 1 else colors.white
        ts.append(('BACKGROUND', (0, r), (-1, r), bg))

    master_table.setStyle(TableStyle(ts))
    story.append(master_table)
    story.append(Spacer(1, 14))

    # SECTION 2: 3-MINUTE CONDENSED CUT (FOR STRICT TIMER CUTOFFS)
    story.append(KeepTogether([
        Paragraph("2. Rapid 3-Minute Compressed Script (Strict Timer Mode)", h1_style),
        Paragraph("If the hackathon rules enforce a strict 3-minute limit (180 seconds), use this condensed pacing:", body_style),
        Spacer(1, 6)
    ]))

    fast_data = [
        [
            Paragraph("Time Block", table_header_style),
            Paragraph("Module / Feature", table_header_style),
            Paragraph("High-Impact One-Liner Script", table_header_style)
        ],
        [
            Paragraph("0:00 - 0:25", cell_time),
            Paragraph("Introduction & Problem", cell_action),
            Paragraph('"Disasters cause thousands of casualties and immense economic loss because disaster response is reactive rather than predictive. AapdaNetra transforms emergency management into an AI-driven, proactive command system."', cell_voice)
        ],
        [
            Paragraph("0:25 - 0:55", cell_time),
            Paragraph("Dashboard & GIS Map", cell_action),
            Paragraph('"Our Unified Dashboard integrates live sensor telemetry, while our Interactive GIS Map renders real-time hazard inundation overlays alongside active shelter and hospital capacities."', cell_voice)
        ],
        [
            Paragraph("0:55 - 1:40", cell_time),
            Paragraph("Risk Engine & 7 Decisions", cell_action),
            Paragraph('"AapdaNetra\'s core innovation is its automated 7-Tier Operational Decision Pipeline—dynamically calculating evacuation radii, NDRF battalion dispatch, and relief supply logistics with built-in What-If simulation."', cell_voice)
        ],
        [
            Paragraph("1:40 - 2:20", cell_time),
            Paragraph("Citizen Vision AI & Copilot", cell_action),
            Paragraph('"Ground photos uploaded by citizens are triaged instantly using YOLOv8 computer vision to verify structural damage and flood levels, while our Multilingual AI Copilot guides citizens to safe shelters in real-time."', cell_voice)
        ],
        [
            Paragraph("2:20 - 3:00", cell_time),
            Paragraph("Tech Stack & Closing", cell_action),
            Paragraph('"Powered by React, Node.js, and a Python FastAPI ML microservice with XGBoost and PyTorch, AapdaNetra empowers authorities to save lives during the golden hour. Thank you!"', cell_voice)
        ]
    ]

    fast_table = Table(fast_data, colWidths=[65, 140, 327], repeatRows=1)
    fts = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0369A1')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for r in range(1, len(fast_data)):
        bg = colors.HexColor('#F0FDF4') if r % 2 == 1 else colors.white
        fts.append(('BACKGROUND', (0, r), (-1, r), bg))
    fast_table.setStyle(TableStyle(fts))
    story.append(fast_table)
    story.append(Spacer(1, 14))

    # SECTION 3: JURY FAQ & HIGH-SCORING ANSWERS
    story.append(KeepTogether([
        Paragraph("3. Jury Evaluation Cheat Sheet (Anticipated Judge Questions)", h1_style),
        Paragraph("Be prepared to answer these technical and operational questions if evaluators conduct an interactive Q&A:", body_style),
        Spacer(1, 6)
    ]))

    faq_data = [
        [
            Paragraph("Q1: How does AapdaNetra handle fake or duplicate citizen reports?", body_bold),
            Paragraph("<b>Answer:</b> We apply a dual-stage verification pipeline: First, geospatial clustering aggregates multiple reports from the same radius. Second, our computer vision model (YOLOv8) cross-verifies image metadata and visual features (structural debris, water submersion) to assign a credibility score before dispatching alerts.", body_style)
        ],
        [
            Paragraph("Q2: What happens if cellular networks and power fail during a disaster?", body_bold),
            Paragraph("<b>Answer:</b> The system is built with offline-first resilience: local edge caching caches shelter coordinates, offline deterministic fallback protocols kick in for decision making, and localized ad-hoc mesh networking can sync data when backhaul connects.", body_style)
        ],
        [
            Paragraph("Q3: How are the 7 Operational Decisions calculated?", body_bold),
            Paragraph("<b>Answer:</b> Each decision is governed by SOP-aligned mathematical trigger matrices based on NDMA guidelines (e.g., rainfall rate > 120mm/hr combined with soil saturation > 85% automatically triggers Evacuate Red Zone & NDRF Mobilization).", body_style)
        ],
        [
            Paragraph("Q4: What models power your predictive ML pipeline?", body_bold),
            Paragraph("<b>Answer:</b> Multi-hazard risk prediction uses XGBoost and Random Forest classifiers; 24-hour flood progression forecasting utilizes GRU (Gated Recurrent Unit) neural networks; and damage detection is performed by fine-tuned YOLOv8.", body_style)
        ]
    ]

    faq_table = Table(faq_data, colWidths=[200, 332])
    faq_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(faq_table)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {os.path.abspath(filename)}")

if __name__ == "__main__":
    build_pdf()
