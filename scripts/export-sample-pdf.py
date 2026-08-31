"""Build docs/AgencyOS-Sample-Data.pdf from SAMPLE-DATA.md + screenshots."""

from __future__ import annotations

from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image as RLImage,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "docs" / "screenshots"
OUT = ROOT / "docs" / "AgencyOS-Sample-Data.pdf"

TEAL = HexColor("#0f766e")
INK = HexColor("#0f172a")
MUTED = HexColor("#475569")
LINE = HexColor("#cbd5e1")
PAPER = HexColor("#f8fafc")

SCREEN_PAGES = [
    ("01-landing.png", "Landing — agency operating system home"),
    ("02-login.png", "Login — demo account sign-in"),
    ("03-overview.png", "Overview — Bright Smiles location snapshot"),
    ("04-contacts.png", "Contacts — seeded leads and sources"),
    ("05-contact-detail.png", "Contact timeline — Sam Rivera notes and SMS"),
    ("06-pipeline.png", "Pipeline — New patients Kanban"),
    ("07-workflows.png", "Workflows — triggers and timed steps"),
    ("08-funnel.png", "Public funnel — /f/new-patient/welcome"),
    ("09-booking.png", "Public booking — /book/bright-smiles-exam"),
    ("10-calendar.png", "Calendar — appointments and status updates"),
    ("11-billing.png", "Billing — Growth and Scale plans"),
    ("12-usage.png", "Usage ledger — SMS, email, AI rebilling"),
]


def styles():
    base = getSampleStyleSheet()
    return {
        "cover": ParagraphStyle(
            "cover",
            parent=base["Title"],
            fontName="Times-Bold",
            fontSize=26,
            textColor=TEAL,
            leading=32,
            spaceAfter=12,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Times-Bold",
            fontSize=16,
            textColor=TEAL,
            spaceBefore=14,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Times-Bold",
            fontSize=13,
            textColor=INK,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Times-Roman",
            fontSize=10,
            textColor=INK,
            leading=14,
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontName="Times-Roman",
            fontSize=9,
            textColor=MUTED,
            leading=12,
            spaceAfter=4,
        ),
        "caption": ParagraphStyle(
            "caption",
            parent=base["BodyText"],
            fontName="Times-Italic",
            fontSize=9,
            textColor=MUTED,
            alignment=1,
            spaceBefore=4,
            spaceAfter=16,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["BodyText"],
            fontName="Times-Roman",
            fontSize=8,
            textColor=INK,
            leading=11,
        ),
        "cellh": ParagraphStyle(
            "cellh",
            parent=base["BodyText"],
            fontName="Times-Bold",
            fontSize=8,
            textColor=white,
            leading=11,
        ),
    }


def table(rows, col_widths, s):
    data = [
        [Paragraph(str(c), s["cellh"] if i == 0 else s["cell"]) for c in row]
        for i, row in enumerate(rows)
    ]
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), TEAL),
                ("TEXTCOLOR", (0, 0), (-1, 0), white),
                ("BACKGROUND", (0, 1), (-1, -1), PAPER),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


def shot_flow(filename: str, caption: str, s):
    path = SHOTS / filename
    if not path.exists():
        return [Paragraph(f"[Screenshot missing: {filename}]", s["small"])]
    img = Image.open(path)
    max_w, max_h = 7.2 * inch, 5.4 * inch
    w, h = img.size
    scale = min(max_w / w, max_h / h)
    flow = RLImage(str(path), width=w * scale, height=h * scale)
    return [flow, Paragraph(caption, s["caption"])]


