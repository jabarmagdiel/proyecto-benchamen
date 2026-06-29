import 'dart:convert';
import 'api_service.dart';
import '../models/package_model.dart';

class PackagesService {
  final ApiService _apiService = ApiService();

  Future<List<PackageModel>> getPackages() async {
    final response = await _apiService.get('/packages');
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => PackageModel.fromJson(json)).toList();
    }
    return [];
  }

  Future<PackageModel> createPackage(Map<String, dynamic> data) async {
    final response = await _apiService.post('/packages', data);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return PackageModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al crear paquete');
  }

  Future<PackageModel> updatePackage(int id, Map<String, dynamic> data) async {
    final response = await _apiService.put('/packages/$id', data);
    if (response.statusCode == 200) {
      return PackageModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al actualizar paquete');
  }

  Future<void> deletePackage(int id) async {
    await _apiService.delete('/packages/$id');
  }
}
