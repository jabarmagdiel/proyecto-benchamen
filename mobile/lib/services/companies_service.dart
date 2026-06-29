import 'api_service.dart';
import '../models/company.dart';

class CompaniesService {
  final ApiService _apiService = ApiService();

  Future<List<Company>> getCompanies() async {
    final response = await _apiService.get('/companies');
    if (response is List) {
      return response.map((json) => Company.fromJson(json)).toList();
    }
    return [];
  }

  Future<Company> createCompany(Map<String, dynamic> data) async {
    final response = await _apiService.post('/companies', data);
    return Company.fromJson(response);
  }

  Future<Company> updateCompany(int id, Map<String, dynamic> data) async {
    final response = await _apiService.put('/companies/$id', data);
    return Company.fromJson(response);
  }

  Future<void> deleteCompany(int id) async {
    await _apiService.delete('/companies/$id');
  }
}
