import 'package:flutter/foundation.dart';

class PackageModel {
  final int id;
  final String name;
  final String? description;
  final num price;
  final String billingCycle;
  final String createdAt;

  PackageModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.billingCycle = 'mensual',
    required this.createdAt,
  });

  factory PackageModel.fromJson(Map<String, dynamic> json) {
    return PackageModel(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      price: json['price'] ?? 0.0,
      billingCycle: json['billing_cycle'] ?? 'mensual',
      createdAt: json['created_at'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'price': price,
      'billing_cycle': billingCycle,
    };
  }
}
