class PackageModel {
  final int id;
  final String name;
  final String? description;
  final num price;
  final bool isActive;
  final int videosCount;
  final int droneCount;
  final int artsCount;
  final int templateArtsCount;
  final bool adManagement;
  final String createdAt;

  PackageModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.isActive = true,
    this.videosCount = 0,
    this.droneCount = 0,
    this.artsCount = 0,
    this.templateArtsCount = 0,
    this.adManagement = false,
    required this.createdAt,
  });

  factory PackageModel.fromJson(Map<String, dynamic> json) {
    return PackageModel(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'],
      price: json['base_price'] ?? json['price'] ?? 0.0,
      isActive: json['is_active'] ?? true,
      videosCount: json['videos_count'] ?? 0,
      droneCount: json['drone_count'] ?? 0,
      artsCount: json['arts_count'] ?? 0,
      templateArtsCount: json['template_arts_count'] ?? 0,
      adManagement: json['ad_management'] ?? false,
      createdAt: json['created_at'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'base_price': price,
      'is_active': isActive,
      'videos_count': videosCount,
      'drone_count': droneCount,
      'arts_count': artsCount,
      'template_arts_count': templateArtsCount,
      'ad_management': adManagement,
    };
  }
}