def build():
    SHOTS.mkdir(parents=True, exist_ok=True)
    s = styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title="MacroGen AgencyOS — Sample data and walkthrough",
        author="MacroGen AgencyOS",
    )
    story = []
    story.append(Paragraph("MacroGen AgencyOS", s["cover"]))
    story.append(Paragraph("Sample users, workflows, data catalog, and live screenshots", s["body"]))
    story.append(
        Paragraph(
            "Generated from <font face='Courier'>npm run seed</font> against local MongoDB "
            "(<font face='Courier'>agencyos</font>). Password for every demo user: <b>Demo1234!</b>",
            s["small"],
        )
    )

    story.append(Paragraph("1. Tenants", s["h1"]))
    story.append(
        Paragraph(
            "MacroGen is the white-label agency. Two client locations sit under it. "
            "Sender identity is MacroGen / hello@macrogen.local / +15555550199. "
            "Brand colors: primary #0f766e, accent #14b8a6.",
            s["body"],
        )
    )
    story.append(
        table(
            [
                ["Location", "Plan", "Timezone", "Status"],
                ["Bright Smiles Dental", "Growth $149/mo", "America/New_York", "active"],
                ["Northside Fitness", "Scale $299/mo", "America/Chicago", "active"],
            ],
            [180, 120, 130, 70],
            s,
        )
    )

    story.append(Paragraph("2. Users", s["h1"]))
    story.append(
        table(
            [
                ["Name", "Email", "Role", "Scope"],
                ["Platform Operator", "super@macrogen.local", "Super Admin", "All agencies"],
                ["Ava Chen", "admin@macrogen.local", "Agency Admin", "MacroGen"],
                ["Jordan Lee", "staff@macrogen.local", "Agency Staff", "MacroGen"],
                ["Dr. Maya Patel", "client@brightsmiles.local", "Sub-Account Admin", "Bright Smiles"],
                ["Front Desk", "front@brightsmiles.local", "Sub-Account Staff", "Bright Smiles"],
                ["Alex Morgan", "owner@northside.local", "Sub-Account Admin", "Northside Fitness"],
            ],
            [110, 170, 120, 100],
            s,
        )
    )
    story.append(Paragraph("Walkthrough login used for screenshots: admin@macrogen.local", s["small"]))

    story.append(Paragraph("3. Workflows", s["h1"]))
    story.append(
        Paragraph(
            "An event creates a workflow run, enqueues a job, then the 5-minute cron "
            "(or an inline processor after public form/booking) sends SMS/email and writes "
            "the contact timeline. STOP on inbound SMS opts the contact out.",
            s["body"],
        )
    )
    story.append(
        table(
            [
                ["Workflow", "Trigger", "Steps"],
                ["Lead follow-up", "lead.captured", "SMS now, email +1 hour"],
                ["Appointment confirmation", "appointment.created", "SMS now, email +30s"],
                ["Ask for a review", "opportunity.won", "SMS with {{reviewLink}}"],
                ["No-show rebook", "appointment.no_show", "SMS now"],
                ["Missed-call text-back", "missed_call", "SMS now"],
                ["Failed payment dunning", "payment.failed", "Email now"],
                ["Fitness lead nurture", "lead.captured (gym)", "SMS now"],
            ],
            [160, 150, 190],
            s,
        )
    )

    story.append(Paragraph("4. CRM, pipeline, public URLs", s["h1"]))
    story.append(
        table(
            [
                ["Contact", "Source", "Deal"],
                ["Sam Rivera — invisalign, funnel-lead", "Funnel (UTM meta/spring)", "Invisalign $4,500 · New"],
                ["Priya Shah — whitening", "Booking", "Whitening $890 · Booked"],
                ["Chris Ng — pt-consult", "Manual (gym)", "—"],
            ],
            [200, 160, 140],
            s,
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        table(
            [
                ["Surface", "URL"],
                ["Funnel", "/f/new-patient/welcome"],
                ["Booking", "/book/bright-smiles-exam"],
                ["Site", "/s/bright-smiles"],
                ["Course", "/c/home-care"],
                ["Review click tracker", "/r/seed-review-1"],
            ],
            [180, 320],
            s,
        )
    )
    story.append(
        Paragraph(
            "Also seeded: Growth/Scale plans, active subscription, Meta campaign "
            "“Spring new-patient”, usage ledger (24 SMS / 80 email / 12 AI), "
            "Home care basics course, and the Bright Smiles AI front-desk bot.",
            s["body"],
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("5. Live screenshots", s["h1"]))
    story.append(
        Paragraph(
            "Captured from the running app after seed, signed in as Ava Chen (Agency Admin).",
            s["small"],
        )
    )
    for filename, caption in SCREEN_PAGES:
        story.extend(shot_flow(filename, caption, s))

    def footer(canvas, _doc):
        canvas.saveState()
        canvas.setStrokeColor(TEAL)
        canvas.setLineWidth(2)
        canvas.line(0.65 * inch, letter[1] - 0.35 * inch, letter[0] - 0.65 * inch, letter[1] - 0.35 * inch)
        canvas.setFont("Times-Roman", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(0.65 * inch, 0.38 * inch, "MacroGen AgencyOS — sample data walkthrough")
        canvas.drawRightString(letter[0] - 0.65 * inch, 0.38 * inch, f"Page {canvas.getPageNumber()}")
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
