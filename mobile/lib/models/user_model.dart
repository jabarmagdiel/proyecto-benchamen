import 'package:flutter/foundation.dart';

class UserModel {
  final int id;
  final String email;
  final String name;
  final String role;
  final bool isActive;
  final int? companyId;
  final int? departmentId;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.isActive = true,
    this.companyId,
    this.departmentId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      role: json['role'] ?? 'operativo',
      isActive: json['is_active'] ?? true,
      companyId: json['company_id'],
      departmentId: json['department_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'name': name,
      'role': role,
      'is_active': isActive,
      'company_id': companyId,
      'department_id': departmentId,
    };
  }
}
