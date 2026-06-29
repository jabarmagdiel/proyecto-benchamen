import 'dart:convert';
import 'api_service.dart';
import '../models/project.dart';

class ProjectsService {
  final ApiService _apiService = ApiService();

  Future<List<Project>> getProjects({Map<String, dynamic>? params}) async {
    String query = '';
    if (params != null && params.isNotEmpty) {
      query = '?' + params.entries.map((e) => '${e.key}=${e.value}').join('&');
    }
    final response = await _apiService.get('/projects$query');
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Project.fromJson(json)).toList();
    }
    return [];
  }

  Future<Project> createProject(Map<String, dynamic> data) async {
    final response = await _apiService.post('/projects', data);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return Project.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al crear proyecto');
  }

  Future<Project> updateProject(int id, Map<String, dynamic> data) async {
    final response = await _apiService.put('/projects/$id', data);
    if (response.statusCode == 200) {
      return Project.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al actualizar proyecto');
  }

  Future<void> deleteProject(int id) async {
    await _apiService.delete('/projects/$id');
  }
}
