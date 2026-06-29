import 'dart:convert';
import 'api_service.dart';
import '../models/department_model.dart';

class DepartmentsService {
  final ApiService _apiService = ApiService();

  Future<List<DepartmentModel>> getDepartments() async {
    final response = await _apiService.get('/departments');
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => DepartmentModel.fromJson(json)).toList();
    }
    return [];
  }

  Future<DepartmentModel> createDepartment(Map<String, dynamic> data) async {
    final response = await _apiService.post('/departments', data);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return DepartmentModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al crear departamento');
  }

  Future<DepartmentModel> updateDepartment(int id, Map<String, dynamic> data) async {
    final response = await _apiService.put('/departments/$id', data);
    if (response.statusCode == 200) {
      return DepartmentModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al actualizar departamento');
  }

  Future<void> deleteDepartment(int id) async {
    await _apiService.delete('/departments/$id');
  }
}
