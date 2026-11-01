import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_pdf():
    output_path = r"C:\Users\USER\.gemini\antigravity\scratch\device-tracker\BPE_Device_Tracker_Guide.pdf"
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#14532d")
    secondary_green = colors.HexColor("#16a34a")
    bg_light_green = colors.HexColor("#f0fdf4")
    dark_gray = colors.HexColor("#1f2937")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4b5563"),
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=dark_gray,
        spaceAfter=5
    )

    bold_body = ParagraphStyle(
        'BoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#15803d")
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("BPE Office Device Tracker", title_style))
    story.append(Paragraph("Bureau of Public Enterprises, Abuja — ICT Unit Project Guide & Kid-Simple Walkthrough", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=secondary_green, spaceBefore=0, spaceAfter=10))

    # Section 1: Secret Keys
    story.append(Paragraph("1. The Secret Keys (Login Details)", h2_style))
    story.append(Paragraph("There are two keys to enter the clubhouse, depending on who is logging in:", body_style))

    keys_data = [
        [
            Paragraph("<b>👑 Boss Key (Admin)</b>", bold_body),
            Paragraph("<b>Username:</b> <font color='#16a34a'><b>admin</b></font><br/><b>Password:</b> <font color='#16a34a'><b>Admin@123</b></font>", body_style),
            Paragraph("Full access. Can view, add, edit, and throw away (delete) old gadgets.", body_style)
        ],
        [
            Paragraph("<b>🛠️ Helper Key (Staff)</b>", bold_body),
            Paragraph("<b>Username:</b> <font color='#2563eb'><b>staff</b></font><br/><b>Password:</b> <font color='#2563eb'><b>Staff@123</b></font>", body_style),
            Paragraph("Operational access. Can view, add, and move gadgets. <b>Delete is blocked!</b>", body_style)
        ]
    ]

    t_keys = Table(keys_data, colWidths=[130, 160, 230])
    t_keys.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f9fafb")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e5e7eb")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_keys)
    story.append(Spacer(1, 8))

    # Section 2: How to Use
    story.append(Paragraph("2. How to Use the Device Tracker (Like a Fun Game!)", h2_style))

    steps = [
        ("Step 1: Open the Clubhouse Door (Login)", "Go to http://localhost:5173. Type your secret key, or tap the helper demo buttons on the page to auto-fill them."),
        ("Step 2: Check the Scoreboard (Dashboard)", "See the big numbers of all 20 devices. Look at the 'Action Required' list to spot devices with a boo-boo (Faulty or Under Repair) so you can fix them!"),
        ("Step 3: The Big Toy Chest (Devices Directory)", "Click 'Devices' on the left menu. You can search by device name, person, or room. Tap 'Export CSV' to download the entire list into an Excel file."),
        ("Step 4: Putting a New Toy in the Chest (+ Add Device)", "Tap the '+ Add Device' button. Give it a name, room, and a special Asset Tag sticker (like BPE-ICT-001). No two toys can have the same sticker!"),
        ("Step 5: Moving or Fixing Toys (Edit & Audit Diary)", "When John takes a laptop to Office 305, click Edit and type the new room. A tiny digital detective records in a diary who moved it, what was changed, and what time!")
    ]

    for title, desc in steps:
        step_table = Table([[
            Paragraph(f"<b>{title}</b><br/>{desc}", body_style)
        ]], colWidths=[520])
        step_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light_green),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#86efac")),
            ('LINELEFT', (0,0), (-1,-1), 3, secondary_green),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(step_table)
        story.append(Spacer(1, 4))

    # Section 3: How it Was Coded
    story.append(Spacer(1, 4))
    story.append(Paragraph("3. How Was It Coded? (The 3 Best Friends)", h2_style))
    story.append(Paragraph("The software was built like three friendly helpers working together:", body_style))

    arch_data = [
        [
            Paragraph("<b>🎨 The Face (Frontend)</b>", bold_body),
            Paragraph("<b>React + Vite:</b> The pretty picture, buttons, cards, and charts you click on. It runs instantly without reloading the page.", body_style)
        ],
        [
            Paragraph("<b>🏃 The Messenger (Backend)</b>", bold_body),
            Paragraph("<b>Express.js (Node.js):</b> Runs between your screen and database. It checks your secret badge (JWT) and stops Staff from deleting things.", body_style)
        ],
        [
            Paragraph("<b>📖 The Big Memory Notebook (Database)</b>", bold_body),
            Paragraph("<b>SQLite (better-sqlite3):</b> A file stored on your PC (<code>devices.db</code>) that never forgets anything, even when the computer is turned off.", body_style)
        ]
    ]

    t_arch = Table(arch_data, colWidths=[150, 370])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    # Section 4: File Location
    story.append(Paragraph("4. Project File Location", h2_style))
    loc_table = Table([[
        Paragraph("<b>Project Folder Path:</b><br/><font color='#14532d'><b>C:\\Users\\USER\\.gemini\\antigravity\\scratch\\device-tracker</b></font>", body_style)
    ]], colWidths=[520])
    loc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#86efac")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(loc_table)

    # Build PDF
    doc.build(story)
    print("PDF GENERATION SUCCESSFUL")

if __name__ == '__main__':
    generate_pdf()

