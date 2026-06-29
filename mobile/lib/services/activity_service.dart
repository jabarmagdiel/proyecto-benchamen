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
}
