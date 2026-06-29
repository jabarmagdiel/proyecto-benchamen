import 'dart:convert';
import 'api_service.dart';
import '../models/company.dart';

class CompaniesService {
  final ApiService _apiService = ApiService();

  Future<List<Company>> getCompanies() async {
    final response = await _apiService.get('/companies');
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Company.fromJson(json)).toList();
    }
    return [];
  }

  Future<Company> createCompany(Map<String, dynamic> data) async {
    final response = await _apiService.post('/companies', data);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return Company.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al crear empresa');
  }

  Future<Company> updateCompany(int id, Map<String, dynamic> data) async {
    final response = await _apiService.put('/companies/$id', data);
    if (response.statusCode == 200) {
      return Company.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al actualizar empresa');
  }

  Future<void> deleteCompany(int id) async {
    await _apiService.delete('/companies/$id'); // requires delete method in ApiService
  }
}
