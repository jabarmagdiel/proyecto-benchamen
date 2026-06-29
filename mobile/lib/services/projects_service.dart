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
    if (response is List) {
      return response.map((json) => Project.fromJson(json)).toList();
    }
    return [];
  }

  Future<Project> createProject(Map<String, dynamic> data) async {
    final response = await _apiService.post('/projects', data);
    return Project.fromJson(response);
  }

  Future<Project> updateProject(int id, Map<String, dynamic> data) async {
    final response = await _apiService.put('/projects/$id', data);
    return Project.fromJson(response);
  }

  Future<void> deleteProject(int id) async {
    await _apiService.delete('/projects/$id');
  }
}
