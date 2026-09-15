const fs = require('fs');
const path = require('path');
const { jsPDF } = require('../frontend/node_modules/jspdf');

function generateNdmaDossierPdf() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Colors
  const primaryColor = [15, 23, 42];      // #0f172a
  const accentColor = [2, 132, 199];       // #0284c7
  const secondaryColor = [30, 41, 59];    // #1e293b
  const mutedColor = [100, 116, 139];     // #64748b
  const borderColor = [226, 232, 240];    // #e2e8f0
  const bgBoxColor = [248, 250, 252];     // #f8fafc
  const amberColor = [217, 119, 6];       // #d97706
  const greenColor = [22, 163, 74];       // #16a34a

  function checkPageBreak(requiredSpace = 25) {
    if (y + requiredSpace > pageHeight - 18) {
      doc.addPage();
      y = margin + 10;
      drawHeaderBanner();
    }
  }

  function drawHeaderBanner() {
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(margin, 8, contentWidth, 1.2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text('AAPDANETRA DISASTER INTELLIGENCE PLATFORM — NDMA INTEGRATION & RESOURCES DOSSIER', margin, 12);
    doc.text('OFFICIAL TECHNICAL REFERENCE', pageWidth - margin, 12, { align: 'right' });
  }

  function drawSectionHeading(title, tag = '') {
    checkPageBreak(18);
    y += 4;
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(margin, y, 3.5, 9, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title, margin + 6, y + 6.8);

    if (tag) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFillColor(224, 242, 254);
      const tagWidth = doc.getTextWidth(tag) + 4;
      doc.roundedRect(pageWidth - margin - tagWidth, y + 1.5, tagWidth, 5.5, 1, 1, 'F');
      doc.text(tag, pageWidth - margin - (tagWidth / 2), y + 5.2, { align: 'center' });
    }
    y += 12;
  }

  function drawParagraph(text, isBold = false) {
    checkPageBreak(12);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += (lines.length * 4.2) + 2.5;
  }

  function drawBullet(title, desc) {
    checkPageBreak(10);
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.circle(margin + 2, y - 1, 0.9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title + ': ', margin + 5, y);

    const titleWidth = doc.getTextWidth(title + ': ');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    const remainingWidth = contentWidth - 5 - titleWidth;
    const firstLineDesc = doc.splitTextToSize(desc, contentWidth - 5);
    doc.text(firstLineDesc, margin + 5, y);
    y += (firstLineDesc.length * 4.1) + 2;
  }

  function drawCalloutBox(title, bodyText, borderColorRGB = accentColor, bgRGB = [240, 249, 255]) {
    checkPageBreak(25);
    const splitBody = doc.splitTextToSize(bodyText, contentWidth - 8);
    const boxHeight = (splitBody.length * 4.1) + 12;

    doc.setFillColor(bgRGB[0], bgRGB[1], bgRGB[2]);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(borderColorRGB[0], borderColorRGB[1], borderColorRGB[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(borderColorRGB[0], borderColorRGB[1], borderColorRGB[2]);
    doc.text(title, margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(splitBody, margin + 4, y + 10);

    y += boxHeight + 4;
  }

  function drawTable(headers, rows, colWidths) {
    checkPageBreak(25);
    const rowHeight = 7.5;
    const tableY = y;

    // Header Row
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    headers.forEach((h, idx) => {
      doc.text(h, curX + 2, y + 5);
      curX += colWidths[idx];
    });
    y += rowHeight;

    // Data Rows
    rows.forEach((row, rIdx) => {
      checkPageBreak(rowHeight + 2);
      const isEven = rIdx % 2 === 0;
      doc.setFillColor(isEven ? bgBoxColor[0] : 255, isEven ? bgBoxColor[1] : 255, isEven ? bgBoxColor[2] : 255);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

      let cellX = margin;
      row.forEach((cell, cIdx) => {
        doc.setFont('helvetica', cIdx === 0 ? 'bold' : 'normal');
        doc.setFontSize(7.6);
        doc.setTextColor(cIdx === 0 ? primaryColor[0] : secondaryColor[0], cIdx === 0 ? primaryColor[1] : secondaryColor[1], cIdx === 0 ? primaryColor[2] : secondaryColor[2]);
        const textStr = String(cell);
        doc.text(textStr, cellX + 2, y + 5);
        cellX += colWidths[cIdx];
      });
      y += rowHeight;
    });
    y += 4;
  }

  // ==========================================
  // PAGE 1: TITLE, EXECUTIVE SUMMARY & NDMA COMPLIANCE
  // ==========================================
  drawHeaderBanner();
  y += 6;

  // Title Box
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('AapdaNetra: NDMA Data Integration & Architecture Dossier', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(186, 230, 253);
  doc.text('Authoritative Datasets, CAP SMS Protocol, Civil Defense SOPs & Resource Mapping', margin + 6, y + 17);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Prepared for: Smart India Hackathon (SIH) Evaluators, NDMA/SDMA Authorities & Incident Commanders', margin + 6, y + 25);
  doc.text('Platform Version: 2.4-Production • Release Date: September 2026 • Classification: Official Technical Brief', margin + 6, y + 29.5);

  y += 40;

  // Executive Statement
  drawParagraph(
    'AapdaNetra (आपदा नेत्र) is engineered from the ground up to integrate with and extend the statutory disaster management frameworks established by the National Disaster Management Authority (NDMA), Government of India. This document details the exact NDMA guidelines, authoritative governmental telemetry pipelines, Common Alerting Protocol (CAP) compliance, and emergency resource directories utilized across the platform.',
    false
  );

  drawCalloutBox(
    'Key Takeaway: Relationship Between AapdaNetra and NDMA',
    'AapdaNetra does not replace NDMA; rather, it provides the missing predictive artificial intelligence (AI) and operational decision-support layer on top of NDMA frameworks. While existing portals (like NDMA SACHET) broadcast historical weather warnings, AapdaNetra computes sequence-to-sequence (+2h to +24h) temporal flood curves, tracks real-time shelter bed carrying capacities, and navigates citizens around inundated culverts.',
    accentColor,
    [240, 249, 255]
  );

  drawSectionHeading('1. Statutory NDMA Frameworks & Standards Implemented', 'CORE COMPLIANCE');

  drawBullet('4-Tier Risk Categorization Matrix', 'AapdaNetra strictly adopts the NDMA 4-color hazard grading framework mapped to a 0–100 threat index: Green (0–20: Normal/Baseline), Amber (21–50: Alert/SOP Tier-1), Red (51–75: Warning/SOP Tier-2), and Critical (76–100: Emergency Evacuation/SOP Tier-3).');
  drawBullet('National Hazard Atlas Alignment', 'High-risk floodplain polygons, low-lying drainage siphon contours, and landslide cut-slope hazard perimeters across Delhi, Patna, Rewa/Vindhya, Mumbai, Ranchi, and Guwahati are seeded directly from published NDMA Hazard Atlas surveys.');
  drawBullet('National Disaster Management Plan (NDMP 2019/2024)', 'Emergency response workflows follow the Incident Response System (IRS) established by NDMA guidelines, matching resource deployment stages to district magistrate control protocols.');
  drawBullet('Common Alerting Protocol (CAP / ITU-T X.1303)', 'All autonomous SMS broadcasts and emergency push sentinel alerts comply with India\'s National CAP Standard adopted by NDMA and the Department of Telecommunications (DoT).');

  // ==========================================
  // PAGE 2: DATA PIPELINES, APIS & REQUIRED RESOURCES
  // ==========================================
  checkPageBreak(100);
  drawSectionHeading('2. Authoritative Datasets, Telemetry APIs & Resources', 'DATA INGESTION');

  drawParagraph(
    'AapdaNetra synthesizes ground-truth data from six primary governmental and scientific sources into a unified geospatial intelligence vector:'
  );

  const dataSourcesHeaders = ['Source / Agency', 'Domain / Parameter', 'Update Rate', 'Integration Endpoint / Resource URL'];
  const dataSourcesRows = [
    ['NDMA (Govt of India)', 'Hazard Atlas Polygons, SOP Guidelines', 'Static / Baseline', 'https://ndma.gov.in • National Disaster Management Plan'],
    ['CWC (Central Water Comm.)', 'River Gauge telemetry, Danger Stages', '15–60 Mins', 'https://cwc.gov.in • National Hydrology Project (NHP)'],
    ['IMD (India Met Dept)', 'Doppler Radar, Precipitation, Nowcasts', '15 Mins', 'https://mausam.imd.gov.in • IMD Open Telemetry API'],
    ['ISRO Bhuvan / NRSC', 'CartoDEM, Elevation Gradients, Slope', 'Static / Geodetic', 'https://bhuvan.nrsc.gov.in • ISRO Disaster Management Support'],
    ['Census GIS India', 'Demographic density, vulnerable clusters', 'Decennial / Est.', 'https://censusindia.gov.in • Ward GIS Boundary Maps'],
    ['OpenStreetMap / Overpass', 'Road network topology, culvert locations', 'Continuous Sync', 'https://www.openstreetmap.org • Overpass QL Hydrography']
  ];
  drawTable(dataSourcesHeaders, dataSourcesRows, [42, 45, 25, 70]);

  drawSectionHeading('3. Official Emergency Helplines & Direct Routing', 'CITIZEN ACCESS');
  drawParagraph(
    'AapdaNetra’s AI Emergency Assistant and Emergency Contacts Modal embed direct, one-tap connection to verified statutory national and state disaster helplines:'
  );

  const helplineHeaders = ['Service / Organization', 'Helpline Number', 'Operational Scope', 'Mandate'];
  const helplineRows = [
    ['NDMA National Disaster Control Room', '1078', 'Pan-India 24x7', 'National Disaster Management Authority Helpline'],
    ['State Disaster Management Authority (SDMA)', '1070', 'State-Level Operations', 'State Emergency Operations Center (SEOC)'],
    ['District Disaster Management Authority (DDMA)', '1077', 'District Control Room', 'Immediate field response coordination'],
    ['Emergency Response Support System (ERSS)', '112', 'Unified Emergency', 'Police, Fire, and Ambulance unified dispatch'],
    ['Ambulance / Emergency Medical Triage', '108 / 102', 'Medical Emergency', 'Critical patient and trauma transport']
  ];
  drawTable(helplineHeaders, helplineRows, [46, 30, 36, 70]);

  // ==========================================
  // PAGE 3: CERTIFIED SOPS, CELL BROADCAST & SACHET COMPARISON
  // ==========================================
  checkPageBreak(100);
  drawSectionHeading('4. Certified NDMA Standard Operating Procedures (SOPs)', 'AI GROUNDING');

  drawParagraph(
    'AapdaNetra’s Retrieval-Augmented Generation (RAG) assistant is strictly grounded on official civil defense standard operating procedures to eliminate AI hallucinations:'
  );

  drawBullet('Flood Management SOP (NDMA Guidelines)', 'Mandates immediate household electrical mains cutoff, elevated non-perishable food storage, and mandatory relocation when gauge levels breach High Flood Level (HFL). Prohibits walking or driving through standing water deeper than 15cm.');
  drawBullet('Earthquake Safety SOP', 'Directs citizens to "Drop, Cover, and Hold On" under rigid furniture, isolate domestic LPG gas lines, avoid elevators, and await certified structural safety clearances before re-entering masonry buildings.');
  drawBullet('72-Hour Survival Kit Standard', 'Mandates minimum 3 liters of potable drinking water per person per day, water purification tablets (Halazone/chlorine), waterproof pouches for Aadhaar/property deeds, high-calorie food, battery-powered transistor radios, and basic trauma first-aid dressings.');

  drawSectionHeading('5. Comparative Analysis: AapdaNetra vs. NDMA SACHET Portal', 'INNOVATION MATRIX');

  const sachetHeaders = ['Capability / Feature', 'NDMA SACHET Portal', 'AapdaNetra Platform (Our System)'];
  const sachetRows = [
    ['Alert Nature', 'Passive broadcast of issued weather alerts', 'Predictive hydrodynamic simulation (+2h to +24h)'],
    ['Machine Learning', 'Rule-based alert relaying from IMD feeds', 'Sequence-to-Sequence GRU Neural Networks + XGBoost'],
    ['Shelter Intelligence', 'Static list of government buildings', 'Dynamic vacancy tracking with carry-capacity deficit alerts'],
    ['Evacuation Routing', 'General safety tips; static directions', 'Turn-by-turn flood-safe routing bypassing submerged culverts'],
    ['Citizen Interface', 'Static English/Hindi alert push notification', 'Interactive Multilingual AI Assistant (Hindi, Hinglish, Bengali, Assamese)'],
    ['Explainable AI (XAI)', 'Not available (Black-box warning)', 'SHAP factor decomposition explaining WHY risks are rising'],
    ['"What-If?" Simulation', 'Not available', 'Interactive stress-testing sandbox with real-time shelter deficit modeling']
  ];
  drawTable(sachetHeaders, sachetRows, [40, 68, 74]);

  drawCalloutBox(
    'Institutional Recommendation & Hackathon Pitch Summary',
    'AapdaNetra is architected as an operational force-multiplier for NDMA and SDMA officials. By ingesting existing NDMA hazard polygons and IMD radar feeds, it automates the complex cognitive workload of incident commanders—calculating exactly how many shelter beds will be short, which culverts will drown, and sending verified cell broadcast SMS to endangered citizens.',
    [22, 163, 74],
    [240, 253, 244]
  );

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text('AapdaNetra AI Platform • Developed for Smart India Hackathon (SIH) 2024-2026 • Grounded on NDMA Guidelines', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const outputPathRoot = path.join(__dirname, '..', 'AapdaNetra_NDMA_Integration_and_Resources_Dossier.pdf');
  const outputPathPublic = path.join(__dirname, '..', 'frontend', 'public', 'AapdaNetra_NDMA_Integration_and_Resources_Dossier.pdf');

  const pdfData = doc.output('arraybuffer');
  fs.writeFileSync(outputPathRoot, Buffer.from(pdfData));
  fs.writeFileSync(outputPathPublic, Buffer.from(pdfData));

  console.log('SUCCESS: PDF Generated at:', outputPathRoot);
  console.log('SUCCESS: PDF Copied to public web at:', outputPathPublic);
}

generateNdmaDossierPdf();
