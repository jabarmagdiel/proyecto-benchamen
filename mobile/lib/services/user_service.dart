import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class UserService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final response = await _api.get('/auth/me');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Error getting profile: $e');
    }
    return null;
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _api.put('/users/me/profile', data);
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating profile: $e');
    }
    return false;
  }
}
