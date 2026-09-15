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

        if self._pageNumber > 1:
            self.drawString(44, 756, "AAPDANETRA — RISK SCORE FORMULA PITCH CHEAT-SHEET")
            self.drawRightString(568, 756, "SIH PRESENTATION POCKET GUIDE")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(44, 748, 568, 748)

        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(44, 38, 568, 38)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(44, 28, "AAPDANETRA DISASTER INTELLIGENCE — OFFICIAL SIH JURY PITCH SCRIPT & TECHNICAL CARD")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(568, 28, page_str)
        self.restoreState()

def build_pdf(filename="AapdaNetra_Risk_Score_Pitch_CheatSheet.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=44,
        rightMargin=44,
        topMargin=44,
        bottomMargin=44
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a")
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#0284c7")
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#475569")
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=9,
        spaceAfter=4
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=6,
        spaceAfter=3
    )

    script_style = ParagraphStyle(
        'ScriptText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#0f172a")
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=2,
        spaceAfter=2
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    table_cell_header = ParagraphStyle(
        'TableCellHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    story = []

    # Title & Header
    story.append(Paragraph("SMART INDIA HACKATHON (SIH) — POCKET PITCH CARD", subtitle_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("How AapdaNetra Generates Risk Scores: Jury Pitch Script", title_style))
    story.append(Paragraph("Verbatim 45-Second Defense Script, Formula Deconstruction & Whiteboard Map", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceBefore=1, spaceAfter=8))

    # 1. Spoken Pitch Script Box
    story.append(Paragraph("1. The 45-Second Spoken Pitch (Word-for-Word Script for Judges)", h1_style))
    
    script_box_data = [
        [Paragraph("<b>🎙️ VERBATIM PRESENTATION SCRIPT (Memorize & Deliver with Confidence)</b>", table_cell_header)],
        [Paragraph(
            "<i>“Respected Jury, a fundamental flaw in existing disaster systems is that they rely either on <b>raw rainfall data</b> "
            "(which completely ignores local topography) or <b>opaque black-box AI</b> (which government officials cannot defend in court).<br/><br/>"
            "In <b>AapdaNetra</b>, we generate our <b>0–100 Unified Risk Score</b> using an explainable, 5-pillar composite index:<br/>"
            "&nbsp;&nbsp;<b>1. 40% Predictive AI:</b> High-precision XGBoost classifier trained on real river basin hydrology with <b>96.2% recall</b>.<br/>"
            "&nbsp;&nbsp;<b>2. 25% Real-Time Physics:</b> Live rainfall, humidity, and wind sensitivity curves from OpenWeather.<br/>"
            "&nbsp;&nbsp;<b>3. 15% Historical GIS Memory:</b> Geospatial 15km scanning of past disaster polygons in MongoDB.<br/>"
            "&nbsp;&nbsp;<b>4. 10% Infrastructure Vulnerability:</b> Mean structural fragility of habitations within 10km.<br/>"
            "&nbsp;&nbsp;<b>5. 10% Citizen Ground Truth:</b> Real-time verified crowdsourced reports from citizens on the ground.<br/><br/>"
            "If the score crosses <b>76</b>, it enters <b>CRITICAL</b> status, triggering our smart acoustic sentinel and mandatory evacuation protocols. "
            "And if external cloud AI servers drop offline during a storm, our engine <b>instantly falls back to deterministic physics rules</b> with zero downtime.”</i>",
            script_style
        )]
    ]
    script_table = Table(script_box_data, colWidths=[524])
    script_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(script_table)
    story.append(Spacer(1, 6))

    # 2. Formula Breakdown Table
    story.append(Paragraph("2. The 5-Pillar Mathematical Equation & Weight Breakdown", h1_style))
    
    pillars_data = [
        [Paragraph("Pillar Component", table_cell_header), Paragraph("Weight", table_cell_header), Paragraph("Underlying Technology / Dataset", table_cell_header), Paragraph("Strategic Justification for Judges", table_cell_header)],
        [
            Paragraph("<b>1. Predictive ML</b>", table_cell_bold),
            Paragraph("<b>40%</b>", table_cell_bold),
            Paragraph("XGBoost / Random Forest on 6 features (Rain, Water Level, Elevation, Humidity, History, Temp).", table_cell),
            Paragraph("Captures non-linear relationships that simple rainfall rules miss.", table_cell)
        ],
        [
            Paragraph("<b>2. Real-time Physics</b>", table_cell_bold),
            Paragraph("<b>25%</b>", table_cell_bold),
            Paragraph("Live OpenWeather telemetry mapped to hazard sensitivity curves.", table_cell),
            Paragraph("Immediate reaction to cloudbursts without waiting for batch runs.", table_cell)
        ],
        [
            Paragraph("<b>3. Historical GIS Memory</b>", table_cell_bold),
            Paragraph("<b>15%</b>", table_cell_bold),
            Paragraph("MongoDB 2dsphere proximity query (15km radius) on <code>HazardZone</code> polygons.", table_cell),
            Paragraph("Low-lying historic floodplains are inherently higher risk.", table_cell)
        ],
        [
            Paragraph("<b>4. Infrastructure Vulnerability</b>", table_cell_bold),
            Paragraph("<b>10%</b>", table_cell_bold),
            Paragraph("Mean socio-economic & housing fragility index within 10km.", table_cell),
            Paragraph("Kuccha houses and slums face higher threat than concrete towers.", table_cell)
        ],
        [
            Paragraph("<b>5. Citizen Ground Truth</b>", table_cell_bold),
            Paragraph("<b>10%</b>", table_cell_bold),
            Paragraph("Verified citizen reports in last 24h: <code>min(Reports &times; 5, 20)</code>.", table_cell),
            Paragraph("Direct crowdsourced ground validation of blocked drains & floods.", table_cell)
        ]
    ]
    p_table = Table(pillars_data, colWidths=[95, 45, 195, 189])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0369a1")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]))
    story.append(p_table)

    # PAGE 2: THRESHOLDS & 3 JUDGE-KILLER DEFENSES
    story.append(PageBreak())

    # 3. Action Tiers Table
    story.append(Paragraph("3. Action Tiers & Automated System Response", h1_style))
    
    tier_data = [
        [Paragraph("Score Band", table_cell_header), Paragraph("Threat Tier", table_cell_header), Paragraph("AapdaNetra Automated System Action", table_cell_header), Paragraph("Standard Operating Procedure (SOP)", table_cell_header)],
        [
            Paragraph("<b>76 – 100</b>", table_cell_bold),
            Paragraph("<font color='#dc2626'><b>CRITICAL</b></font>", table_cell),
            Paragraph("<b>Smart Acoustic Siren Sounds</b> (if user in zone) + Brevo REST Emergency Broadcast.", table_cell),
            Paragraph("<b>MANDATORY EVACUATION:</b> Move low-lying settlements to verified shelters.", table_cell)
        ],
        [
            Paragraph("<b>51 – 75</b>", table_cell_bold),
            Paragraph("<font color='#ea580c'><b>RED</b></font>", table_cell),
            Paragraph("Warning banner on dashboard; shelters placed on standby intake.", table_cell),
            Paragraph("<b>PREPARE EVACUATION:</b> Pre-position rescue boats and emergency rations.", table_cell)
        ],
        [
            Paragraph("<b>26 – 50</b>", table_cell_bold),
            Paragraph("<font color='#d97706'><b>AMBER</b></font>", table_cell),
            Paragraph("Advisory toast popup; sluice gate monitors placed on alert.", table_cell),
            Paragraph("<b>WATCH & MONITOR:</b> High-frequency sensor polling every 5 minutes.", table_cell)
        ],
        [
            Paragraph("<b>0 – 25</b>", table_cell_bold),
            Paragraph("<font color='#16a34a'><b>GREEN</b></font>", table_cell),
            Paragraph("Normal status; 100% silent audio; baseline telemetry.", table_cell),
            Paragraph("<b>ROUTINE OPS:</b> Normal administrative monitoring.", table_cell)
        ]
    ]
    tier_table = Table(tier_data, colWidths=[65, 75, 194, 190])
    tier_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(tier_table)
    story.append(Spacer(1, 8))

    # 4. Three Judge-Killer Defense Arguments
    story.append(Paragraph("4. The 3 'Judge-Killer' Defense Counter-Arguments", h1_style))
    story.append(Paragraph("When an evaluator attempts to challenge your formula, deliver these exact counter-points:", subtitle_style))
    story.append(Spacer(1, 4))

    defenses = [
        "• <b>Challenge: <i>'Why not just use an end-to-end Deep Neural Network or pure AI?'</i></b><br/>"
        "&nbsp;&nbsp;<b>Winning Counter:</b> <i>'A pure deep neural network is a black box. An IAS District Magistrate cannot order the evacuation of 50,000 residents without knowing the exact causal drivers. Our formula provides Explainable AI (XAI) feature weight decomposition: the magistrate sees that 40% comes from dam discharge and 25% from local cloudbursts, making the decision legally defensible.'</i>",
        
        "• <b>Challenge: <i>'Why not just use rainfall thresholds like the meteorological department?'</i></b><br/>"
        "&nbsp;&nbsp;<b>Winning Counter:</b> <i>'Rainfall alone is dangerously misleading. 50mm of rain on dry plains causes puddles, while the exact same 50mm on a deforested slope with saturated soil causes a devastating landslide. Our formula incorporates terrain elevation, antecedent soil moisture, and historical inundation zones.'</i>",
        
        "• <b>Challenge: <i>'What happens if the AI server loses internet during a cyclone?'</i></b><br/>"
        "&nbsp;&nbsp;<b>Winning Counter:</b> <i>'We designed for disaster resilience. If our Python microservice drops connection, our Node.js backend automatically falls back to deterministic rule-based physics equations using spatial hashing and soil saturation. The life-safety alert engine never halts.'</i>"
    ]
    for d in defenses:
        story.append(Paragraph(d, bullet_style))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 6))

    # 5. Quick Whiteboard Diagram
    story.append(Paragraph("5. Whiteboard Diagram Blueprint (Draw this in 10 Seconds)", h1_style))
    wb_text = """
    <b>Draw this exact 1-line formula on the whiteboard:</b><br/><br/>
    <code>[ Risk Score (0-100) ] = [ 40% ML Probability ] + [ 25% Live Weather Physics ] + [ 15% Historic GIS Zones ] + [ 10% Habitation Fragility ] + [ 10% Citizen Reports ]</code><br/><br/>
    <b>Then draw an arrow pointing to 76+:</b><br/>
    <code>───► If Score &ge; 76 &rarr; [ CRITICAL ] &rarr; [ Triggers Smart Acoustic Siren & Brevo Emergency Broadcast ]</code>
    """
    story.append(Paragraph(wb_text, meta_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated Pitch Cheat-Sheet PDF: {filename}")

if __name__ == "__main__":
    out_pdf = "c:\\Users\\MANISH\\Downloads\\AapdaNetra (2)\\AapdaNetra\\AapdaNetra_Risk_Score_Pitch_CheatSheet.pdf"
    build_pdf(out_pdf)
