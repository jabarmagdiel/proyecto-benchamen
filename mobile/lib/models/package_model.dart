class PackageItemModel {
  final int? id;
  final String name;
  final String itemType; // 'por_cantidad' o 'indefinido'
  final int quantity;

  PackageItemModel({
    this.id,
    required this.name,
    this.itemType = 'por_cantidad',
    this.quantity = 0,
  });

  factory PackageItemModel.fromJson(Map<String, dynamic> json) {
    return PackageItemModel(
      id: json['id'],
      name: json['name'] ?? '',
      itemType: json['item_type'] ?? 'por_cantidad',
      quantity: json['quantity'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'item_type': itemType,
      'quantity': quantity,
    };
  }
}

class PackageModel {
  final int id;
  final String name;
  final String? description;
  final String offeringType; // 'package' o 'individual_service'
  final String category; // 'marketing', 'diseno', 'software'
  final String priceType; // 'fixed' o 'custom_text'
  final String? priceText;
  final num price;
  final bool isActive;
  final List<PackageItemModel> items;
  final String createdAt;

  PackageModel({
    required this.id,
    required this.name,
    this.description,
    this.offeringType = 'package',
    this.category = 'marketing',
    this.priceType = 'fixed',
    this.priceText = 'Por definir en reunión',
    required this.price,
    this.isActive = true,
    this.items = const [],
    required this.createdAt,
  });

  factory PackageModel.fromJson(Map<String, dynamic> json) {
    var rawItems = json['items'] as List? ?? [];
    List<PackageItemModel> parsedItems = rawItems.map((i) => PackageItemModel.fromJson(i)).toList();

    return PackageModel(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'],
      offeringType: json['offering_type'] ?? 'package',
      category: json['category'] ?? 'marketing',
      priceType: json['price_type'] ?? 'fixed',
      priceText: json['price_text'] ?? 'Por definir en reunión',
      price: json['base_price'] ?? json['price'] ?? 0.0,
      isActive: json['is_active'] ?? true,
      items: parsedItems,
      createdAt: json['created_at'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'offering_type': offeringType,
      'category': category,
      'price_type': priceType,
      'price_text': priceText,
      'base_price': price,
      'is_active': isActive,
      'items': items.map((i) => i.toJson()).toList(),
    };
  }
}
