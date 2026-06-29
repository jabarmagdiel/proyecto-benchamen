import 'package:flutter/foundation.dart';

class Project {
  final int id;
  final int companyId;
  final String? companyName;
  final String name;
  final String? description;
  final String? startDate;
  final String? deadline;
  final String status;
  final String priority;
  final int? mainResponsibleId;
  final String? mainResponsibleName;
  final String createdAt;

  Project({
    required this.id,
    required this.companyId,
    this.companyName,
    required this.name,
    this.description,
    this.startDate,
    this.deadline,
    this.status = 'planificado',
    this.priority = 'media',
    this.mainResponsibleId,
    this.mainResponsibleName,
    required this.createdAt,
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'],
      companyId: json['company_id'],
      companyName: json['company_name'],
      name: json['name'],
      description: json['description'],
      startDate: json['start_date'],
      deadline: json['deadline'],
      status: json['status'] ?? 'planificado',
      priority: json['priority'] ?? 'media',
      mainResponsibleId: json['main_responsible_id'],
      mainResponsibleName: json['main_responsible_name'],
      createdAt: json['created_at'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'company_id': companyId,
      'name': name,
      'description': description,
      'start_date': startDate,
      'deadline': deadline,
      'status': status,
      'priority': priority,
      'main_responsible_id': mainResponsibleId,
    };
  }
}
