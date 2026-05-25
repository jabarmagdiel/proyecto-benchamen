import io
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.responses import StreamingResponse

from app.models.activity import Activity
from app.models.project import Project
from app.models.company import Company
from app.models.user import User
from app.utils.enums import ActivityStatus

# ─── Diccionarios de traducción a Español ──────────────────────────────────────
ACTIVITY_TYPE_LABELS = {
    "filmacion": "Filmación",
    "edicion_video": "Edición de Video",
    "diseno_grafico": "Diseño Gráfico",
    "fotografia": "Fotografía",
    "copywriting": "Copywriting",
    "publicacion_redes": "Publicación en Redes",
    "planificacion_contenido": "Planificación de Contenido",
    "reunion_cliente": "Reunión con Cliente",
    "entrega_material": "Entrega de Material",
    "otro": "Otro",
}

ACTIVITY_STATUS_LABELS = {
    "pendiente": "Pendiente",
    "asignada": "Asignada",
    "en_proceso": "En Proceso",
    "en_revision": "En Revisión",
    "observada": "Observada",
    "aprobada": "Aprobada",
    "cancelada": "Cancelada",
}

PRIORITY_LABELS = {
    "baja": "Baja",
    "media": "Media",
    "alta": "Alta",
    "urgente": "Urgente",
}


def _get_activities_data(
    db: Session,
    company_id: Optional[int] = None,
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    q = (
        db.query(
            Activity.id,
            Activity.title,
            Activity.activity_type,
            Activity.priority,
            Activity.status,
            Activity.deadline,
            Activity.created_at,
            User.name.label("assigned_user"),
            Project.name.label("project"),
            Company.name.label("company"),
        )
        .outerjoin(User, User.id == Activity.assigned_user_id)
        .join(Project, Project.id == Activity.project_id)
        .join(Company, Company.id == Project.company_id)
    )
    if company_id:
        q = q.filter(Company.id == company_id)
    if project_id:
        q = q.filter(Activity.project_id == project_id)
    if status:
        q = q.filter(Activity.status == status)
    if date_from:
        q = q.filter(Activity.created_at >= date_from)
    if date_to:
        q = q.filter(Activity.created_at <= date_to)
    return q.order_by(Activity.created_at.desc()).all()


def export_activities_excel(db: Session, **filters) -> StreamingResponse:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment

    rows = _get_activities_data(db, **filters)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Actividades"

    headers = ["ID", "Título", "Tipo", "Prioridad", "Estado", "Fecha Límite", "Responsable", "Proyecto", "Empresa", "Fecha Creación"]
    header_fill = PatternFill(start_color="7C3AED", end_color="7C3AED", fill_type="solid")

    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")
        ws.column_dimensions[cell.column_letter].width = 18

    status_colors = {
        "aprobada": "22C55E", "en_proceso": "7C3AED", "en_revision": "3B82F6",
        "observada": "F59E0B", "cancelada": "EF4444", "pendiente": "9CA3AF", "asignada": "6366F1",
    }

    for r, row in enumerate(rows, 2):
        type_val = row.activity_type.value if hasattr(row.activity_type, "value") else str(row.activity_type)
        priority_val = row.priority.value if hasattr(row.priority, "value") else str(row.priority)
        status_val = row.status.value if hasattr(row.status, "value") else str(row.status)

        type_label = ACTIVITY_TYPE_LABELS.get(type_val, type_val)
        priority_label = PRIORITY_LABELS.get(priority_val, priority_val)
        status_label = ACTIVITY_STATUS_LABELS.get(status_val, status_val)

        data = [
            row.id,
            row.title,
            type_label,
            priority_label,
            status_label,
            str(row.deadline) if row.deadline else "",
            row.assigned_user or "-",
            row.project,
            row.company,
            str(row.created_at.date())
        ]
        for col, val in enumerate(data, 1):
            cell = ws.cell(row=r, column=col, value=val)
            if col == 5:  # Columna de Estado
                color = status_colors.get(status_val, "9CA3AF")
                cell.fill = PatternFill(start_color=color, end_color=color, fill_type="solid")
                cell.font = Font(color="FFFFFF", bold=True)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=actividades_{date.today()}.xlsx"},
    )


def export_activities_pdf(db: Session, **filters) -> StreamingResponse:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm

    rows = _get_activities_data(db, **filters)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), leftMargin=1*cm, rightMargin=1*cm, topMargin=2*cm, bottomMargin=1*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Heading1"], textColor=colors.HexColor("#7C3AED"), spaceAfter=12)

    story = [
        Paragraph("Reporte de Actividades", title_style),
        Paragraph(f"Generado: {date.today()}", styles["Normal"]),
        Spacer(1, 0.5*cm),
    ]

    headers = ["ID", "Título", "Tipo", "Estado", "Prioridad", "Responsable", "Proyecto", "Empresa", "Fecha Límite"]
    data = [headers]
    for row in rows:
        type_val = row.activity_type.value if hasattr(row.activity_type, "value") else str(row.activity_type)
        priority_val = row.priority.value if hasattr(row.priority, "value") else str(row.priority)
        status_val = row.status.value if hasattr(row.status, "value") else str(row.status)

        type_label = ACTIVITY_TYPE_LABELS.get(type_val, type_val)
        priority_label = PRIORITY_LABELS.get(priority_val, priority_val)
        status_label = ACTIVITY_STATUS_LABELS.get(status_val, status_val)

        data.append([
            str(row.id),
            row.title[:35],
            type_label,
            status_label,
            priority_label,
            row.assigned_user or "-",
            row.project[:20],
            row.company[:20],
            str(row.deadline) if row.deadline else "-",
        ])

    t = Table(data, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7C3AED")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F3FF")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=actividades_{date.today()}.pdf"},
    )
