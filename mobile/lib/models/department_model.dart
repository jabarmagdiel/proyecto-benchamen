import 'package:flutter/foundation.dart';

class DepartmentModel {
  final int id;
  final String name;
  final String? description;
  final String createdAt;

  DepartmentModel({
    required this.id,
    required this.name,
    this.description,
    required this.createdAt,
  });

  factory DepartmentModel.fromJson(Map<String, dynamic> json) {
    return DepartmentModel(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      createdAt: json['created_at'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
    };
  }
}
