import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  String? _token;
  String? _role;

  String? get token => _token;
  String? get role => _role;
  bool get isAuthenticated => _token != null;

  Future<void> loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _role = prefs.getString('auth_role');
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await _apiService.post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['access_token'];
        _role = data['role'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        await prefs.setString('auth_role', _role!);
        
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Error en login: $e');
    }
    return false;
  }

  Future<void> logout() async {
    _token = null;
    _role = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_role');
    notifyListeners();
  }
}
