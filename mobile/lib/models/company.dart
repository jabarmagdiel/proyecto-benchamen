import 'package:flutter/foundation.dart';

class Company {
  final int id;
  final String name;
  final String? contactPerson;
  final String? phone;
  final String? email;
  final String? address;
  final String? description;
  final String? dashboardUrl;
  final bool isActive;
  final String createdAt;

  Company({
    required this.id,
    required this.name,
    this.contactPerson,
    this.phone,
    this.email,
    this.address,
    this.description,
    this.dashboardUrl,
    this.isActive = true,
    required this.createdAt,
  });

  factory Company.fromJson(Map<String, dynamic> json) {
    return Company(
      id: json['id'],
      name: json['name'],
      contactPerson: json['contact_person'],
      phone: json['phone'],
      email: json['email'],
      address: json['address'],
      description: json['description'],
      dashboardUrl: json['dashboard_url'],
      isActive: json['is_active'] ?? true,
      createdAt: json['created_at'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'contact_person': contactPerson,
      'phone': phone,
      'email': email,
      'address': address,
      'description': description,
      'dashboard_url': dashboardUrl,
      'is_active': isActive,
    };
  }
}
