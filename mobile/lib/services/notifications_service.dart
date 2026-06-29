import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class NotificationsService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getNotifications() async {
    try {
      final response = await _api.get('/notifications?limit=20');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Error getting notifications: $e');
    }
    return [];
  }

  Future<void> markAsRead(int id) async {
    try {
      await _api.post('/notifications/$id/read', {});
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }
}
