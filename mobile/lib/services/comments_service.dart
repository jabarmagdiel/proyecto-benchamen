import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class CommentsService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getComments(int activityId) async {
    try {
      final response = await _api.get('/activities/$activityId/comments');
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Error getting comments: $e');
    }
    return [];
  }

  Future<bool> createComment(int activityId, String content) async {
    try {
      final response = await _api.post('/activities/$activityId/comments', {'content': content});
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error creating comment: $e');
    }
    return false;
  }
}
