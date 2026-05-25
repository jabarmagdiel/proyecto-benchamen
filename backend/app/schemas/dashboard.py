from typing import List
from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class UserActivityCount(BaseModel):
    user_id: int
    user_name: str
    count: int


class LateActivity(BaseModel):
    id: int
    title: str
    deadline: str
    status: str
    assigned_user_name: str
    project_name: str
    company_name: str
    days_late: int


class DashboardStats(BaseModel):
    total_companies: int
    total_projects: int
    active_projects: int
    pending_activities: int
    in_progress_activities: int
    in_review_activities: int
    observed_activities: int
    approved_activities: int
    late_activities: int
    cancelled_activities: int


class DashboardFull(BaseModel):
    stats: DashboardStats
    activity_by_status: List[StatusCount]
    activity_by_user: List[UserActivityCount]
    late_activities: List[LateActivity]
