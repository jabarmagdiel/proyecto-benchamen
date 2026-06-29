import 'dart:convert';
import 'api_service.dart';
import '../models/user_model.dart';

class UsersService {
  final ApiService _apiService = ApiService();

  Future<List<UserModel>> getUsers() async {
    final response = await _apiService.get('/users');
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => UserModel.fromJson(json)).toList();
    }
    return [];
  }

  Future<UserModel> createUser(Map<String, dynamic> data) async {
    final response = await _apiService.post('/users', data);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return UserModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al crear usuario');
  }

  Future<UserModel> updateUser(int id, Map<String, dynamic> data) async {
    final response = await _apiService.put('/users/$id', data);
    if (response.statusCode == 200) {
      return UserModel.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al actualizar usuario');
  }

  Future<void> deleteUser(int id) async {
    await _apiService.delete('/users/$id');
  }
}
