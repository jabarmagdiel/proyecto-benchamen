from enum import Enum


class UserRole(str, Enum):
    ADMIN = "administrador"
    GERENCIA = "gerencia"
    OPERATIVE = "operativo"
    CLIENT = "cliente"



class ActivityStatus(str, Enum):
    PENDING = "pendiente"
    BLOCKED = "bloqueada"
    ASSIGNED = "asignada"
    IN_PROGRESS = "en_proceso"
    IN_REVIEW = "en_revision"
    OBSERVED = "observada"
    APPROVED = "aprobada"
    CANCELLED = "cancelada"


class ProjectStatus(str, Enum):
    PLANNED = "planificado"
    IN_PROGRESS = "en_proceso"
    PAUSED = "en_pausa"
    FINISHED = "finalizado"
    CANCELLED = "cancelado"


class ActivityType(str, Enum):
    FILMING = "filmacion"
    VIDEO_EDITING = "edicion_video"
    GRAPHIC_DESIGN = "diseno_grafico"
    PHOTOGRAPHY = "fotografia"
    COPYWRITING = "copywriting"
    SOCIAL_MEDIA = "publicacion_redes"
    CONTENT_PLANNING = "planificacion_contenido"
    CLIENT_MEETING = "reunion_cliente"
    MATERIAL_DELIVERY = "entrega_material"
    OTHER = "otro"


class EvidenceType(str, Enum):
    IMAGE = "imagen"
    FILE = "archivo"
    DRIVE_LINK = "link_drive"
    EXTERNAL_LINK = "link_externo"


class Priority(str, Enum):
    LOW = "baja"
    MEDIUM = "media"
    HIGH = "alta"
    URGENT = "urgente"


class CompanyStatus(str, Enum):
    ACTIVE = "activo"
    INACTIVE = "inactivo"


class HistoryAction(str, Enum):
    CREATED = "creada"
    ASSIGNED = "asignada"
    STATUS_CHANGED = "cambio_estado"
    EVIDENCE_UPLOADED = "evidencia_subida"
    SENT_TO_REVIEW = "enviada_revision"
    OBSERVED = "observada"
    APPROVED = "aprobada"
    CANCELLED = "cancelada"
    COMMENTED = "comentada"
    EDITED = "editada"
