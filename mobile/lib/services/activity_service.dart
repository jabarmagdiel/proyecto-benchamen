import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/activity.dart';
import 'api_service.dart';

class ActivityService {
  final ApiService _api = ApiService();

  Future<List<Activity>> getMyActivities() async {
    try {
      final response = await _api.get('/activities/my');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Activity.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error getting my activities: $e');
    }
    return [];
  }

  Future<List<Activity>> getPendingApprovals() async {
    try {
      // status=en_revision
      final response = await _api.get('/activities?status=en_revision');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Activity.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error getting approvals: $e');
    }
    return [];
  }
  Future<List<Activity>> getAllActivities({Map<String, dynamic>? params}) async {
    try {
      String query = '';
      if (params != null && params.isNotEmpty) {
        query = '?' + params.entries.map((e) => '${e.key}=${e.value}').join('&');
      }
      final response = await _api.get('/activities$query');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Activity.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error getting all activities: $e');
    }
    return [];
  }

  Future<Activity> createActivity(Map<String, dynamic> data) async {
    final response = await _api.post('/activities', data);
    if (response.statusCode == 200 || response.statusCode == 201) {
      return Activity.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al crear actividad');
  }

  Future<Activity> updateActivity(int id, Map<String, dynamic> data) async {
    final response = await _api.put('/activities/$id', data);
    if (response.statusCode == 200) {
      return Activity.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al actualizar actividad');
  }

  Future<void> deleteActivity(int id) async {
    final response = await _api.delete('/activities/$id');
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Error al eliminar actividad: ${response.statusCode}');
    }
  }
}
